import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ChainConfig = {
  id: string;
  chainId: number;
  alchemyNetwork: string;
  usdcAddress: string;
  explorerBase: string;
};

const CHAINS: ChainConfig[] = [
  {
    id: "ethereum",
    chainId: 1,
    alchemyNetwork: "eth-mainnet",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    explorerBase: "https://etherscan.io/tx/",
  },
  {
    id: "polygon",
    chainId: 137,
    alchemyNetwork: "polygon-mainnet",
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    explorerBase: "https://polygonscan.com/tx/",
  },
  {
    id: "arbitrum",
    chainId: 42161,
    alchemyNetwork: "arb-mainnet",
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    explorerBase: "https://arbiscan.io/tx/",
  },
  {
    id: "optimism",
    chainId: 10,
    alchemyNetwork: "opt-mainnet",
    usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    explorerBase: "https://optimistic.etherscan.io/tx/",
  },
  {
    id: "base",
    chainId: 8453,
    alchemyNetwork: "base-mainnet",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorerBase: "https://basescan.org/tx/",
  },
];

type AlchemyTransfer = {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  blockNum: string;
  uniqueId: string;
  rawContract?: {
    value: string | null;
    decimal: number | null;
    address: string | null;
  };
  metadata?: {
    blockTimestamp: string;
  };
};

const hexToBigInt = (value: string | null | undefined): bigint => {
  if (!value) return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
};

function parseAmount(t: AlchemyTransfer): number {
type CheckpointRow = {
  last_ingested_block: number | null;
  total_ingested_count: number | null;
};

function parseAmount(t: AlchemyTransfer): number {
  if (typeof t.value === "number" && Number.isFinite(t.value)) return t.value;
  const raw = t.rawContract?.value;
  const decimals = t.rawContract?.decimal ?? 6;
  if (!raw) return 0;
  const base = Number.parseFloat(raw);
  if (!Number.isFinite(base)) return 0;
  return base / Math.pow(10, decimals);
}

function parseBlockNum(hexOrDecimal: string | null | undefined): number {
  if (!hexOrDecimal) return 0;
  const raw = String(hexOrDecimal).trim();
  if (!raw) return 0;
  const value = raw.startsWith("0x") ? Number.parseInt(raw, 16) : Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : 0;
}

async function fetchIncomingUSDCTransfersPage(
  chain: ChainConfig,
  treasuryWallet: string,
  apiKey: string,
  fromBlockHex: string,
  pageKey?: string,
): Promise<AlchemyTransfersResponse> {
  const url = `https://${chain.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
  const params: Record<string, unknown> = {
    fromBlock: fromBlockHex,
    toBlock: "latest",
    category: ["erc20"],
    toAddress: treasuryWallet,
    contractAddresses: [chain.usdcAddress],
    withMetadata: true,
    maxCount: "0x64",
    excludeZeroValue: true,
  };
  if (pageKey) {
    params.pageKey = pageKey;
  }
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [params],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Alchemy ${chain.id} error ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || `Alchemy ${chain.id} RPC error`);
  return {
    transfers: (body.result?.transfers || []) as AlchemyTransfer[],
    pageKey: body.result?.pageKey as string | undefined,
  };
}

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get("INGEST_CRON_SECRET");
  if (cronSecret) {
    const incoming = req.headers.get("x-cron-secret") || "";
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
  const treasuryWallet = (
    Deno.env.get("TREASURY_WALLET") ||
    "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33"
  ).toLowerCase();

  if (!supabaseUrl || !serviceRoleKey || !alchemyApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ALCHEMY_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let requestBody: IngestRequestBody = {};
  if (req.method === "POST") {
    try {
      requestBody = (await req.json()) as IngestRequestBody;
    } catch {
      requestBody = {};
    }
  }
  const replaySourceTxHash = requestBody.replay_source_tx_hash?.trim().toLowerCase() || null;
  const requestedChain = requestBody.chain_id?.trim().toLowerCase() || null;
  const summary: Record<string, {
    fetched: number;
    inserted: number;
    duplicates: number;
    failures: number;
    startBlock: number;
    endBlock: number;
    replaySourceTxHash: string | null;
    errors: string[];
  }> = {};

  const chainsToProcess = requestedChain
    ? CHAINS.filter((c) => c.id === requestedChain)
    : CHAINS;

  if (requestedChain && chainsToProcess.length === 0) {
    return new Response(JSON.stringify({ error: "invalid chain_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const chain of chainsToProcess) {
    summary[chain.id] = {
      fetched: 0,
      inserted: 0,
      duplicates: 0,
      failures: 0,
      startBlock: 0,
      endBlock: 0,
      replaySourceTxHash,
      errors: [],
    };
    try {
      const { data: checkpointData } = await supabase
        .from("treasury_ingest_checkpoints")
        .select("last_ingested_block,total_ingested_count")
        .eq("chain_id", chain.id)
        .maybeSingle();
      const checkpointRow = checkpointData as CheckpointRow | null;

      const checkpointBlock = Number(checkpointRow?.last_ingested_block ?? 0);
      const totalIngestedCount = Number(checkpointRow?.total_ingested_count ?? 0);
      const fromBlock = replaySourceTxHash ? 0 : Math.max(0, checkpointBlock + 1);
      summary[chain.id].startBlock = fromBlock;

      await supabase.from("treasury_ingest_checkpoints").upsert({
        chain_id: chain.id,
        last_run_started_at: new Date().toISOString(),
        last_run_status: "running",
        last_run_error: null,
      }, { onConflict: "chain_id" });

      let pageKey: string | undefined;
      let maxSeenBlock = checkpointBlock;
      do {
        const page = await fetchIncomingUSDCTransfersPage(
          chain,
          treasuryWallet,
          alchemyApiKey,
          `0x${fromBlock.toString(16)}`,
          pageKey,
        );
        pageKey = page.pageKey;
        const transfers = replaySourceTxHash
          ? page.transfers.filter((t) => t.hash?.toLowerCase() === replaySourceTxHash)
          : page.transfers;
        summary[chain.id].fetched += transfers.length;

        for (const t of transfers) {
          if (!t.hash || !t.from || !t.to) continue;
          const amount = parseAmount(t);
          if (!Number.isFinite(amount) || amount <= 0) continue;
          const sourceTxHash = t.hash.toLowerCase();
          const sourceBlockNum = parseBlockNum(t.blockNum);
          if (sourceBlockNum > maxSeenBlock) {
            maxSeenBlock = sourceBlockNum;
          }

          const uniqueTxHash = `${sourceTxHash}_${chain.id}`;
          const txPayload = {
            from_address: t.from.toLowerCase(),
            to_address: t.to.toLowerCase(),
            amount,
            token_type: "USDC",
            transaction_type: "transfer_in",
            type: "erc20",
            status: "completed",
            tx_hash: uniqueTxHash,
            metadata: {
              chain: chain.id,
              chainId: chain.chainId,
              explorerUrl: `${chain.explorerBase}${t.hash}`,
              source_tx_hash: sourceTxHash,
              source_unique_id: t.uniqueId,
              source_block_num: sourceBlockNum,
              source_timestamp: t.metadata?.blockTimestamp || null,
              ingested_by: "edge_function_ingest_treasury_deposits",
            },
          };

          const { error } = await supabase.from("transactions").upsert(txPayload, {
            onConflict: "tx_hash",
            ignoreDuplicates: false,
          });
          if (error) {
            summary[chain.id].errors.push(error.message);
            summary[chain.id].failures += 1;
            const { data: existingFailureData } = await supabase
              .from("treasury_ingest_failures")
              .select("retry_count")
              .eq("chain_id", chain.id)
              .eq("source_tx_hash", sourceTxHash)
              .maybeSingle();
            const existingFailure = existingFailureData as { retry_count: number | null } | null;
            await supabase.from("treasury_ingest_failures").upsert({
              chain_id: chain.id,
              source_tx_hash: sourceTxHash,
              source_unique_id: t.uniqueId || null,
              source_block_num: sourceBlockNum || null,
              error_message: error.message,
              payload: txPayload,
              last_seen_at: new Date().toISOString(),
              retry_count: Number(existingFailure?.retry_count ?? 0) + 1,
              status: "open",
            }, { onConflict: "chain_id,source_tx_hash" });
            continue;
          }
          summary[chain.id].inserted += 1;
          await supabase
            .from("treasury_ingest_failures")
            .update({
              status: "resolved",
              resolved_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
            })
            .eq("chain_id", chain.id)
            .eq("source_tx_hash", sourceTxHash)
            .eq("status", "open");
        }
      } while (pageKey);

      summary[chain.id].endBlock = maxSeenBlock;
      const runStatus = summary[chain.id].failures > 0 ? "partial" : "ok";
      const targetBlock = replaySourceTxHash ? checkpointBlock : Math.max(checkpointBlock, maxSeenBlock);
      await supabase.from("treasury_ingest_checkpoints").upsert({
        chain_id: chain.id,
        last_ingested_block: targetBlock,
        last_ingested_at: new Date().toISOString(),
        last_run_completed_at: new Date().toISOString(),
        last_run_status: runStatus,
        last_run_error: summary[chain.id].errors[0] || null,
        total_ingested_count: totalIngestedCount + summary[chain.id].inserted,