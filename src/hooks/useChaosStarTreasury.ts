/**
 * ChaosStar Treasury Hook
 * Manages treasury operations via the ChaosStar backend
 */

import { useState, useEffect, useCallback } from "react";
import { getChaosStarClient } from "@/lib/chaosstar-client";
import { getApiUrl } from "@/env";
import { toast } from "sonner";
import { TOKENS, TokenType, type Token } from "@/lib/tokens";

export interface TreasuryBalance {
  tokenId: number;
  token: Token;
  balance: string;
  rawBalance: number;
}

export interface TreasuryState {
  balances: TreasuryBalance[];
  totalValueXBGL: number;
  exchangeRates: Record<number, number>;
  isLoading: boolean;
  error: string | null;
}

export function useChaosStarTreasury() {
  const [state, setState] = useState<TreasuryState>({
    balances: [],
    totalValueXBGL: 0,
    exchangeRates: {},
    isLoading: true,
    error: null,
  });

  const client = getChaosStarClient(getApiUrl());

  const fetchTreasury = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await client.getTreasury();
      
      // Map balances to token info
      const balances: TreasuryBalance[] = [];
      let totalValue = 0;

      // Process each token balance
      if (data.balances) {
        for (const [tokenIdStr, rawBalance] of Object.entries(data.balances)) {
          const tokenId = parseInt(tokenIdStr);
          const token = TOKENS[tokenId];
          if (token) {
            const balance = (rawBalance as number / 1e9).toFixed(4);
            balances.push({
              tokenId,
              token,
              balance,
              rawBalance: rawBalance as number,
            });
            
            // Calculate total value (assume 1:1 for now, can use exchange rates)
            totalValue += rawBalance as number / 1e9;
          }
        }
      }

      // If no balances from API, show default tokens with 0
      if (balances.length === 0) {
        Object.values(TOKENS).forEach(token => {
          balances.push({
            tokenId: token.id,
            token,
            balance: "0.0000",
            rawBalance: 0,
          });
        });
      }

      setState({
        balances,
        totalValueXBGL: totalValue,
        exchangeRates: data.exchange_rates || {},
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to fetch treasury:", error);
      
      // Set default empty state with all tokens
      const defaultBalances = Object.values(TOKENS).map(token => ({
        tokenId: token.id,
        token,
        balance: "0.0000",
        rawBalance: 0,
      }));
      
      setState({
        balances: defaultBalances,
        totalValueXBGL: 0,
        exchangeRates: {},
        isLoading: false,
        error: error.message || "Failed to fetch treasury",
      });
    }
  }, [client]);

  const deposit = useCallback(async (
    from: string,
    tokenType: number,
    amount: number
  ): Promise<boolean> => {
    try {
      const result = await client.deposit(from, tokenType, amount);
      if (result.success) {
        toast.success(`Deposited ${amount} ${TOKENS[tokenType]?.symbol || 'tokens'} to treasury`);
        await fetchTreasury();
        return true;
      } else {
        toast.error(result.error || "Deposit failed");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Deposit failed");
      return false;
    }
  }, [client, fetchTreasury]);

  const withdraw = useCallback(async (
    to: string,
    tokenType: number,
    amount: number
  ): Promise<boolean> => {
    try {
      const result = await client.withdraw(to, tokenType, amount);
      if (result.success) {
        toast.success(`Withdrew ${amount} ${TOKENS[tokenType]?.symbol || 'tokens'} from treasury`);
        await fetchTreasury();
        return true;
      } else {
        toast.error(result.error || "Withdrawal failed");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
      return false;
    }
  }, [client, fetchTreasury]);

  const swap = useCallback(async (
    from: string,
    tokenIn: number,
    tokenOut: number,
    amountIn: number,
    minAmountOut: number
  ): Promise<{ success: boolean; amountOut?: number }> => {
    try {
      const result = await client.swapTokens(from, tokenIn, tokenOut, amountIn, minAmountOut);
      if (result.success) {
        toast.success(`Swapped ${amountIn} ${TOKENS[tokenIn]?.symbol} for ${result.amount_out} ${TOKENS[tokenOut]?.symbol}`);
        await fetchTreasury();
        return { success: true, amountOut: result.amount_out };
      } else {
        toast.error(result.error || "Swap failed");
        return { success: false };
      }
    } catch (error: any) {
      toast.error(error.message || "Swap failed");
      return { success: false };
    }
  }, [client, fetchTreasury]);

  // Initial fetch
  useEffect(() => {
    fetchTreasury();
    // No auto-refresh - manual refresh only
  }, [fetchTreasury]);

  return {
    ...state,
    refresh: fetchTreasury,
    deposit,
    withdraw,
    swap,
  };
}

