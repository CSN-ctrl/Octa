import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

/**
 * Swap hooks — on-chain DEX path disabled; token moves use Supabase-backed flows.
 */
export function useSwap() {
  const { signer, address, isConnected } = useWallet();
  const [swapping, setSwapping] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const getQuote = useCallback(async (
    amountIn: string,
    tokenOutAddress: string
  ): Promise<{ amountOut: string; priceImpact: number } | null> => {
    if (!amountIn || parseFloat(amountIn) <= 0) return null;
    if (!tokenOutAddress || tokenOutAddress === ethers.ZeroAddress) return null;

    setLoadingQuote(true);
    try {
      throw new Error("Swap functionality disabled - using Supabase only");
    } catch (error: unknown) {
      console.error("Error getting quote:", error);
      toast.error("Failed to get swap quote");
      return null;
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  const swapxBGLForToken = useCallback(async (
    amountIn: string,
    tokenOutAddress: string,
    minAmountOut: string,
    _slippageTolerance: number = 0.5
  ): Promise<string | null> => {
    void minAmountOut;
    if (!isConnected || !signer || !address) {
      toast.error("Please connect your wallet");
      return null;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      toast.error("Please enter a valid amount");
      return null;
    }

    if (!tokenOutAddress || tokenOutAddress === ethers.ZeroAddress) {
      toast.error("Please select a token");
      return null;
    }

    setSwapping(true);
    try {
      throw new Error("Swap functionality disabled - using Supabase only");
    } catch (error: unknown) {
      console.error("Swap error:", error);
      const message = error instanceof Error ? error.message : "Swap failed";
      toast.error(message);
      return null;
    } finally {
      setSwapping(false);
    }
  }, [isConnected, signer, address]);

  const swapTokenForxBGL = useCallback(async (
    tokenInAddress: string,
    amountIn: string,
    minAmountOut: string,
    _slippageTolerance: number = 0.5
  ): Promise<string | null> => {
    void minAmountOut;
    if (!isConnected || !signer || !address) {
      toast.error("Please connect your wallet");
      return null;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      toast.error("Please enter a valid amount");
      return null;
    }

    if (!tokenInAddress || tokenInAddress === ethers.ZeroAddress) {
      toast.error("Please select a token");
      return null;
    }

    setSwapping(true);
    try {
      throw new Error("Swap functionality disabled - using Supabase only");
    } catch (error: unknown) {
      console.error("Swap error:", error);
      const message = error instanceof Error ? error.message : "Swap failed";
      toast.error(message);
      return null;
    } finally {
      setSwapping(false);
    }
  }, [isConnected, signer, address]);

  return {
    swapping,
    loadingQuote,
    getQuote,
    swapxBGLForToken,
    swapTokenForxBGL,
  };
}
