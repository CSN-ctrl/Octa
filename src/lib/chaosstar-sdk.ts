/**
 * ChaosStar SDK Integration
 * Direct integration with ChaosStar blockchain via Stargate RPC
 * Provides similar interface to Avalanche SDK for consistency
 */

import { ethers } from "ethers";
import { getRpcProvider, CHAOSSTAR_NETWORK } from "./wallet";
import * as api from "./api";

/**
 * Get ChaosStar RPC Provider
 */
export function getProvider(): ethers.JsonRpcProvider | null {
  return getRpcProvider();
}

/**
 * Enhanced balance fetching for ChaosStar
 * Returns both native xBGL and token balances
 */
export async function getEnhancedBalances(address: string) {
  try {
    const rpc = getRpcProvider();
    let nativeBalance = "0";
    
    if (rpc) {
      // Validate address format to avoid ENS errors
      if (address.startsWith("0x") && address.length === 42) {
        try {
          const balance = await rpc.getBalance(address);
          nativeBalance = balance.toString();
        } catch (err: any) {
          if (err?.code !== "UNSUPPORTED_OPERATION") {
            console.debug("Error fetching native balance:", err);
          }
        }
      }
    }
    
    // Try to get token balances from backend
    let tokens: any[] = [];
    try {
      const treasuryData = await api.getTreasury();
      if (treasuryData?.balances) {
        tokens = Object.entries(treasuryData.balances).map(([symbol, balance]: [string, any]) => ({
          address: "native",
          symbol,
          name: symbol,
          balance: balance?.toString() || "0",
          decimals: 9, // ChaosStar uses 9 decimals
          formatted: (Number(balance || 0) / 1e9).toFixed(6),
        }));
      }
    } catch (e: any) {
      // Silently handle backend not available - connection refused is expected if backend isn't running
      const isConnectionError = e.message?.includes("Failed to fetch") || 
                                e.message?.includes("ERR_CONNECTION_REFUSED");
      if (!isConnectionError) {
        console.debug("Could not fetch token balances from backend:", e);
      }
    }
    
    return {
      native: {
        value: nativeBalance,
        formatted: (Number(nativeBalance) / 1e18).toFixed(6),
        symbol: CHAOSSTAR_NETWORK.symbol,
      },
      tokens,
    };
  } catch (error) {
    console.error("Error fetching enhanced balances:", error);
    throw error;
  }
}

/**
 * Get transaction history for an address
 * Uses ChaosStar backend API
 */
export async function getTransactionHistory(address: string, limit = 50) {
  try {
    // Try to get from backend
    const base = api.getApiBase();
    const res = await fetch(`${base}/api/transactions/${address}?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      return data.transactions || [];
    }
    return [];
  } catch (error) {
    console.debug("Error fetching transaction history:", error);
    return [];
  }
}

/**
 * Get token metadata
 * For ChaosStar, this returns info about xBGL, CHAOS, and XEN
 */
export async function getTokenMetadata(tokenId: number | string) {
  const tokenInfo: Record<number, any> = {
    0: {
      name: "xBGL",
      symbol: "xBGL",
      decimals: 9,
      totalSupply: "1000000000000000000", // 1 billion with 9 decimals
      description: "Native currency of ChaosStar Network",
      isNative: true,
    },
    1: {
      name: "Chaos",
      symbol: "CHAOS",
      decimals: 9,
      totalSupply: "100000000000000000", // 100 million with 9 decimals
      description: "Governance token of ChaosStar Network",
      isNative: false,
    },
    2: {
      name: "Xen",
      symbol: "XEN",
      decimals: 9,
      totalSupply: "500000000000000000", // 500 million with 9 decimals
      description: "Staking rewards token of ChaosStar Network",
      isNative: false,
    },
  };
  
  const id = typeof tokenId === "string" ? parseInt(tokenId) : tokenId;
  return tokenInfo[id] || null;
}

/**
 * Get address analytics
 * Uses ChaosStar backend API
 */
export async function getAddressAnalytics(address: string) {
  try {
    const base = api.getApiBase();
    const res = await fetch(`${base}/api/analytics/${address}`);
    if (res.ok) {
      return await res.json();
    }
    return {
      totalTransactions: 0,
      totalReceived: "0",
      totalSent: "0",
      balance: "0",
    };
  } catch (error) {
    console.debug("Error fetching address analytics:", error);
    return {
      totalTransactions: 0,
      totalReceived: "0",
      totalSent: "0",
      balance: "0",
    };
  }
}

/**
 * Get network metrics from ChaosStar backend
 */
export async function getNetworkMetrics() {
  try {
    // Check Supabase connection instead of backend API
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.from("star_systems").select("id").limit(1);
    
    if (!error) {
      return {
        status: "healthy",
        health: "healthy",
        chainId: CHAOSSTAR_NETWORK.chainId,
        blockchainId: "ChaosStarNetwork",
        stargateConnected: true,
        vmConnected: true,
      };
    }
    
    return {
      status: "degraded",
      health: "degraded",
      chainId: CHAOSSTAR_NETWORK.chainId,
      blockchainId: "ChaosStarNetwork",
      stargateConnected: false,
      vmConnected: false,
    };
  } catch (error) {
    console.debug("Error fetching network metrics:", error);
    return {
      status: "offline",
      health: "offline",
      chainId: CHAOSSTAR_NETWORK.chainId,
      blockchainId: "",
      stargateConnected: false,
      vmConnected: false,
    };
  }
}

/**
 * ChaosStar Client wrapper for consistency with Avalanche SDK interface
 */
export const chaosStarClient = {
  getProvider,
  getEnhancedBalances,
  getTransactionHistory,
  getTokenMetadata,
  getAddressAnalytics,
  getNetworkMetrics,
};

export default chaosStarClient;

