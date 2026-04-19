/**
 * React Hook for fetching transactions from multiple chains via Alchemy
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllChainTransactions,
  getChainTransactions,
  SUPPORTED_CHAINS,
  Transaction,
  TransferCategory,
} from '@/lib/alchemy-service';

export interface UseAlchemyTransactionsOptions {
  /** Wallet address to fetch transactions for */
  address: string | null | undefined;
  /** Chains to fetch from (defaults to all supported chains) */
  chains?: string[];
  /** Maximum number of transactions per chain */
  maxCount?: number;
  /** Transaction categories to fetch */
  category?: TransferCategory[];
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Whether to fetch automatically on mount */
  autoFetch?: boolean;
}

export interface UseAlchemyTransactionsResult {
  /** All fetched transactions sorted by timestamp */
  transactions: Transaction[];
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Manually refresh transactions */
  refetch: () => Promise<void>;
  /** Transactions grouped by chain */
  transactionsByChain: Record<string, Transaction[]>;
  /** Total transaction count */
  totalCount: number;
  /** Last fetch timestamp */
  lastFetched: number | null;
}

export function useAlchemyTransactions({
  address,
  chains,
  maxCount = 100,
  category,
  refreshInterval = 0,
  autoFetch = true,
}: UseAlchemyTransactionsOptions): UseAlchemyTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const txs = await getAllChainTransactions(address, {
        chains,
        maxCount,
        category,
      });
      setTransactions(txs);
      setLastFetched(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      console.error('Error fetching Alchemy transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [address, chains, maxCount, category]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && address) {
      fetchTransactions();
    }
  }, [autoFetch, address, fetchTransactions]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && address) {
      const interval = setInterval(fetchTransactions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, address, fetchTransactions]);

  // Group transactions by chain
  const transactionsByChain = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (!acc[tx.chain]) {
        acc[tx.chain] = [];
      }
      acc[tx.chain].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    transactionsByChain,
    totalCount: transactions.length,
    lastFetched,
  };
}

/**
 * Hook for fetching transactions from a single chain
 */
export function useChainTransactions(
  address: string | null | undefined,
  chainName: string,
  options?: {
    maxCount?: number;
    category?: TransferCategory[];
    refreshInterval?: number;
    autoFetch?: boolean;
  }
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const txs = await getChainTransactions(address, chainName, {
        maxCount: options?.maxCount ?? 100,
        category: options?.category,
      });
      setTransactions(txs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setLoading(false);
    }
  }, [address, chainName, options?.maxCount, options?.category]);

  useEffect(() => {
    if (options?.autoFetch !== false && address) {
      fetchTransactions();
    }
  }, [address, fetchTransactions, options?.autoFetch]);

  useEffect(() => {
    if (options?.refreshInterval && options.refreshInterval > 0 && address) {
      const interval = setInterval(fetchTransactions, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options?.refreshInterval, address, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

/**
 * Get list of supported chains
 */
export function useSupportedChains() {
  return useMemo(() => Object.values(SUPPORTED_CHAINS), []);
}

export default useAlchemyTransactions;
