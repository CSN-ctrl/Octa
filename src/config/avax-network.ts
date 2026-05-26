/**
 * Avalanche C-Chain RPC — local 1337 (LAN/proxy) or Fuji 43113 (Alchemy / public).
 * Override with VITE_AVALANCHE_RPC and VITE_WALLET_RPC in `.env.local` / Vercel env.
 */

export const DEFAULT_AVAX_C_CHAIN_RPC =
  "http://192.168.88.62:9650/ext/bc/C/rpc";

export const PUBLIC_FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
export const FUJI_CHAIN_ID = 43113;

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

function trimEnv(key: string): string | undefined {
  const v = import.meta.env[key]?.toString().trim();
  return v || undefined;
}

function paymentChainIdFromEnv(): number | null {
  const raw = trimEnv("VITE_CHAIN_ID");
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

/** Alchemy Fuji RPC when VITE_ALCHEMY_API_KEY is set at build time. */
export function alchemyFujiRpcFromEnv(): string | null {
  const key = trimEnv("VITE_ALCHEMY_API_KEY");
  if (!key) return null;
  return `https://avax-fuji.g.alchemy.com/v2/${key}`;
}

function isPrivateLanRpc(url: string): boolean {
  return (
    url.includes("192.168.") ||
    url.includes("127.0.0.1") ||
    url.includes("localhost") ||
    (url.includes(":9650") && !url.startsWith("https://"))
  );
}

/** Production-safe default when VITE_AVALANCHE_RPC is missing (never LAN). */
function resolveProductionAvaxRpc(): string {
  const chainId = paymentChainIdFromEnv();
  if (chainId === FUJI_CHAIN_ID) {
    return alchemyFujiRpcFromEnv() ?? PUBLIC_FUJI_RPC;
  }
  if (chainId === 43114) {
    return "https://api.avax.network/ext/bc/C/rpc";
  }
  return alchemyFujiRpcFromEnv() ?? PUBLIC_FUJI_RPC;
}

function resolveExplicitRpc(fromEnv: string): string {
  if (fromEnv.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${fromEnv}`;
    }
    return `http://127.0.0.1:8080${fromEnv}`;
  }
  if (import.meta.env.PROD && isPrivateLanRpc(fromEnv)) {
    console.warn(
      "[avax-network] VITE_AVALANCHE_RPC points at a private LAN host; using public Fuji RPC in production instead.",
    );
    return resolveProductionAvaxRpc();
  }
  return fromEnv;
}

function resolveAvaxRpcUrl(): string {
  const fromEnv = trimEnv("VITE_AVALANCHE_RPC");
  if (fromEnv) return resolveExplicitRpc(fromEnv);

  const alchemy = alchemyFujiRpcFromEnv();
  if (alchemy && paymentChainIdFromEnv() === FUJI_CHAIN_ID) return alchemy;

  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/avax-rpc`;
  }

  if (import.meta.env.PROD) {
    return resolveProductionAvaxRpc();
  }

  return DEFAULT_AVAX_C_CHAIN_RPC;
}

/**
 * RPC URL for MetaMask / WalletConnect (must reach the node directly — no dev proxy).
 */
export function getWalletRpcUrl(): string {
  const fromEnv = trimEnv("VITE_WALLET_RPC");
  if (fromEnv) {
    if (import.meta.env.PROD && isPrivateLanRpc(fromEnv)) {
      return resolveProductionAvaxRpc();
    }
    return fromEnv;
  }
  const avax = trimEnv("VITE_AVALANCHE_RPC");
  if (avax && !avax.startsWith("/")) {
    if (import.meta.env.PROD && isPrivateLanRpc(avax)) {
      return resolveProductionAvaxRpc();
    }
    return avax;
  }
  if (import.meta.env.PROD) {
    return resolveProductionAvaxRpc();
  }
  return DEFAULT_AVAX_C_CHAIN_RPC;
}

/** Resolve RPC URL for ethers/browser fetch (respects dev /avax-rpc proxy). */
export function getAvaxRpcUrl(): string {
  return resolveAvaxRpcUrl();
}

export function isLocalAvaxRpc(url: string = getAvaxRpcUrl()): boolean {
  if (url.includes("g.alchemy.com") || url.includes("api.avax-test.network")) {
    return false;
  }
  return (
    isPrivateLanRpc(url) ||
    url.includes("/avax-rpc")
  );
}

export function resolveEvmChainIdFromRpc(url: string = getAvaxRpcUrl()): number {
  if (isLocalAvaxRpc(url)) return LOCAL_AVAX_CHAIN_ID;
  if (url.includes("api.avax.network") || url.includes("43114")) return 43114;
  if (
    url.includes("api.avax-test.network") ||
    url.includes("avax-fuji.g.alchemy.com") ||
    url.includes("43113")
  ) {
    return FUJI_CHAIN_ID;
  }
  const fromEnv = paymentChainIdFromEnv();
  if (fromEnv != null) return fromEnv;
  return LOCAL_AVAX_CHAIN_ID;
}

/** Chain ID for the configured AVAX / EVM RPC (env or local default). */
export function getAvaxChainId(): number {
  return resolveEvmChainIdFromRpc();
}
