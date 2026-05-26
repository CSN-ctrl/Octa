/**
 * Local Avalanche C-Chain (native AVAX) — primary EVM RPC for contract deploys and reads.
 * Override with VITE_AVALANCHE_RPC in `.env.local`.
 */

export const DEFAULT_AVAX_C_CHAIN_RPC =
  "http://192.168.88.62:9650/ext/bc/C/rpc";

/** Local avalanchego C-Chain from eth_chainId on the LAN node. */
export const LOCAL_AVAX_CHAIN_ID = 1337;
export const LOCAL_AVAX_CHAIN_ID_HEX = "0x539";

export const LOCAL_AVAX_NETWORK = {
  chainId: LOCAL_AVAX_CHAIN_ID,
  chainIdHex: LOCAL_AVAX_CHAIN_ID_HEX,
  name: "Avalanche Local C-Chain",
  symbol: "AVAX",
  decimals: 18,
  rpcUrl: DEFAULT_AVAX_C_CHAIN_RPC,
  blockExplorer: "",
} as const;

/**
 * RPC URL for MetaMask / WalletConnect (must reach the node directly).
 * Browsers use getAvaxRpcUrl() which may use the Vite /avax-rpc proxy in dev.
 */
export function getWalletRpcUrl(): string {
  const fromEnv = import.meta.env.VITE_WALLET_RPC?.toString().trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_AVAX_C_CHAIN_RPC;
}

/** Resolve RPC URL for ethers/browser fetch (respects dev proxy path). */
export function getAvaxRpcUrl(): string {
  const fromEnv = import.meta.env.VITE_AVALANCHE_RPC?.toString().trim();
  if (fromEnv) {
    if (fromEnv.startsWith("/")) {
      if (typeof window !== "undefined") {
        return `${window.location.origin}${fromEnv}`;
      }
      return `http://127.0.0.1:8080${fromEnv}`;
    }
    return fromEnv;
  }
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/avax-rpc`;
  }
  return DEFAULT_AVAX_C_CHAIN_RPC;
}

export function isLocalAvaxRpc(url: string = getAvaxRpcUrl()): boolean {
  return (
    url.includes(":9650") ||
    url.includes("192.168.88.62") ||
    url.includes("/ext/bc/C/rpc")
  );
}

export function resolveEvmChainIdFromRpc(url: string = getAvaxRpcUrl()): number {
  if (isLocalAvaxRpc(url)) return LOCAL_AVAX_CHAIN_ID;
  if (url.includes("api.avax.network") || url.includes("43114")) return 43114;
  if (url.includes("api.avax-test.network") || url.includes("43113")) return 43113;
  const fromEnv = import.meta.env.VITE_CHAIN_ID;
  if (fromEnv) {
    const parsed = parseInt(fromEnv, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return LOCAL_AVAX_CHAIN_ID;
}

/** Chain ID for the configured AVAX / EVM RPC (env or local default). */
export function getAvaxChainId(): number {
  return resolveEvmChainIdFromRpc();
}
