import { useState, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";

export type TokenType = "xBGL" | "CHAOS" | "AVAX" | "SC";

export interface TokenBalance {
  xBGL: number;
  CHAOS: number;
  AVAX: number;
  SC: number;
  last_synced: string | null;
}

export function useBlockchain() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Transfer tokens between addresses
   */
  const transfer = useCallback(async (
    toAddress: string,
    amount: number,
    tokenType: TokenType = "xBGL",
    txHash?: string,
    metadata?: Record<string, any>
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const result = await supabaseService.transferTokens(
        address,
        toAddress,
        amount,
        tokenType,
        txHash,
        metadata
      );

      if (!result.success) {
        throw new Error(result.error || "Transfer failed");
      }

      toast.success(`Transferred ${amount} ${tokenType} to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Transfer failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  /**
   * Mint tokens to an address
   */
  const mint = useCallback(async (
    toAddress: string,
    amount: number,
    tokenType: TokenType = "xBGL",
    txHash?: string,
    metadata?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await supabaseService.mintTokens(
        toAddress,
        amount,
        tokenType,
        txHash,
        metadata
      );

      if (!result.success) {
        throw new Error(result.error || "Mint failed");
      }

      toast.success(`Minted ${amount} ${tokenType} to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Mint failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Burn tokens from an address
   */
  const burn = useCallback(async (
    fromAddress: string,
    amount: number,
    tokenType: TokenType = "xBGL",
    txHash?: string,
    metadata?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await supabaseService.burnTokens(
        fromAddress,
        amount,
        tokenType,
        txHash,
        metadata
      );

      if (!result.success) {
        throw new Error(result.error || "Burn failed");
      }

      toast.success(`Burned ${amount} ${tokenType}`);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Burn failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get token balance for current wallet
   */
  const getBalance = useCallback(async (tokenType: TokenType = "xBGL"): Promise<number> => {
    if (!address) return 0;

    try {
      return await supabaseService.getTokenBalance(address, tokenType);
    } catch (err: any) {
      console.error("Error getting balance:", err);
      return 0;
    }
  }, [address]);

  /**
   * Get all token balances for current wallet
   */
  const getAllBalances = useCallback(async (): Promise<TokenBalance> => {
    if (!address) {
      return {
        xBGL: 0,
        CHAOS: 0,
        AVAX: 0,
        SC: 0,
        last_synced: null,
      };
    }

    try {
      return await supabaseService.getAllTokenBalances(address);
    } catch (err: any) {
      console.error("Error getting all balances:", err);
      return {
        xBGL: 0,
        CHAOS: 0,
        AVAX: 0,
        SC: 0,
        last_synced: null,
      };
    }
  }, [address]);

  /**
   * Get total supply of a token
   */
  const getTotalSupply = useCallback(async (tokenType: TokenType = "xBGL"): Promise<number> => {
    try {
      return await supabaseService.getTotalSupply(tokenType);
    } catch (err: any) {
      console.error("Error getting total supply:", err);
      return 0;
    }
  }, []);

  /**
   * Batch transfer tokens
   */
  const batchTransfer = useCallback(async (
    transfers: Array<{
      toAddress: string;
      amount: number;
      tokenType?: TokenType;
    }>
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const batchTransfers = transfers.map(t => ({
        fromAddress: address,
        toAddress: t.toAddress,
        amount: t.amount,
        tokenType: t.tokenType || "xBGL" as TokenType,
      }));

      const results = await supabaseService.batchTransferTokens(batchTransfers);
      
      const successCount = results.filter(r => r.success).length;
      toast.success(`Completed ${successCount}/${transfers.length} transfers`);
      
      return results;
    } catch (err: any) {
      const errorMessage = err.message || "Batch transfer failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  /**
   * Approve token spending
   */
  const approve = useCallback(async (
    spenderAddress: string,
    amount: number,
    tokenType: TokenType = "xBGL"
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const result = await supabaseService.approveTokenSpending(
        address,
        spenderAddress,
        amount,
        tokenType
      );

      if (!result.success) {
        throw new Error(result.error || "Approval failed");
      }

      toast.success(`Approved ${amount} ${tokenType} for ${spenderAddress.slice(0, 6)}...${spenderAddress.slice(-4)}`);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Approval failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  return {
    transfer,
    mint,
    burn,
    getBalance,
    getAllBalances,
    getTotalSupply,
    batchTransfer,
    approve,
    loading,
    error,
  };
}

