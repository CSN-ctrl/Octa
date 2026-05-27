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
  VITE_ENABLE_PRIVATE_KEY_CUSTODY?: string;
  VITE_ENABLE_TEST_ROUTES?: string;
}

// Defaults — align with `.env.example`. Set VITE_API_URL to your Go API (local or remote).
const defaults: Partial<EnvVars> = {
  VITE_API_URL: "http://localhost:5001",
  VITE_AVALANCHE_RPC: "https://api.avax-test.network/ext/bc/C/rpc",
  VITE_CHAOSSTAR_RPC: undefined,
  VITE_STARGATE_RPC: undefined,
  VITE_CHAIN_ID: "43113",
  VITE_BLOCKCHAIN_ID: "ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy",
  VITE_NETWORK_NAME: "Avalanche Fuji C-Chain",
  VITE_NATIVE_TOKEN: "AVAX",
  VITE_ENABLE_PRIVATE_KEY_CUSTODY: "false",
  VITE_ENABLE_TEST_ROUTES: "false",
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

  vars.VITE_AVALANCHE_RPC =
    import.meta.env.VITE_AVALANCHE_RPC || vars.VITE_AVALANCHE_RPC || vars.VITE_STARGATE_RPC;
  vars.VITE_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

  return vars as EnvVars;
})();

// Export convenience getters
export const getApiUrl = () => env.VITE_API_URL;
export const getChaosstarRpc = () => env.VITE_CHAOSSTAR_RPC;
export const getStargateRpc = () => env.VITE_STARGATE_RPC;
export const getChainId = () => parseInt(env.VITE_CHAIN_ID || "1337", 10);
export const getBlockchainId = () => env.VITE_BLOCKCHAIN_ID;
export const getNetworkName = () => env.VITE_NETWORK_NAME || "Avalanche Local C-Chain";
export const getNativeToken = () => env.VITE_NATIVE_TOKEN || "AVAX";
export const getAvalancheRpc = () => env.VITE_AVALANCHE_RPC;

function envEnabled(value: string | undefined): boolean {
  return String(value || "").toLowerCase() === "true";
}

/**
 * Private-key custody paths are disabled by default and hard-disabled in production
 * unless explicitly enabled at build time.
 */
export const isPrivateKeyCustodyEnabled = (): boolean => {
  if (import.meta.env.PROD) return false;
  const raw = (import.meta.env.VITE_ENABLE_PRIVATE_KEY_CUSTODY as string | undefined) ?? "";
  if (raw === "") return true;
  return envEnabled(raw);
};

/**
 * Development/test routes are disabled in production by default.
 */
export const isTestRoutesEnabled = (): boolean => {
  if (import.meta.env.DEV) return true;
  return envEnabled(import.meta.env.VITE_ENABLE_TEST_ROUTES as string | undefined);
};
