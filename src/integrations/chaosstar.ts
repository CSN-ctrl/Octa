/**
 * ChaosStar Network Integration
 * Reads connection configuration from chaosstar-connection.json
 */

export interface ChaosStarConnection {
  chaosstar_network: {
    name: string;
    subnet_id: string;
    blockchain_id: string;
    rpc_endpoint: string;
    vm_id: string;
    chain_id: number;
    network_type: string;
  };
  connection_type: string;
  created_at?: string;
}

/**
 * Load ChaosStar connection configuration
 */
export async function loadChaosStarConnection(): Promise<ChaosStarConnection | null> {
  try {
    const response = await fetch('/chaosstar-connection.json');
    if (!response.ok) {
      console.warn('ChaosStar connection file not found, using defaults');
      return null;
    }
    const config: ChaosStarConnection = await response.json();
    return config;
  } catch (error) {
    console.warn('Failed to load ChaosStar connection:', error);
    return null;
  }
}

/**
 * Get ChaosStar RPC endpoint from connection config or use default
 * Note: RPC connections are disabled - using Supabase as backend
 * If RPC is needed, use http://151.237.142.106
 */
export async function getChaosStarRpc(): Promise<string | null> {
  const config = await loadChaosStarConnection();
  if (config?.chaosstar_network?.rpc_endpoint) {
    // Only use if it's not localhost
    const rpcUrl = config.chaosstar_network.rpc_endpoint;
    if (!rpcUrl.includes('localhost') && !rpcUrl.includes('127.0.0.1')) {
      return rpcUrl;
    }
  }
  // No localhost fallback - return null to indicate RPC not available
  // Use Supabase or http://151.237.142.106 instead
  return null;
}

/**
 * Get ChaosStar subnet information
 */
export async function getChaosStarInfo(): Promise<{
  subnetId: string;
  blockchainId: string;
  chainId: number;
  name: string;
} | null> {
  const config = await loadChaosStarConnection();
  if (!config) return null;
  
  return {
    subnetId: config.chaosstar_network.subnet_id,
    blockchainId: config.chaosstar_network.blockchain_id,
    chainId: config.chaosstar_network.chain_id,
    name: config.chaosstar_network.name,
  };
}

