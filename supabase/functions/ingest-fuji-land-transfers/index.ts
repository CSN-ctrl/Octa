/**
 * Fuji land-transfer indexer for SaraktLandV2 (ERC1155).
 *
 * Scans two events from the land contract on every cron invocation:
 *
 *   • TransferSingle(address operator, address from, address to, uint256 id, uint256 value)
 *     — ERC1155 ownership transfer; indexed when `to != 0x0` and `value > 0`.
 *
 *   • LandMinted(uint256 plotId, address owner, uint256 pricePaid, bool coldWallet, uint256 timestamp)
 *     — Emitted on plot activation/mint.
 *
 * For each accepted event, calls sync_chain_plot_ownership(plot_id, owner_wallet, tx_hash)
 * via service-role key to keep plots.owner_wallet in sync with on-chain state.
 *
 * Checkpoint: treasury_ingest_checkpoints.chain_id = 'fuji-land'
 * Contract:   SaraktLandV2 @ 0xc34a5fcb5621b7755d66db5074069d0bbd68cd42 (Fuji/43113)
 * Auth:       INGEST_CRON_SECRET header guard (same pattern as ingest-fuji-deposits)
 *
 * Event topic hashes (keccak256):
 *   TransferSingle: 0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62
 *   LandMinted:     computed at module load from canonical signature
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1/sha3";

// ─── constants ────────────────────────────────────────────────────────────────

const FUJI_LAND_CHAIN_NAME = "fuji-land";
const DEFAULT_LAND_ADDRESS = "0xc34a5fcb5621b7755d66db5074069d0bbd68cd42";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Maximum blocks per eth_getLogs call. Alchemy Fuji supports up to 2048 before
 * returning a block-range error; 2000 gives a safe margin.
 */
const MAX_BLOCKS_PER_CHUNK = 2000;

/**
 * Maximum chunks per function invocation to stay within the 60-second edge
 * function timeout (10 × 2000 = 20 000 blocks ≈ 5–6 hours of Fuji history).
 */
const MAX_CHUNKS_PER_RUN = 10;

// ─── keccak helper ────────────────────────────────────────────────────────────

function keccakId(text: string): string {
  const hash = keccak_256(new TextEncoder().encode(text));
  return "0x" + [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * keccak256("TransferSingle(address,address,address,uint256,uint256)")
 * ERC1155 standard transfer event — topics[1]=operator, [2]=from, [3]=to.
 */
const TRANSFER_SINGLE_TOPIC = keccakId(
  "TransferSingle(address,address,address,uint256,uint256)",
);

/**
 * keccak256("LandMinted(uint256,address,uint256,bool,uint256)")
 * Emitted by SaraktLandV2 when a plot is activated — topics[1]=plotId, [2]=owner.
 */
const LAND_MINTED_TOPIC = keccakId(
  "LandMinted(uint256,address,uint256,bool,uint256)",
);

// ─── types ────────────────────────────────────────────────────────────────────

type RpcLog = {
  transactionHash: string;
  blockNumber: string;
  logIndex: string;
  topics: string[];
  data: string;
  removed?: boolean;
};

type CheckpointRow = {
  last_ingested_block: number | null;
  total_ingested_count: number | null;
};

type PlotOwnershipEvent = {
  plotId: number;
  ownerWallet: string;
  txHash: string;
  blockNum: number;
  source: "TransferSingle" | "LandMinted";
};

// ─── ABI decode ───────────────────────────────────────────────────────────────

/**
 * Decodes a TransferSingle log entry.
 *
 * ABI layout:
 *   topics[0] = selector
 *   topics[1] = operator  (indexed address, zero-padded to 32 bytes)
 *   topics[2] = from      (indexed address)
 *   topics[3] = to        (indexed address)
 *   data      = abi.encode(id uint256, value uint256)  → 64 bytes / 128 hex chars
 *
 * Returns null when the event should be skipped (removed log, wrong topic,
 * to == 0x0 burn, or value == 0).
 */
function decodeTransferSingle(log: RpcLog): PlotOwnershipEvent | null {
  if (log.removed) return null;
  if (log.topics.length < 4) return null;
  if (log.topics[0].toLowerCase() !== TRANSFER_SINGLE_TOPIC) return null;

  const to = "0x" + log.topics[3].slice(-40);
  if (to === ZERO_ADDRESS) return null;

  const rawData = log.data.startsWith("0x") ? log.data.slice(2) : log.data;
  if (rawData.length < 128) return null;

  const plotId = Number(BigInt("0x" + rawData.slice(0, 64)));
  const value = BigInt("0x" + rawData.slice(64, 128));
  if (value === 0n) return null;

  return {
    plotId,
    ownerWallet: to.toLowerCase(),
    txHash: log.transactionHash.toLowerCase(),
    blockNum: Number.parseInt(log.blockNumber, 16),
    source: "TransferSingle",
  };
}

/**
 * Decodes a LandMinted log entry.
 *
 * ABI layout:
 *   topics[0] = selector
 *   topics[1] = plotId  (indexed uint256)
 *   topics[2] = owner   (indexed address, zero-padded to 32 bytes)
 *   data      = abi.encode(pricePaid uint256, coldWallet bool, timestamp uint256)
 */
function decodeLandMinted(log: RpcLog): PlotOwnershipEvent | null {
  if (log.removed) return null;
  if (log.topics.length < 3) return null;
  if (log.topics[0].toLowerCase() !== LAND_MINTED_TOPIC) return null;

  const plotId = Number(BigInt(log.topics[1]));
  const owner = "0x" + log.topics[2].slice(-40);
  if (owner === ZERO_ADDRESS) return null;

  return {
    plotId,
    ownerWallet: owner.toLowerCase(),
    txHash: log.transactionHash.toLowerCase(),
    blockNum: Number.parseInt(log.blockNumber, 16),
    source: "LandMinted",
  };
}

// ─── RPC helpers ──────────────────────────────────────────────────────────────

async function getCurrentBlock(rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: [],
    }),
  });
  if (!res.ok) throw new Error(`Fuji eth_blockNumber HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) {
    throw new Error(
      `Fuji eth_blockNumber: ${body.error.message ?? JSON.stringify(body.error)}`,
    );
  }
  return Number.parseInt(body.result, 16);
}

/**
 * Fetches logs matching TransferSingle OR LandMinted from the land contract.
 * Uses a topics[0] OR-array so both event types arrive in one RPC call.
 */
async function fetchLandLogsChunk(
  rpcUrl: string,
  contractAddress: string,
  fromBlock: number,
  toBlock: number,
): Promise<RpcLog[]> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "eth_getLogs",
      params: [
        {
          address: contractAddress,
          topics: [[TRANSFER_SINGLE_TOPIC, LAND_MINTED_TOPIC]],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Fuji eth_getLogs HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) {
    throw new Error(
      `Fuji eth_getLogs: ${body.error.message ?? JSON.stringify(body.error)}`,
    );
  }
  return (body.result ?? []) as RpcLog[];
}

// ─── handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get("INGEST_CRON_SECRET");
  if (cronSecret) {
    const incoming = req.headers.get("x-cron-secret") ?? "";
    if (incoming !== cronSecret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const alchemyApiKey = Deno.env.get("ALCHEMY_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !alchemyApiKey) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ALCHEMY_API_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const landAddress = (
    Deno.env.get("FUJI_LAND_ADDRESS") ?? DEFAULT_LAND_ADDRESS
  ).toLowerCase();

  /**
   * FUJI_LAND_START_BLOCK – earliest block to scan when no checkpoint exists.
   * Set this to the SaraktLandV2 deployment block to avoid scanning
   * pre-deployment history on first run.
   */
  const startBlock = Number.parseInt(
    Deno.env.get("FUJI_LAND_START_BLOCK") ?? "0",
  );

  const fujiRpcUrl = `https://avax-fuji.g.alchemy.com/v2/${alchemyApiKey}`;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── load checkpoint ─────────────────────────────────────────────────────────
  const { data: cpData } = await supabase
    .from("treasury_ingest_checkpoints")
    .select("last_ingested_block,total_ingested_count")
    .eq("chain_id", FUJI_LAND_CHAIN_NAME)
    .maybeSingle();

  const checkpoint = cpData as CheckpointRow | null;
  const checkpointBlock = Number(checkpoint?.last_ingested_block ?? 0);
  const totalIngestedCount = Number(checkpoint?.total_ingested_count ?? 0);

  const fromBlock = checkpointBlock > 0
    ? checkpointBlock + 1
    : Math.max(0, startBlock);

  // ── mark run started ────────────────────────────────────────────────────────
  await supabase.from("treasury_ingest_checkpoints").upsert(
    {
      chain_id: FUJI_LAND_CHAIN_NAME,
      last_run_started_at: new Date().toISOString(),
      last_run_status: "running",
      last_run_error: null,
    },
    { onConflict: "chain_id" },
  );

  // ── resolve latest block ────────────────────────────────────────────────────
  let latestBlock: number;
  try {
    latestBlock = await getCurrentBlock(fujiRpcUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("treasury_ingest_checkpoints").upsert(
      {
        chain_id: FUJI_LAND_CHAIN_NAME,
        last_run_completed_at: new Date().toISOString(),
        last_run_status: "error",
        last_run_error: msg,
      },
      { onConflict: "chain_id" },
    );
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (fromBlock > latestBlock) {
    await supabase.from("treasury_ingest_checkpoints").upsert(
      {
        chain_id: FUJI_LAND_CHAIN_NAME,
        last_ingested_block: checkpointBlock,
        last_ingested_at: new Date().toISOString(),
        last_run_completed_at: new Date().toISOString(),
        last_run_status: "ok",
        last_run_error: null,
        total_ingested_count: totalIngestedCount,
      },
      { onConflict: "chain_id" },
    );
    return new Response(
      JSON.stringify({
        chain: FUJI_LAND_CHAIN_NAME,
        message: "no new blocks",
        fromBlock,
        latestBlock,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ── process blocks in chunks ────────────────────────────────────────────────
  let synced = 0;
  let skipped = 0;
  let failures = 0;
  let totalFetched = 0;
  let maxSeenBlock = checkpointBlock;
  const errors: string[] = [];
  let currentFrom = fromBlock;
  let chunksProcessed = 0;

  while (currentFrom <= latestBlock && chunksProcessed < MAX_CHUNKS_PER_RUN) {
    const currentTo = Math.min(
      currentFrom + MAX_BLOCKS_PER_CHUNK - 1,
      latestBlock,
    );

    let logs: RpcLog[];
    try {
      logs = await fetchLandLogsChunk(
        fujiRpcUrl,
        landAddress,
        currentFrom,
        currentTo,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      failures++;
      // Abort; checkpoint retries from currentFrom on the next invocation.
      break;
    }

    totalFetched += logs.length;

    for (const log of logs) {
      let event: PlotOwnershipEvent | null = null;

      const topic0 = log.topics[0]?.toLowerCase();
      if (topic0 === TRANSFER_SINGLE_TOPIC) {
        event = decodeTransferSingle(log);
      } else if (topic0 === LAND_MINTED_TOPIC) {
        event = decodeLandMinted(log);
      }

      if (!event) continue;

      if (event.blockNum > maxSeenBlock) maxSeenBlock = event.blockNum;

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "sync_chain_plot_ownership",
        {
          p_plot_id: event.plotId,
          p_owner_wallet: event.ownerWallet,
          p_tx_hash: event.txHash,
        },
      );

      if (rpcError) {
        const msg =
          `plot ${event.plotId} tx ${event.txHash}: ${rpcError.message}`;
        errors.push(msg);
        failures++;

        await supabase.from("treasury_ingest_failures").insert({
          chain_id: FUJI_LAND_CHAIN_NAME,
          source_tx_hash: event.txHash,
          source_block_num: event.blockNum,
          error_message: rpcError.message,
          payload: {
            plotId: event.plotId,
            ownerWallet: event.ownerWallet,
            txHash: event.txHash,
            source: event.source,
          },
          last_seen_at: new Date().toISOString(),
          status: "open",
        });
        continue;
      }

      const result = rpcResult as
        | { success: boolean; error?: string; plot_id?: number }
        | null;

      if (!result?.success) {
        // plot_id not yet in the DB (plot pre-dates indexer or not registered yet);
        // log as skipped rather than a hard failure — re-check is safe on replay.
        skipped++;
        console.warn(
          `sync_chain_plot_ownership: plot ${event.plotId} not found (${result?.error ?? "unknown"})`,
        );
        continue;
      }

      synced++;

      // Best-effort: resolve any pre-existing open failure row for this tx.
      await supabase
        .from("treasury_ingest_failures")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .eq("chain_id", FUJI_LAND_CHAIN_NAME)
        .eq("source_tx_hash", event.txHash)
        .eq("status", "open");
    }

    // Advance checkpoint to the end of the processed chunk even when no logs
    // were found, preventing redundant re-scans of empty block ranges.
    if (currentTo > maxSeenBlock) maxSeenBlock = currentTo;
    currentFrom = currentTo + 1;
    chunksProcessed++;
  }

  // ── update checkpoint ────────────────────────────────────────────────────────
  const targetBlock = Math.max(checkpointBlock, maxSeenBlock);
  const runStatus = failures > 0 ? "partial" : "ok";

  await supabase.from("treasury_ingest_checkpoints").upsert(
    {
      chain_id: FUJI_LAND_CHAIN_NAME,
      last_ingested_block: targetBlock,
      last_ingested_at: new Date().toISOString(),
      last_run_completed_at: new Date().toISOString(),
      last_run_status: runStatus,
      last_run_error: errors[0] ?? null,
      total_ingested_count: totalIngestedCount + synced,
    },
    { onConflict: "chain_id" },
  );

  return new Response(
    JSON.stringify({
      chain: FUJI_LAND_CHAIN_NAME,
      fetched: totalFetched,
      synced,
      skipped,
      failures,
      startBlock: fromBlock,
      endBlock: targetBlock,
      latestBlock,
      chunksProcessed,
      errors: errors.slice(0, 5),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
