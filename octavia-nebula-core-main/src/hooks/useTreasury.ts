import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getTreasuryContract, getERC20Contract, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { toast } from "sonner";

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
      const treasuryContract = getTreasuryContract();
      
      // Fetch AVAX balance
      const avaxBalance = await treasuryContract.balanceAVAX();
      
      // Fetch token balances if dummy token address is available
      const tokenBalances: Record<string, { balance: string; symbol: string; decimals: number }> = {};
      
      if (CONTRACT_ADDRESSES.dummyToken) {
        try {
          const tokenContract = getERC20Contract(CONTRACT_ADDRESSES.dummyToken);
          const [balance, decimals, symbol] = await Promise.all([
            treasuryContract.balanceERC20(CONTRACT_ADDRESSES.dummyToken),
            tokenContract.decimals(),
            tokenContract.symbol(),
          ]);
          
          tokenBalances[CONTRACT_ADDRESSES.dummyToken] = {
            balance: ethers.formatUnits(balance, decimals),
            symbol: symbol || "TOKEN",
            decimals: Number(decimals),
          };
        } catch (error) {
          console.warn("Could not fetch token balance:", error);
        }
      }

      setBalances({
        avax: ethers.formatEther(avaxBalance),
        tokens: tokenBalances,
      });
    } catch (error: any) {
      console.error("Error fetching treasury balances:", error);
      toast.error("Failed to fetch treasury balances");
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


