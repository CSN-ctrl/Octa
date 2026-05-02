/**
 * useChainAccounts Hook
 * Fetches accounts (keys) and their balances from Supabase
 */

import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";

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
      // Get all user balances from Supabase
      const balances = await supabaseService.getAllUserBalances();
      
      // Convert to ChainAccount format
      const accountsData: ChainAccount[] = balances.map((balance) => ({
        id: balance.wallet_address,
        name: `Account ${balance.wallet_address.slice(0, 6)}...${balance.wallet_address.slice(-4)}`,
        wallet_address: balance.wallet_address,
        public_key: null,
        type: "wallet",
        balances: {
          xBGL: (balance.xbgl_balance || 0).toString(),
          CHAOS: (balance.chaos_balance || 0).toString(),
          XEN: "0", // Not stored in user_balances, would need to add if needed
        },
      }));
      
      setAccounts(accountsData);
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
      const balance = await supabaseService.getUserBalance(address);
      if (balance) {
        return {
          xBGL: (balance.xbgl_balance || 0).toString(),
          CHAOS: (balance.chaos_balance || 0).toString(),
          XEN: "0",
        };
      }
      return {
        xBGL: "0",
        CHAOS: "0",
        XEN: "0",
      };
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

