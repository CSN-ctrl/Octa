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

// Defaults - Using Supabase as backend (no direct blockchain RPC needed)
// If you need to use a backend API, use http://151.237.142.106
const defaults: Partial<EnvVars> = {
  VITE_API_URL: 'http://151.237.142.106:5001', // Use provided server or Supabase
  // RPC endpoints disabled - using Supabase instead
  VITE_CHAOSSTAR_RPC: undefined, // Not used - Supabase acts as network
  VITE_STARGATE_RPC: undefined, // Not used - Supabase acts as network
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
