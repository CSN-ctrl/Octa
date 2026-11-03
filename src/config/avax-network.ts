/**
 * Avalanche C-Chain — Fuji testnet (43113) by default.
 * Override with VITE_AVALANCHE_RPC / VITE_WALLET_RPC in `.env.local` or Vercel.
 */

export const PUBLIC_FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
/** Alternate Fuji host; set VITE_AVALANCHE_RPC to use as primary. */
export const FUJI_SUBNETS_TEST_RPC = "https://subnets-test.avax.network/c-chain";
export const FUJI_CHAIN_ID = 43113;
export const FUJI_CHAIN_ID_HEX = "0xa869";

/** @deprecated LAN node — not used by the app; kept for legacy deploy scripts only. */
export const DEFAULT_AVAX_C_CHAIN_RPC = PUBLIC_FUJI_RPC;

export const FUJI_AVAX_NETWORK = {
  chainId: FUJI_CHAIN_ID,
  chainIdHex: FUJI_CHAIN_ID_HEX,
  name: "Avalanche Fuji C-Chain",
  symbol: "AVAX",
  decimals: 18,
  rpcUrl: PUBLIC_FUJI_RPC,
  blockExplorer: "https://testnet.snowtrace.io",
} as const;

/** @deprecated Use FUJI_AVAX_NETWORK / FUJI_CHAIN_ID */
export const LOCAL_AVAX_CHAIN_ID = FUJI_CHAIN_ID;
export const LOCAL_AVAX_CHAIN_ID_HEX = FUJI_CHAIN_ID_HEX;
export const LOCAL_AVAX_NETWORK = FUJI_AVAX_NETWORK;

function trimOptional(value: string | undefined): string | undefined {
  const v = value?.toString().trim();
  return v || undefined;
}

function paymentChainIdFromEnv(): number {
  const raw = trimOptional(import.meta.env.VITE_CHAIN_ID);
  if (!raw) return FUJI_CHAIN_ID;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? FUJI_CHAIN_ID : n;
}

/** Alchemy Fuji RPC when VITE_ALCHEMY_API_KEY is set at build time. */
export function alchemyFujiRpcFromEnv(): string | null {
  const key = trimOptional(import.meta.env.VITE_ALCHEMY_API_KEY);
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

function defaultFujiRpc(): string {
  return alchemyFujiRpcFromEnv() ?? PUBLIC_FUJI_RPC;
}

function resolveProductionAvaxRpc(): string {
  const chainId = paymentChainIdFromEnv();
  if (chainId === 43114) {
    return "https://api.avax.network/ext/bc/C/rpc";
  }
  return defaultFujiRpc();
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
      "[avax-network] VITE_AVALANCHE_RPC points at a private LAN host; using Fuji RPC instead.",
    );
    return resolveProductionAvaxRpc();
  }
  return fromEnv;
}

function resolveAvaxRpcUrl(): string {
  const fromEnv = trimOptional(import.meta.env.VITE_AVALANCHE_RPC);
  if (fromEnv) return resolveExplicitRpc(fromEnv);

  const alchemy = alchemyFujiRpcFromEnv();
  if (alchemy && paymentChainIdFromEnv() === FUJI_CHAIN_ID) return alchemy;

  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/avax-rpc`;
  }

  return defaultFujiRpc();
}

/** RPC URL for MetaMask / WalletConnect (direct — no dev proxy). */
export function getWalletRpcUrl(): string {
  const fromEnv = trimOptional(import.meta.env.VITE_WALLET_RPC);
  if (fromEnv) {
    if (isPrivateLanRpc(fromEnv)) return defaultFujiRpc();
    return fromEnv;
  }
  const avax = trimOptional(import.meta.env.VITE_AVALANCHE_RPC);
  if (avax && !avax.startsWith("/")) {
    if (isPrivateLanRpc(avax)) return defaultFujiRpc();
    return avax;
  }
  return defaultFujiRpc();
}

/** MetaMask `wallet_addEthereumChain` — primary + fallback RPC URLs for Fuji. */
export function getPaymentWalletRpcUrls(): string[] {
  const primary = getWalletRpcUrl();
  const urls = [primary];
  if (paymentChainIdFromEnv() === FUJI_CHAIN_ID) {
    for (const alt of [alchemyFujiRpcFromEnv(), PUBLIC_FUJI_RPC, FUJI_SUBNETS_TEST_RPC]) {
      if (alt && alt !== primary && !urls.includes(alt)) urls.push(alt);
    }
  }
  return urls;
}

/** Resolve RPC URL for ethers/browser fetch (respects dev /avax-rpc proxy). */
export function getAvaxRpcUrl(): string {
  return resolveAvaxRpcUrl();
}

export function isLocalAvaxRpc(url: string = getAvaxRpcUrl()): boolean {
  if (
    url.includes("g.alchemy.com") ||
    url.includes("api.avax-test.network") ||
    url.includes("subnets-test.avax.network") ||
    url.includes("api.avax.network")
  ) {
    return false;
  }
  return isPrivateLanRpc(url) || url.includes("/avax-rpc");
}

export function resolveEvmChainIdFromRpc(url: string = getAvaxRpcUrl()): number {
  if (isLocalAvaxRpc(url)) return FUJI_CHAIN_ID;
  if (url.includes("api.avax.network") || url.includes("43114")) return 43114;
  if (
    url.includes("api.avax-test.network") ||
    url.includes("avax-fuji.g.alchemy.com") ||
    url.includes("subnets-test.avax.network") ||
    url.includes("43113")
  ) {
    return FUJI_CHAIN_ID;
  }
  return paymentChainIdFromEnv();
}

export function getAvaxChainId(): number {
  return resolveEvmChainIdFromRpc();
}
