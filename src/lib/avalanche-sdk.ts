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
  // Use ChaosStar EVM RPC as primary (blockchain ID from sidecar.json)
  const rpcUrl = import.meta.env.VITE_CHAOSSTAR_RPC || 
    import.meta.env.VITE_AVALANCHE_RPC || 
    (isMainnet 
      ? 'http://127.0.0.1:24362/ext/bc/ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy/rpc'
      : 'https://api.avax-test.network/ext/bc/C/rpc'
    );

  const client = createAvalancheClient({
    chain: isMainnet ? avalanche : avalancheFuji,
    transport: {
      type: 'http',
      url: rpcUrl,
    },
  });
  
  // The client extends viem's public client, so it has getBalance method
  return client;
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
export async function getTransactionHistory(address: string, limit = 50) {
  try {
    const transactions = await chainKit.data.evm.address.transactions.list({
      address: address as `0x${string}`,
      limit,
    });
    
    return transactions.data || [];
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
        if (metadata && metadata.data) {
          return metadata.data;
        }
      }
    } catch (chainKitError) {
      console.debug("ChainKit contract metadata not available, using fallback:", chainKitError);
    }
    
    // Fallback: Get token info directly from ERC20 contract
    try {
      // RPC provider removed - using Supabase only
      // Token metadata fetching disabled
      console.debug("RPC provider removed - token metadata fetching disabled");
      return null;
      
      const tokenContract = getERC20Contract(tokenAddress);
      
      // Try to fetch token metadata with individual calls and better error handling
      let name = "Unknown Token";
      let symbol = "UNK";
      let decimals = 18;
      let totalSupply = "0";
      
      try {
        name = await tokenContract.name();
      } catch (e) {
        console.debug("Could not fetch token name:", e);
      }
      
      try {
        symbol = await tokenContract.symbol();
      } catch (e) {
        console.debug("Could not fetch token symbol:", e);
      }
      
      try {
        decimals = await tokenContract.decimals();
      } catch (e) {
        console.debug("Could not fetch token decimals:", e);
      }
      
      try {
        // Check if totalSupply method exists by trying to call it
        // Some tokens don't implement totalSupply, so we make it optional
        const supply = await tokenContract.totalSupply();
        if (supply && supply.toString() !== "0x") {
          totalSupply = supply.toString();
        }
      } catch (e: any) {
        // totalSupply is optional - many tokens don't have it
        // Only log if it's not a "method not found" or "bad data" error
        if (e?.code !== "BAD_DATA" && !e?.message?.includes("could not decode")) {
          console.debug("Could not fetch token totalSupply:", e);
        }
      }
      
      // Return metadata even if some fields failed (at least we have something)
      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply,
      };
    } catch (contractError) {
      console.debug("Could not fetch token metadata from contract:", contractError);
      return null;
    }
    
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
    const analytics = await chainKit.data.evm.address.analytics.get({
      address: address as `0x${string}`,
    });
    
    return analytics.data;
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

