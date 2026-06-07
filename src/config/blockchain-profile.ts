/**
 * Payment rail — Avalanche Fuji testnet (43113).
 * Set VITE_CHAIN_ID + RPC URLs in .env.local to override.
 */

export type PaymentRailProfile = "fuji-43113";

const FUJI_CHAIN_ID = 43113;

export function getPaymentChainId(): number {
  const raw = import.meta.env.VITE_CHAIN_ID?.toString().trim();
  const parsed = raw ? parseInt(raw, 10) : FUJI_CHAIN_ID;
  if (Number.isNaN(parsed)) return FUJI_CHAIN_ID;
  return parsed;
}

export function getPaymentChainIdHex(): string {
  return `0x${getPaymentChainId().toString(16)}`;
}

export function getPaymentRailProfile(): PaymentRailProfile {
  return "fuji-43113";
}

/** Deposit UI network id (see src/lib/networks.ts). */
export function getDepositNetworkId(): string {
  return "avalanche-fuji";
}

export function getPaymentNetworkName(): string {
  const fromEnv = import.meta.env.VITE_NETWORK_NAME?.toString().trim();
  if (fromEnv) return fromEnv;
  return "Avalanche Fuji C-Chain";
}

export function getPaymentNativeSymbol(): string {
  return import.meta.env.VITE_NATIVE_TOKEN?.toString().trim() || "AVAX";
}

export function getPaymentDeploymentsPath(): string {
  return `/sandbox/deployments/${getPaymentChainId()}-latest.json`;
}

/** Block explorer base URL for wallet_addEthereumChain. */
export function getPaymentBlockExplorerUrl(): string {
  const chainId = getPaymentChainId();
  if (chainId === 43113) return "https://testnet.snowtrace.io";
  if (chainId === 43114) return "https://snowtrace.io";
  return "";
}
