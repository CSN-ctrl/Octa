/**
 * Avalanche SDK Integration
 * Uses the official @avalanche-sdk/client and @avalanche-sdk/chainkit
 * for enhanced blockchain interactions and indexed data access
 */

import { createAvalancheClient } from '@avalanche-sdk/client';
import { avalanche, avalancheFuji } from '@avalanche-sdk/client/chains';
import { Avalanche as ChainKit } from '@avalanche-sdk/chainkit';

// Determine which chain to use based on environment
// ChaosStar Network: Chain ID 8088, RPC on port 24362
const getChainId = (): string => {
  const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC || import.meta.env.VITE_CHAOSSTAR_RPC || '';
  
  // Check if it's ChaosStar network (port 24362, blockchain name "ChaosStar", or blockchain ID)
  if (rpcUrl.includes('24362') || 
      rpcUrl.includes('ChaosStar') || 
      rpcUrl.includes('ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy') ||
      rpcUrl.includes('4q1KP4TH6tiJSwX3xrx9Qx7qsSa9HpqyyC7fWMt2kcJBmWXUZ')) {
    return '8088'; // ChaosStar Network
  }
  
  // Check if it's mainnet or testnet
  if (rpcUrl.includes('api.avax.network') || rpcUrl.includes('43114') || rpcUrl.includes('localhost:8545')) {
    return '43114'; // Mainnet (or ChaosStar local)
  }
  if (rpcUrl.includes('api.avax-test.network') || rpcUrl.includes('43113')) {
    return '43113'; // Fuji Testnet
  }
  
  // Default to ChaosStar for local development
  return '8088';
};

const chainId = getChainId();
const isMainnet = chainId === '43114';

/**
 * Create Avalanche Client for direct RPC interactions
 * Note: The client is built on viem, so it has viem's public client methods
 */
export function createClient() {
  // RPC connections disabled - using Supabase as backend only
  // If RPC is needed, use: http://151.237.142.106
  // For now, always return null to disable RPC connections
  return null as any;
}

/**
 * ChainKit instance for indexed data (Glacier API)
 * Provides better data access than direct RPC for:
 * - ERC20 balances
 * - Transaction history
 * - Token metadata
 * - Address analytics
 */
export const chainKit = new ChainKit({
  chainId: chainId,
  // Optional: Add API key if you have one for higher rate limits
  // apiKey: import.meta.env.VITE_GLACIER_API_KEY,
});

/**
 * Enhanced balance fetching using ChainKit
 * Returns both native AVAX and ERC20 token balances
 */
export async function getEnhancedBalances(address: string) {
  try {
    // Get ERC20 balances using ChainKit (indexed data) - with error handling
    let erc20Balances: any = { data: [] };
    try {
      erc20Balances = await chainKit.data.evm.address.balances.listErc20({
        address: address as `0x${string}`,
      });
    } catch (chainKitError) {
      console.debug("ChainKit ERC20 balances not available:", chainKitError);
      // Continue with empty tokens array
    }
    
    // RPC provider removed - using Supabase only
    // Native balance now fetched from Supabase
    let nativeBalance = "0";
    try {
      const { getUserBalance } = await import("./supabase-service");
      const balance = await getUserBalance(address);
      nativeBalance = (balance?.xbgl_balance || 0).toString();
    } catch (e) {
      console.debug("Could not fetch balance from Supabase:", e);
    }
    
    return {
      native: {
        value: nativeBalance,
        formatted: (Number(nativeBalance) / 1e18).toFixed(6),
        symbol: 'AVAX',
      },
      tokens: erc20Balances.data?.map((token: any) => {
        const balanceValue = Number(token.balance) / Math.pow(10, token.decimals || 18);
        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balance: token.balance,
          decimals: token.decimals,
          formatted: balanceValue.toString(), // Keep full precision as string
        };
      }) || [],
    };
  } catch (error) {
    console.error('Error fetching enhanced balances:', error);
    throw error;
  }
}

/**
 * Get transaction history for an address
 */
export async function getTransactionHistory(address: string, _limit = 50) {
  try {
    const listFn = chainKit.data.evm.address.transactions.list as (req: {
      address: `0x${string}`;
    }) => Promise<{ data?: unknown[] } | unknown[]>;
    const res = await listFn({
      address: address as `0x${string}`,
    });
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res) {
      return (res as { data: unknown[] }).data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
}

/**
 * Get token metadata
 * Uses ChainKit contracts.getMetadata() or falls back to direct ERC20 contract calls
 */
export async function getTokenMetadata(tokenAddress: string) {
  try {
    // Try ChainKit contracts metadata first
    try {
      if (chainKit.data?.evm?.contracts?.getMetadata) {
        const metadata = await chainKit.data.evm.contracts.getMetadata({
          address: tokenAddress as `0x${string}`,
        });
        const meta =
          metadata && typeof metadata === "object" && "data" in metadata
            ? (metadata as { data: unknown }).data
            : metadata;
        if (meta) return meta;
      }
    } catch (chainKitError) {
      console.debug("ChainKit contract metadata not available, using fallback:", chainKitError);
    }

    console.debug("RPC provider removed - token metadata fetching disabled");
    return null;
  } catch (error) {
    console.debug('Error fetching token metadata:', error);
    // Return null instead of throwing to allow graceful degradation
    return null;
  }
}

/**
 * Get address analytics
 */
export async function getAddressAnalytics(address: string) {
  try {
    const addrApi = chainKit.data.evm.address as {
      analytics?: { get: (q: { address: `0x${string}` }) => Promise<unknown> };
    };
    const analytics = await addrApi.analytics?.get?.({
      address: address as `0x${string}`,
    });
    if (analytics === undefined) {
      throw new Error("analytics unavailable");
    }
    if (analytics && typeof analytics === "object" && "data" in analytics) {
      return (analytics as { data: unknown }).data;
    }
    return analytics as unknown;
  } catch (error) {
    console.error('Error fetching address analytics:', error);
    // Return default structure instead of throwing
    return {
      totalTransactions: 0,
      totalReceived: "0",
      totalSent: "0",
      balance: "0",
    };
  }
}

/**
 * Get network metrics
 */
export async function getNetworkMetrics() {
  try {
    // Try health check first
    let healthCheck: any = { status: "unknown" };
    try {
      healthCheck = await chainKit.metrics.healthCheck();
    } catch (e) {
      console.debug("ChainKit health check not available:", e);
    }
    
    // Try to get network metrics if available
    let networkData: any = {};
    try {
      // The metrics structure may vary, so we'll try different approaches
      if (chainKit.metrics.networks) {
        // Networks might have different methods
        networkData = { networksAvailable: true };
      }
    } catch (e) {
      // Ignore if networks endpoint not available
      console.debug("Network metrics endpoint not available:", e);
    }
    
    const status = healthCheck.status || healthCheck.health || "unknown";
    const isHealthy = status === "healthy" || status === "ok" || status === "up";
    
    return {
      status: status,
      health: isHealthy ? "healthy" : "degraded",
      ...networkData,
      // Provide default values if specific metrics not available
      validators: 0,
      throughput: 0,
      latency: 0,
      uptime: isHealthy ? 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching network metrics:', error);
    // Return default structure on error
    return {
      status: "unknown",
      health: "unknown",
      validators: 0,
      throughput: 0,
      latency: 0,
      uptime: 0,
    };
  }
}

