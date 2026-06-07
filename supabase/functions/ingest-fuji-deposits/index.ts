/**
 * Fuji (Avalanche testnet, chainId 43113) treasury deposit ingestion.
 *
 * Fetches AvaxSwappedForXbgl events from SaraktTreasury via Alchemy Fuji RPC,
 * then calls record_onchain_deposit_service (service-role RPC) to persist each
 * event idempotently into onchain_deposits.
 *
 * Maintains a per-chain checkpoint in treasury_ingest_checkpoints so each block
 * range is processed exactly once across cron invocations.
 *
 * Event: AvaxSwappedForXbgl(address indexed buyer, uint256 avaxIn, uint256 xbglOut)
 * Contract: SaraktTreasury @ 0xee0ba6de15026d00a707a660123c93686c00df58 (Fuji)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1/sha3";

// ─── constants ────────────────────────────────────────────────────────────────

const FUJI_CHAIN_ID = 43113;
const FUJI_CHAIN_NAME = "fuji";
const DEFAULT_TREASURY_ADDRESS = "0xee0ba6de15026d00a707a660123c93686c00df58";

/**
 * Maximum blocks per eth_getLogs call. Alchemy Fuji supports up to 2048 range
 * before it may return a block-range error.
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
 * keccak256("AvaxSwappedForXbgl(address,uint256,uint256)")
 * Computed at module load; used as topics[0] filter in eth_getLogs.
 */
const AVAX_SWAP_TOPIC = keccakId("AvaxSwappedForXbgl(address,uint256,uint256)");

// ─── types ────────────────────────────────────────────────────────────────────

type RpcLog = {
  transactionHash: string;
  blockNumber: string;
  topics: string[];
  data: string;
  removed?: boolean;
};

type DecodedSwapEvent = {
  buyer: string;
  avaxIn: bigint;
  xbglOut: bigint;
};

type CheckpointRow = {
  last_ingested_block: number | null;
  total_ingested_count: number | null;
};

// ─── ABI decode ───────────────────────────────────────────────────────────────

/**
 * Decodes an AvaxSwappedForXbgl log entry.
 *
 * ABI layout:
 *   topics[0] = event selector
 *   topics[1] = buyer  (indexed address, zero-padded to 32 bytes)
 *   data      = abi.encode(avaxIn uint256, xbglOut uint256)  (64 bytes = 128 hex chars)
 */
function decodeAvaxSwapLog(log: RpcLog): DecodedSwapEvent | null {
  if (log.removed) return null;
  if (
    log.topics.length < 2 ||
    log.topics[0].toLowerCase() !== AVAX_SWAP_TOPIC
  ) return null;

  const buyer = "0x" + log.topics[1].slice(-40);
  const rawData = log.data.startsWith("0x") ? log.data.slice(2) : log.data;
  if (rawData.length < 128) return null;

  const avaxIn = BigInt("0x" + rawData.slice(0, 64));
  const xbglOut = BigInt("0x" + rawData.slice(64, 128));
  return { buyer: buyer.toLowerCase(), avaxIn, xbglOut };
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
  if (body.error)
    throw new Error(`Fuji eth_blockNumber: ${body.error.message ?? JSON.stringify(body.error)}`);
  return Number.parseInt(body.result, 16);
}

async function fetchLogsChunk(
  rpcUrl: string,
  contractAddress: string,
  topic: string,
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
          topics: [topic],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Fuji eth_getLogs HTTP ${res.status}`);
  const body = await res.json();
  if (body.error)
    throw new Error(`Fuji eth_getLogs: ${body.error.message ?? JSON.stringify(body.error)}`);
  return (body.result ?? []) as RpcLog[];
}

// ─── handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Optional cron secret guard (mirrors ingest-treasury-deposits pattern).
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

  const treasuryAddress = (
    Deno.env.get("FUJI_TREASURY_ADDRESS") ?? DEFAULT_TREASURY_ADDRESS
  ).toLowerCase();

  /**
   * FUJI_START_BLOCK – earliest block to scan when no checkpoint exists.
   * Set this to the SaraktTreasury deployment block to skip scanning
   * pre-deployment history on first run.
   */
  const startBlock = Number.parseInt(Deno.env.get("FUJI_START_BLOCK") ?? "0");

  /**
   * FUJI_DEPOSIT_CONFIRMATIONS – number of block confirmations required before
   * a deposit event is persisted. Defaults to 3.
   *
   * By capping the scan range at (latestBlock - confirmations) rather than
   * filtering individual events, all events within the scanned range are
   * guaranteed to be confirmed before record_onchain_deposit_service is called.
   * Unconfirmed events in the trailing N blocks are naturally re-scanned on
   * the next cron invocation once they reach the required depth.
   */
  const depositConfirmations = Math.max(
    0,
    Number.parseInt(Deno.env.get("FUJI_DEPOSIT_CONFIRMATIONS") ?? "3"),
  );

  const fujiRpcUrl = `https://avax-fuji.g.alchemy.com/v2/${alchemyApiKey}`;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── load checkpoint ─────────────────────────────────────────────────────────
  const { data: cpData } = await supabase
    .from("treasury_ingest_checkpoints")
    .select("last_ingested_block,total_ingested_count")
    .eq("chain_id", FUJI_CHAIN_NAME)
    .maybeSingle();

  const checkpoint = cpData as CheckpointRow | null;
  const checkpointBlock = Number(checkpoint?.last_ingested_block ?? 0);
  const totalIngestedCount = Number(checkpoint?.total_ingested_count ?? 0);

  // Honour both the operator-configured start block and the stored checkpoint.
  const fromBlock = checkpointBlock > 0
    ? checkpointBlock + 1
    : Math.max(0, startBlock);

  // ── mark run started ────────────────────────────────────────────────────────
  await supabase.from("treasury_ingest_checkpoints").upsert(
    {
      chain_id: FUJI_CHAIN_NAME,
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
        chain_id: FUJI_CHAIN_NAME,
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

  // Only scan blocks that have reached the required confirmation depth.
  // Unconfirmed events in the trailing `depositConfirmations` blocks will be
  // picked up on the next cron invocation once they age into the safe window.
  const safeToBlock = latestBlock - depositConfirmations;

  if (fromBlock > safeToBlock) {
    await supabase.from("treasury_ingest_checkpoints").upsert(
      {
        chain_id: FUJI_CHAIN_NAME,
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
        chain: FUJI_CHAIN_NAME,
        message: "no confirmed blocks to scan",
        fromBlock,
        latestBlock,
        safeToBlock,
        depositConfirmations,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ── process blocks in chunks ────────────────────────────────────────────────
  let inserted = 0;
  let duplicates = 0;
  let failures = 0;
  let totalFetched = 0;
  let maxSeenBlock = checkpointBlock;
  const errors: string[] = [];
  let currentFrom = fromBlock;
  let chunksProcessed = 0;

  while (currentFrom <= safeToBlock && chunksProcessed < MAX_CHUNKS_PER_RUN) {
    const currentTo = Math.min(
      currentFrom + MAX_BLOCKS_PER_CHUNK - 1,
      safeToBlock,
    );

    let logs: RpcLog[];
    try {
      logs = await fetchLogsChunk(
        fujiRpcUrl,
        treasuryAddress,
        AVAX_SWAP_TOPIC,
        currentFrom,
        currentTo,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      failures++;
      // Abort current run; checkpoint will retry from currentFrom next invocation.
      break;
    }

    totalFetched += logs.length;

    for (const log of logs) {
      const decoded = decodeAvaxSwapLog(log);
      if (!decoded) continue;

      const txHash = log.transactionHash.toLowerCase();
      const blockNum = Number.parseInt(log.blockNumber, 16);
      if (blockNum > maxSeenBlock) maxSeenBlock = blockNum;

      // Convert wei amounts to human-readable decimals (18 decimals for both).
      const avaxAmount = Number(decoded.avaxIn) / 1e18;
      const xbglAmount = Number(decoded.xbglOut) / 1e18;
      if (avaxAmount <= 0 || xbglAmount <= 0) continue;

      // Persist via service-role RPC (handles ownership_registry lookup +
      // idempotency via ON CONFLICT on tx_hash).
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "record_onchain_deposit_service",
        {
          p_tx_hash: txHash,
          p_wallet_address: decoded.buyer,
          p_chain_id: FUJI_CHAIN_ID,
          p_avax_amount: avaxAmount,
          p_xbgl_amount: xbglAmount,
        },
      );

      if (rpcError) {
        const msg = `tx ${txHash}: ${rpcError.message}`;
        errors.push(msg);
        failures++;

        // Best-effort failure record; ignore secondary write errors.
        await supabase.from("treasury_ingest_failures").insert({
          chain_id: FUJI_CHAIN_NAME,
          source_tx_hash: txHash,
          source_block_num: blockNum,
          error_message: rpcError.message,
          payload: {
            txHash,
            buyer: decoded.buyer,
            avaxAmount,
            xbglAmount,
            chainId: FUJI_CHAIN_ID,
          },
          last_seen_at: new Date().toISOString(),
          status: "open",
        });
        continue;
      }

      // RPC returns { success: true, duplicate: bool }
      const result = rpcResult as { success: boolean; duplicate?: boolean } | null;
      if (result?.duplicate) {
        duplicates++;
      } else {
        inserted++;
        // Resolve any pre-existing open failure row for this tx.
        await supabase
          .from("treasury_ingest_failures")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .eq("chain_id", FUJI_CHAIN_NAME)
          .eq("source_tx_hash", txHash)
          .eq("status", "open");
      }
    }

    // Advance checkpoint to end of processed chunk even when no logs were found,
    // so we do not re-scan empty block ranges on the next invocation.
    if (currentTo > maxSeenBlock) maxSeenBlock = currentTo;
    currentFrom = currentTo + 1;
    chunksProcessed++;
  }

  // ── update checkpoint ────────────────────────────────────────────────────────
  const targetBlock = Math.max(checkpointBlock, maxSeenBlock);
  const runStatus = failures > 0 ? "partial" : "ok";

  await supabase.from("treasury_ingest_checkpoints").upsert(
    {
      chain_id: FUJI_CHAIN_NAME,
      last_ingested_block: targetBlock,
      last_ingested_at: new Date().toISOString(),
      last_run_completed_at: new Date().toISOString(),
      last_run_status: runStatus,
      last_run_error: errors[0] ?? null,
      total_ingested_count: totalIngestedCount + inserted,
    },
    { onConflict: "chain_id" },
  );

  return new Response(
    JSON.stringify({
      chain: FUJI_CHAIN_NAME,
      fetched: totalFetched,
      inserted,
      duplicates,
      failures,
      startBlock: fromBlock,
      endBlock: targetBlock,
      safeToBlock,
      latestBlock,
      depositConfirmations,
      chunksProcessed,
      errors: errors.slice(0, 5),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
