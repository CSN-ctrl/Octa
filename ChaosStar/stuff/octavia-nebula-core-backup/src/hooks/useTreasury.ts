import { useState, useEffect, useCallback } from "react";
import { getTreasury } from "@/lib/api";

export interface TreasuryBalances {
  avax: string;
  tokens: Record<string, { balance: string; symbol: string; decimals: number }>;
}

export function useTreasury() {
  const [balances, setBalances] = useState<TreasuryBalances>({
    avax: "0",
    tokens: {},
  });
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch treasury from backend API (VM-native)
      const treasuryData = await getTreasury();
      
      // Backend returns: { address, balance_xbgl, balance_chaos, balance_xen }
      const tokenBalances: Record<string, { balance: string; symbol: string; decimals: number }> = {};
      
      // Map VM token types to frontend format
      if (treasuryData.balance_xbgl) {
        tokenBalances["xBGL"] = {
          balance: treasuryData.balance_xbgl,
          symbol: "xBGL",
          decimals: 9,
        };
      }
      if (treasuryData.balance_chaos) {
        tokenBalances["CHAOS"] = {
          balance: treasuryData.balance_chaos,
          symbol: "CHAOS",
          decimals: 9,
          };
      }
      if (treasuryData.balance_xen) {
        tokenBalances["XEN"] = {
          balance: treasuryData.balance_xen,
          symbol: "XEN",
          decimals: 9,
        };
      }
      
      // Use xBGL as AVAX equivalent for display
      setBalances({
        avax: treasuryData.balance_xbgl || "0",
        tokens: tokenBalances,
      });
    } catch (error: any) {
      console.debug("Error fetching treasury balances from VM:", error);
      // Set default balances on error
      setBalances({
        avax: "0",
        tokens: {},
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    balances,
    loading,
    refresh: fetchBalances,
  };
}


