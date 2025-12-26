/**
 * useChainAccounts Hook
 * Fetches accounts (keys) and their balances from the ChaosStar backend
 */

import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/env";

export interface ChainAccount {
  id: string;
  name: string;
  wallet_address: string;
  public_key: string | null;
  type: string;
  balances: {
    xBGL: string;
    CHAOS: string;
    XEN: string;
  };
}

export function useChainAccounts() {
  const [accounts, setAccounts] = useState<ChainAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/accounts`, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      console.error("Failed to fetch chain accounts:", err);
      setError(err.message || "Failed to fetch accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch balance for a specific address
  const fetchBalance = useCallback(async (address: string) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/balance/${address}`, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err: any) {
      console.error("Failed to fetch balance:", err);
      return null;
    }
  }, []);

  // Get total balance across all accounts
  const getTotalBalance = useCallback((tokenType: "xBGL" | "CHAOS" | "XEN") => {
    return accounts.reduce((total, account) => {
      const balance = parseFloat(account.balances[tokenType]) || 0;
      return total + balance;
    }, 0);
  }, [accounts]);

  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    refresh: fetchAccounts,
    fetchBalance,
    getTotalBalance,
    totalXBGL: getTotalBalance("xBGL"),
    totalCHAOS: getTotalBalance("CHAOS"),
    totalXEN: getTotalBalance("XEN"),
  };
}

