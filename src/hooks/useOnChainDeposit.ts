import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import {
  depositAvaxForXbgl,
  getOnChainDepositQuote,
  getOnChainXbglPerAvaxRate,
} from "@/lib/onchain-deposit";

export type OnChainDepositHistoryRow = {
  txHash: string;
  avaxAmount: number;
  xbglAmount: number;
  at: string;
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

  const reloadExchangeRate = useCallback(async () => {
    if (!isOnChainCryptoMode()) return;
    const rate = await getOnChainXbglPerAvaxRate();
    setExchangeRate(rate);
  }, []);

  useEffect(() => {
    if (!isOnChainCryptoMode()) return;
    setHistory(readHistory());
    void reloadExchangeRate();
  }, [reloadExchangeRate]);

  const quoteAvaxForXbgl = useCallback(async (xbglHuman: number) => {
    const rate = exchangeRate > 0 ? exchangeRate : await getOnChainXbglPerAvaxRate();
    if (rate <= 0) return null;
    const avaxHuman = xbglHuman / rate;
    return getOnChainDepositQuote(avaxHuman);
  }, [exchangeRate]);

  const depositWithWallet = useCallback(
    async (signer: ethers.Signer, avaxHuman: number) => {
      setLoading(true);
      try {
        const { txHash, xbglOut } = await depositAvaxForXbgl(signer, avaxHuman);
        const row: OnChainDepositHistoryRow = {
          txHash,
          avaxAmount: avaxHuman,
          xbglAmount: parseFloat(ethers.formatEther(xbglOut)),
          at: new Date().toISOString(),
        };
        appendHistory(row);
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
      }
    },
    [],
  );

  return {
    exchangeRate,
    loading,
    history,
    reloadExchangeRate,
    quoteAvaxForXbgl,
    depositWithWallet,
    refresh: () => setHistory(readHistory()),
  };
}
