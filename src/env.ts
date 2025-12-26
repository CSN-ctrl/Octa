/**
 * Typed environment variable access for Vite projects.
 * Supports both legacy Avalanche RPC and new ChaosStar backend.
 */

interface EnvVars {
  // Legacy (optional)
  VITE_AVALANCHE_RPC?: string;
  VITE_CONTRACT_ADDRESS?: string;
  
  // ChaosStar Backend
  VITE_API_URL: string;
  VITE_CHAOSSTAR_RPC?: string;
  VITE_STARGATE_RPC?: string;
  VITE_CHAIN_ID?: string;
  VITE_BLOCKCHAIN_ID?: string;
  VITE_NETWORK_NAME?: string;
  VITE_NATIVE_TOKEN?: string;
}

// Defaults for ChaosStar backend
// Network: ChaosStar-local-node-local-network
// Node: http://127.0.0.1:24362 [NodeID-MYY8LGJszhXRusAWnUuNTFeHCo1pZDoJP]
// Blockchain ID: 4q1KP4TH6tiJSwX3xrx9Qx7qsSa9HpqyyC7fWMt2kcJBmWXUZ
// Chain ID: 8088 (0x1F98)
const defaults: Partial<EnvVars> = {
  VITE_API_URL: 'http://localhost:5001', // Updated to match backend port
  VITE_CHAOSSTAR_RPC: 'http://127.0.0.1:24362/ext/bc/ChaosStar/rpc',
  VITE_STARGATE_RPC: 'http://localhost:8545',
  VITE_CHAIN_ID: '8088',
  VITE_BLOCKCHAIN_ID: 'ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy',
  VITE_NETWORK_NAME: 'ChaosStar Network',
  VITE_NATIVE_TOKEN: 'xBGL',
};

export const env = (() => {
  const vars: Partial<EnvVars> = {};

  // Load from environment with defaults
  for (const key of Object.keys(defaults) as (keyof EnvVars)[]) {
    const value = import.meta.env[key] || defaults[key];
    if (value) {
      vars[key] = value;
    }
  }

  // Also check legacy env vars (optional)
  vars.VITE_AVALANCHE_RPC = import.meta.env.VITE_AVALANCHE_RPC || vars.VITE_STARGATE_RPC;
  vars.VITE_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 'native';

  return vars as EnvVars;
})();

// Export convenience getters
export const getApiUrl = () => env.VITE_API_URL;
export const getChaosstarRpc = () => env.VITE_CHAOSSTAR_RPC;
export const getStargateRpc = () => env.VITE_STARGATE_RPC;
export const getChainId = () => parseInt(env.VITE_CHAIN_ID || '8088');
export const getBlockchainId = () => env.VITE_BLOCKCHAIN_ID;
export const getNetworkName = () => env.VITE_NETWORK_NAME || 'ChaosStar Network';
export const getNativeToken = () => env.VITE_NATIVE_TOKEN || 'xBGL';
