/**
 * Transaction history from payment-rail RPC logs (chain 1337 / Fuji).
 */

import { ethers } from "ethers";
import { getPaymentChainId } from "@/config/blockchain-profile";
import { getPaymentJsonRpcProvider } from "@/lib/evm-provider";
import { LAND_CONTRACT_ABI, ERC20_ABI } from "@/lib/contracts";
import {
  loadPaymentContractAddresses,
  PAYMENT_CONTRACT_ADDRESSES,
} from "@/lib/payment-contracts";

const TREASURY_EVENTS_ABI = [
  "event AvaxSwappedForXbgl(address indexed buyer, uint256 avaxIn, uint256 xbglOut)",
] as const;

const LOOKBACK_BLOCKS = 500_000;

export type OnChainHistoryRow = {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: "success" | "pending" | "failed" | "completed";
  type:
    | "transfer"
    | "contract"
    | "plot_transfer"
    | "plot_purchase"
    | "deposit"
    | "other";
  token_type?: string;
  plot_ids?: number[];
  metadata?: Record<string, unknown>;
};

function addressTopic(addr: string): string {
  return ethers.zeroPadValue(ethers.getAddress(addr), 32);
}

function eventTopic(iface: ethers.Interface, name: string): string | null {
  const ev = iface.getEvent(name);
  return ev?.topicHash ?? null;
}

async function blockTimestamp(
  provider: ethers.JsonRpcProvider,
  blockNumber: number,
  cache: Map<number, number>,
): Promise<number> {
  const cached = cache.get(blockNumber);
  if (cached !== undefined) return cached;
  const block = await provider.getBlock(blockNumber);
  const ts = block?.timestamp ?? Math.floor(Date.now() / 1000);
  cache.set(blockNumber, ts);
  return ts;
}

function readDepositHistoryFromStorage(): OnChainHistoryRow[] {
  try {
    const raw = localStorage.getItem("octa_onchain_deposits_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      txHash: string;
      avaxAmount: number;
      xbglAmount: number;
      at: string;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => ({
      id: `deposit-${row.txHash}`,
      hash: row.txHash,
      from: "",
      to: "",
      value: String(row.xbglAmount),
      timestamp: new Date(row.at).getTime() / 1000,
      status: "completed" as const,
      type: "deposit" as const,
      token_type: "xBGL",
      metadata: { avax_amount: row.avaxAmount, xbgl_amount: row.xbglAmount },
    }));
  } catch {
    return [];
  }
}

export async function loadOnChainTransactionHistory(
  walletAddress: string,
  limit = 50,
): Promise<OnChainHistoryRow[]> {
  if (!walletAddress || !ethers.isAddress(walletAddress)) return [];

  await loadPaymentContractAddresses();
  const provider = getPaymentJsonRpcProvider();
  const user = ethers.getAddress(walletAddress);
  const userTopic = addressTopic(user);

  const landAddr = PAYMENT_CONTRACT_ADDRESSES.land;
  const treasuryAddr = PAYMENT_CONTRACT_ADDRESSES.treasury;
  const xbglAddr = PAYMENT_CONTRACT_ADDRESSES.xbglToken;

  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latest - LOOKBACK_BLOCKS);

  const landIface = new ethers.Interface(LAND_CONTRACT_ABI);
  const treasuryIface = new ethers.Interface(TREASURY_EVENTS_ABI);
  const erc20Iface = new ethers.Interface(ERC20_ABI);

  const rows: OnChainHistoryRow[] = [];
  const blockTsCache = new Map<number, number>();
  const seenHashes = new Set<string>();

  const pushRow = async (
    partial: Omit<OnChainHistoryRow, "timestamp"> & { blockNumber: number },
  ) => {
    if (seenHashes.has(partial.hash)) return;
    seenHashes.add(partial.hash);
    const timestamp = await blockTimestamp(provider, partial.blockNumber, blockTsCache);
    rows.push({
      id: partial.id,
      hash: partial.hash,
      from: partial.from,
      to: partial.to,
      value: partial.value,
      status: partial.status,
      type: partial.type,
      token_type: partial.token_type,
      plot_ids: partial.plot_ids,
      metadata: partial.metadata,
      timestamp,
    });
  };

  if (landAddr && ethers.isAddress(landAddr)) {
    const landMinted = eventTopic(landIface, "LandMinted");
    try {
      if (!landMinted) throw new Error("LandMinted event missing from ABI");
      const mintLogs = await provider.getLogs({
        address: landAddr,
        fromBlock,
        toBlock: latest,
        topics: [landMinted, null, userTopic],
      });
      for (const log of mintLogs) {
        const parsed = landIface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        const plotId = Number(parsed.args.plotId);
        const pricePaid = parsed.args.pricePaid as bigint;
        await pushRow({
          id: `land-mint-${log.transactionHash}-${plotId}`,
          hash: log.transactionHash,
          from: landAddr,
          to: user,
          value: ethers.formatEther(pricePaid),
          status: "completed",
          type: "plot_purchase",
          token_type: "xBGL",
          plot_ids: [plotId],
          blockNumber: log.blockNumber,
          metadata: { plot_id: plotId, source: "LandMinted" },
        });
      }
    } catch (e) {
      console.debug("LandMinted log scan failed:", e);
    }

    const transferSingle = eventTopic(landIface, "TransferSingle");
    try {
      if (!transferSingle) throw new Error("TransferSingle event missing from ABI");
      const fromLogs = await provider.getLogs({
        address: landAddr,
        fromBlock,
        toBlock: latest,
        topics: [transferSingle, null, userTopic],
      });
      const toLogs = await provider.getLogs({
        address: landAddr,
        fromBlock,
        toBlock: latest,
        topics: [transferSingle, null, null, userTopic],
      });
      for (const log of [...fromLogs, ...toLogs]) {
        const parsed = landIface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        const from = parsed.args.from as string;
        const to = parsed.args.to as string;
        const plotId = Number(parsed.args.id);
        await pushRow({
          id: `land-transfer-${log.transactionHash}-${plotId}`,
          hash: log.transactionHash,
          from,
          to,
          value: "1",
          status: "completed",
          type: "plot_transfer",
          token_type: "LAND-NFT",
          plot_ids: [plotId],
          blockNumber: log.blockNumber,
          metadata: { plot_id: plotId },
        });
      }
    } catch (e) {
      console.debug("TransferSingle log scan failed:", e);
    }
  }

  if (treasuryAddr && ethers.isAddress(treasuryAddr)) {
    const swapTopic = eventTopic(treasuryIface, "AvaxSwappedForXbgl");
    try {
      if (!swapTopic) throw new Error("AvaxSwappedForXbgl event missing from ABI");
      const swapLogs = await provider.getLogs({
        address: treasuryAddr,
        fromBlock,
        toBlock: latest,
        topics: [swapTopic, userTopic],
      });
      for (const log of swapLogs) {
        const parsed = treasuryIface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        const avaxIn = parsed.args.avaxIn as bigint;
        const xbglOut = parsed.args.xbglOut as bigint;
        await pushRow({
          id: `treasury-swap-${log.transactionHash}`,
          hash: log.transactionHash,
          from: user,
          to: treasuryAddr,
          value: ethers.formatEther(xbglOut),
          status: "completed",
          type: "deposit",
          token_type: "xBGL",
          blockNumber: log.blockNumber,
          metadata: {
            avax_amount: ethers.formatEther(avaxIn),
            xbgl_amount: ethers.formatEther(xbglOut),
            source: "AvaxSwappedForXbgl",
          },
        });
      }
    } catch (e) {
      console.debug("Treasury swap log scan failed:", e);
    }
  }

  if (xbglAddr && ethers.isAddress(xbglAddr)) {
    const transferTopic = eventTopic(erc20Iface, "Transfer");
    try {
      if (!transferTopic) {
        console.debug("ERC20 Transfer event missing from ABI — skipping xBGL transfer logs");
      } else {
      const sent = await provider.getLogs({
        address: xbglAddr,
        fromBlock,
        toBlock: latest,
        topics: [transferTopic, userTopic],
      });
      const received = await provider.getLogs({
        address: xbglAddr,
        fromBlock,
        toBlock: latest,
        topics: [transferTopic, null, userTopic],
      });
      for (const log of [...sent, ...received]) {
        const parsed = erc20Iface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        const from = parsed.args.from as string;
        const to = parsed.args.to as string;
        const value = parsed.args.value as bigint;
        if (from.toLowerCase() === to.toLowerCase()) continue;
        await pushRow({
          id: `xbgl-transfer-${log.transactionHash}-${log.index}`,
          hash: log.transactionHash,
          from,
          to,
          value: ethers.formatEther(value),
          status: "completed",
          type: "transfer",
          token_type: "xBGL",
          blockNumber: log.blockNumber,
        });
      }
      }
    } catch (e) {
      console.debug("xBGL Transfer log scan failed:", e);
    }
  }

  const fromStorage = readDepositHistoryFromStorage().filter(
    (r) => !seenHashes.has(r.hash),
  );
  for (const row of fromStorage) {
    if (row.hash) seenHashes.add(row.hash);
  }

  const merged = [...rows, ...fromStorage]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return merged;
}

export function getOnChainExplorerTxUrl(txHash: string): string | null {
  if (!txHash || !txHash.startsWith("0x")) return null;
  const chainId = getPaymentChainId();
  if (chainId === 43113) return `https://testnet.snowtrace.io/tx/${txHash}`;
  if (chainId === 43114) return `https://snowtrace.io/tx/${txHash}`;
  return null;
}
