import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";

export interface TreasuryBalances {
  avax: string;
  tokens: Record<string, { balance: string; symbol: string; decimals: number }>;
}

export function useTreasury(treasuryAddress?: string) {
  const [balances, setBalances] = useState<TreasuryBalances>({
    avax: "0",
    tokens: {},
  });
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!treasuryAddress) {
      setBalances({ avax: "0", tokens: {} });
      return;
    }

    setLoading(true);
    try {
      // Fetch treasury balance from Supabase
      const balanceData = await supabaseService.getUserBalance(treasuryAddress);
      
      if (balanceData) {
      const tokenBalances: Record<string, { balance: string; symbol: string; decimals: number }> = {};
      
        // Map Supabase balance data to frontend format
        if (balanceData.xbgl_balance) {
        tokenBalances["xBGL"] = {
            balance: balanceData.xbgl_balance.toString(),
          symbol: "xBGL",
          decimals: 9,
        };
      }
        if (balanceData.chaos_balance) {
        tokenBalances["CHAOS"] = {
            balance: balanceData.chaos_balance.toString(),
          symbol: "CHAOS",
          decimals: 9,
          };
      }
        if (balanceData.avax_balance) {
          tokenBalances["AVAX"] = {
            balance: balanceData.avax_balance.toString(),
            symbol: "AVAX",
            decimals: 18,
        };
      }
      
      // Use xBGL as AVAX equivalent for display
      setBalances({
          avax: balanceData.xbgl_balance?.toString() || "0",
        tokens: tokenBalances,
      });
      } else {
        setBalances({ avax: "0", tokens: {} });
      }
    } catch (error: any) {
      console.debug("Error fetching treasury balances:", error);
      // Set default balances on error
      setBalances({
        avax: "0",
        tokens: {},
      });
    } finally {
      setLoading(false);
    }
  }, [treasuryAddress]);

  useEffect(() => {
    fetchBalances();
    
    // Subscribe to real-time updates if address provided
    if (treasuryAddress) {
      const subscription = supabaseService.subscribeToUserBalance(treasuryAddress, (balance) => {
        const tokenBalances: Record<string, { balance: string; symbol: string; decimals: number }> = {};
        
        if (balance.xbgl_balance) {
          tokenBalances["xBGL"] = {
            balance: balance.xbgl_balance.toString(),
            symbol: "xBGL",
            decimals: 9,
          };
        }
        if (balance.chaos_balance) {
          tokenBalances["CHAOS"] = {
            balance: balance.chaos_balance.toString(),
            symbol: "CHAOS",
            decimals: 9,
          };
        }
        
        setBalances({
          avax: balance.xbgl_balance?.toString() || "0",
          tokens: tokenBalances,
        });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [treasuryAddress, fetchBalances]);

  return {
    balances,
    loading,
    refresh: fetchBalances,
  };
}


