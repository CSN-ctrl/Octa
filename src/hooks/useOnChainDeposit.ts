import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { getPaymentChainId } from "@/config/blockchain-profile";
import {
  depositAvaxForXbgl,
  getOnChainDepositQuote,
  getOnChainXbglPerAvaxRate,
} from "@/lib/onchain-deposit";
import {
  fetchOnChainDepositsForUser,
  recordOnChainDeposit,
  type OnChainDepositStatus,
} from "@/lib/deposits";

export type OnChainDepositHistoryRow = {
  txHash: string;
  avaxAmount: number;
  xbglAmount: number;
  at: string;
  /** undefined when the status column is not yet present in the DB schema. */
  status: OnChainDepositStatus | undefined;
};

const HISTORY_KEY = "octa_onchain_deposits_v1";

function readHistory(): OnChainDepositHistoryRow[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OnChainDepositHistoryRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendHistory(row: OnChainDepositHistoryRow) {
  const next = [row, ...readHistory()].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

/** On-chain AVAX→xBGL only — no Supabase deposit ledger. */
export function useOnChainDeposit() {
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<OnChainDepositHistoryRow[]>([]);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  const reloadExchangeRate = useCallback(async () => {
    if (!isOnChainCryptoMode()) return;
    const rate = await getOnChainXbglPerAvaxRate();
    setExchangeRate(rate);
  }, []);

  const loadHistory = useCallback(async () => {
    const local = readHistory();
    const remote = await fetchOnChainDepositsForUser();
    const byHash = new Map<string, OnChainDepositHistoryRow>();
    for (const row of remote) {
      byHash.set(row.tx_hash.toLowerCase(), {
        txHash: row.tx_hash,
        avaxAmount: row.avax_amount,
        xbglAmount: row.xbgl_amount,
        at: row.created_at,
        status: row.status,
      });
    }
    for (const row of local) {
      if (!byHash.has(row.txHash.toLowerCase())) {
        byHash.set(row.txHash.toLowerCase(), row);
      }
    }
    setHistory(
      [...byHash.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 30),
    );
  }, []);

  useEffect(() => {
    if (!isOnChainCryptoMode()) return;
    void loadHistory();
    void reloadExchangeRate();
  }, [loadHistory, reloadExchangeRate]);

  const quoteAvaxForXbgl = useCallback(async (xbglHuman: number) => {
    const rate = exchangeRate > 0 ? exchangeRate : await getOnChainXbglPerAvaxRate();
    if (rate <= 0) return null;
    const avaxHuman = xbglHuman / rate;
    return getOnChainDepositQuote(avaxHuman);
  }, [exchangeRate]);

  const depositWithWallet = useCallback(
    async (signer: ethers.Signer, avaxHuman: number) => {
      setLoading(true);
      setPendingTxHash(null);
      try {
        const { txHash, xbglOut } = await depositAvaxForXbgl(
          signer,
          avaxHuman,
          undefined,
          (hash) => setPendingTxHash(hash),
        );
        const row: OnChainDepositHistoryRow = {
          txHash,
          avaxAmount: avaxHuman,
          xbglAmount: parseFloat(ethers.formatEther(xbglOut)),
          at: new Date().toISOString(),
          status: "pending",
        };
        appendHistory(row);
        const signerAddr = await signer.getAddress();
        void recordOnChainDeposit({
          tx_hash: txHash,
          wallet_address: signerAddr,
          chain_id: getPaymentChainId(),
          avax_amount: avaxHuman,
          xbgl_amount: row.xbglAmount,
        }).then(() => loadHistory());
        setHistory(readHistory());
        toast.success(
          `Received ${row.xbglAmount.toFixed(4)} xBGL on-chain`,
          { description: `Tx ${txHash.slice(0, 10)}…` },
        );
        return { ok: true as const, txHash, xbglOut };
      } catch (err: unknown) {
        const e = err as { reason?: string; message?: string };
        toast.error(e.reason || e.message || "Deposit failed");
        return { ok: false as const };
      } finally {
        setLoading(false);
        setPendingTxHash(null);
      }
    },
    [loadHistory],
  );

  return {
    exchangeRate,
    loading,
    history,
    pendingTxHash,
    reloadExchangeRate,
    quoteAvaxForXbgl,
    depositWithWallet,
    refresh: () => void loadHistory(),
  };
}
