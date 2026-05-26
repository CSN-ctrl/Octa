/**
 * Single switch for payment rail: local 1337 now, Fuji 43113 later.
 * Set VITE_CHAIN_ID + RPC URLs in .env.local — no code changes required to migrate.
 */

export type PaymentRailProfile = "local-1337" | "fuji-43113";

const FUJI_CHAIN_ID = 43113;
const LOCAL_CHAIN_ID = 1337;

export function getPaymentChainId(): number {
  const raw = import.meta.env.VITE_CHAIN_ID?.toString().trim();
  const parsed = raw ? parseInt(raw, 10) : LOCAL_CHAIN_ID;
  if (Number.isNaN(parsed)) return LOCAL_CHAIN_ID;
  return parsed;
}

export function getPaymentChainIdHex(): string {
  return `0x${getPaymentChainId().toString(16)}`;
}

export function getPaymentRailProfile(): PaymentRailProfile {
  return getPaymentChainId() === FUJI_CHAIN_ID ? "fuji-43113" : "local-1337";
}

/** Deposit UI network id (see src/lib/networks.ts). */
export function getDepositNetworkId(): string {
  return getPaymentRailProfile() === "fuji-43113" ? "avalanche-fuji" : "avalanche-local";
}

export function getPaymentNetworkName(): string {
  const fromEnv = import.meta.env.VITE_NETWORK_NAME?.toString().trim();
  if (fromEnv) return fromEnv;
  return getPaymentRailProfile() === "fuji-43113"
    ? "Avalanche Fuji"
    : "Avalanche Local C-Chain";
}

export function getPaymentNativeSymbol(): string {
  return import.meta.env.VITE_NATIVE_TOKEN?.toString().trim() || "AVAX";
}

export function getPaymentDeploymentsPath(): string {
  return `/sandbox/deployments/${getPaymentChainId()}-latest.json`;
}

export function getPaymentBlockExplorerUrl(): string {
  if (getPaymentRailProfile() === "fuji-43113") {
    return "https://testnet.snowtrace.io";
  }
  return "";
}
