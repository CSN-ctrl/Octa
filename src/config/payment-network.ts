/**
 * Payment rail — Avalanche 1337 (local) or Fuji 43113 via VITE_CHAIN_ID.
 * AVAX in → xBGL ERC-20 → land purchases in xBGL.
 */

import {
  getAvaxRpcUrl,
  getWalletRpcUrl,
} from "@/config/avax-network";
import {
  getPaymentChainId,
  getPaymentChainIdHex,
  getPaymentNativeSymbol,
  getPaymentNetworkName,
} from "@/config/blockchain-profile";

export const PAYMENT_CHAIN_ID = getPaymentChainId();
export const PAYMENT_CHAIN_ID_HEX = getPaymentChainIdHex();

export const PAYMENT_NETWORK_DEFAULTS = {
  chainId: PAYMENT_CHAIN_ID,
  chainIdHex: PAYMENT_CHAIN_ID_HEX,
  name: getPaymentNetworkName(),
  symbol: getPaymentNativeSymbol(),
  decimals: 18,
} as const;

export function getPaymentRpcUrl(): string {
  return getAvaxRpcUrl();
}

export function getPaymentWalletRpcUrl(): string {
  return getWalletRpcUrl();
}

export function isPaymentChainId(chainId: number): boolean {
  const fromEnv = import.meta.env.VITE_CHAIN_ID?.toString().trim();
  if (fromEnv) {
    const parsed = parseInt(fromEnv, 10);
    if (!Number.isNaN(parsed)) return chainId === parsed;
  }
  return chainId === PAYMENT_CHAIN_ID;
}
