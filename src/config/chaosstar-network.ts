/**
 * ChaosStar Network — native xBGL (chain 8888).
 * Local sandbox (1337) uses AVAX native + optional ERC-20 xBGL — see `chain-network.ts`.
 */

/** Documented production / local subnet chain id (README). */
export const CHAOSSTAR_CHAIN_ID = 8888;
export const CHAOSSTAR_CHAIN_ID_HEX = "0x22b8";

export const CHAOSSTAR_NETWORK_DEFAULTS = {
  chainId: CHAOSSTAR_CHAIN_ID,
  chainIdHex: CHAOSSTAR_CHAIN_ID_HEX,
  name: "ChaosStar Network",
  symbol: "xBGL",
  decimals: 18,
  blockExplorer: "",
} as const;

export function getChaosstarRpcUrl(): string {
  const fromEnv = import.meta.env.VITE_CHAOSSTAR_RPC?.toString().trim();
  if (fromEnv) {
    if (fromEnv.startsWith("/") && typeof window !== "undefined") {
      return `${window.location.origin}${fromEnv}`;
    }
    return fromEnv;
  }
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/chaosstar-rpc`;
  }
  return "http://127.0.0.1:24362/ext/bc/ChaosStar/rpc";
}

export function getChaosstarWalletRpcUrl(): string {
  const fromEnv = import.meta.env.VITE_CHAOSSTAR_WALLET_RPC?.toString().trim();
  if (fromEnv) return fromEnv;
  const raw = import.meta.env.VITE_CHAOSSTAR_RPC?.toString().trim();
  if (raw && !raw.startsWith("/")) return raw;
  return "http://127.0.0.1:24362/ext/bc/ChaosStar/rpc";
}

export function isChaosStarChainId(chainId: number): boolean {
  const fromEnv = import.meta.env.VITE_CHAOSSTAR_CHAIN_ID?.toString().trim();
  if (fromEnv) {
    const parsed = parseInt(fromEnv, 10);
    if (!Number.isNaN(parsed)) return chainId === parsed;
  }
  return chainId === CHAOSSTAR_CHAIN_ID;
}
