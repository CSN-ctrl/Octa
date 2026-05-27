/**
 * ChaosStar (8888): app wallet / branding RPC only.
 * In-game xBGL + all smart contracts: Avalanche Fuji 43113 — see payment-network.ts + payment-contracts.ts.
 */

import { ethers } from "ethers";
import {
  CHAOSSTAR_NETWORK_DEFAULTS,
  getChaosstarRpcUrl,
  isChaosStarChainId,
} from "@/config/chaosstar-network";
import {
  getAvaxRpcUrl,
  isLocalAvaxRpc,
  LOCAL_AVAX_CHAIN_ID,
  LOCAL_AVAX_NETWORK,
} from "@/config/avax-network";
import { getChaosstarRpc } from "@/env";
import { getPaymentChainId } from "@/config/blockchain-profile";
import { getPaymentRpcUrl } from "@/config/payment-network";

export type NativeCurrencyKind = "xBGL" | "AVAX";

export interface RpcNetworkInfo {
  chainId: number;
  rpcUrl: string;
  nativeSymbol: string;
  nativeDecimals: number;
  nativeKind: NativeCurrencyKind;
  /** True on ChaosStar (8888) where xBGL is the native coin. */
  isNativeXbgl: boolean;
  /** ERC-20 xBGL contract when deployed on a non-native chain (e.g. local 1337). */
  xbglTokenAddress: string | null;
}

let cachedNetwork: RpcNetworkInfo | null = null;
let cacheRpc: string | null = null;

async function fetchChainIdFromRpc(rpcUrl: string): Promise<number> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  return Number(network.chainId);
}

/** Default JSON-RPC for app reads. On-chain game mode uses payment rail (1337), not ChaosStar (8888). */
export function getPrimaryEvmRpcUrl(): string {
  if (isOnChainCryptoMode()) {
    return getPaymentRpcUrl();
  }
  const fromEnv = getChaosstarRpc()?.trim();
  if (fromEnv) {
    if (fromEnv.startsWith("/") && typeof window !== "undefined") {
      return `${window.location.origin}${fromEnv}`;
    }
    return fromEnv;
  }
  return getChaosstarRpcUrl();
}

export function getAppRpcUrl(): string {
  return getPrimaryEvmRpcUrl();
}

/**
 * Resolve network from RPC: chain id + native asset model.
 * Contract addresses (land, treasury) still come from addresses.json keyed by chainId.
 */
export async function resolveNetworkFromRpc(
  rpcUrl?: string
): Promise<RpcNetworkInfo> {
  if (isOnChainCryptoMode() && !rpcUrl) {
    const url = getPaymentRpcUrl();
    if (cachedNetwork && cacheRpc === url) return cachedNetwork;
    const token = import.meta.env.VITE_XBGL_TOKEN_ADDRESS?.toString().trim() || null;
    cachedNetwork = {
      chainId: getPaymentChainId(),
      rpcUrl: url,
      nativeSymbol: LOCAL_AVAX_NETWORK.symbol,
      nativeDecimals: LOCAL_AVAX_NETWORK.decimals,
      nativeKind: "AVAX",
      isNativeXbgl: false,
      xbglTokenAddress: token && ethers.isAddress(token) ? token : null,
    };
    cacheRpc = url;
    return cachedNetwork;
  }

  const url = rpcUrl ?? getPrimaryEvmRpcUrl();
  if (cachedNetwork && cacheRpc === url) return cachedNetwork;

  let chainId: number;
  try {
    chainId = await fetchChainIdFromRpc(url);
  } catch (primaryErr) {
    const fallback = getAvaxRpcUrl();
    if (fallback === url) throw primaryErr;
    chainId = await fetchChainIdFromRpc(fallback);
    return resolveNetworkFromRpc(fallback);
  }
  const isChaosStar = isChaosStarChainId(chainId);

  if (isChaosStar) {
    cachedNetwork = {
      chainId,
      rpcUrl: url,
      nativeSymbol: CHAOSSTAR_NETWORK_DEFAULTS.symbol,
      nativeDecimals: CHAOSSTAR_NETWORK_DEFAULTS.decimals,
      nativeKind: "xBGL",
      isNativeXbgl: true,
      xbglTokenAddress: null,
    };
  } else if (isLocalAvaxRpc(url) || chainId === LOCAL_AVAX_CHAIN_ID) {
    cachedNetwork = {
      chainId,
      rpcUrl: url,
      nativeSymbol: LOCAL_AVAX_NETWORK.symbol,
      nativeDecimals: LOCAL_AVAX_NETWORK.decimals,
      nativeKind: "AVAX",
      isNativeXbgl: false,
      xbglTokenAddress: null,
    };
  } else {
    cachedNetwork = {
      chainId,
      rpcUrl: url,
      nativeSymbol: import.meta.env.VITE_NATIVE_TOKEN?.toString() || "xBGL",
      nativeDecimals: 18,
      nativeKind: "xBGL",
      isNativeXbgl: false,
      xbglTokenAddress: null,
    };
  }

  cacheRpc = url;
  return cachedNetwork;
}

export function clearNetworkCache(): void {
  cachedNetwork = null;
  cacheRpc = null;
}

/** Crypto flows use chain state, not Supabase `user_balances`. */
export function isOnChainCryptoMode(): boolean {
  const flag = import.meta.env.VITE_ONCHAIN_CRYPTO?.toString().toLowerCase();
  if (flag === "false") return false;
  if (flag === "true") return true;
  return true;
}

export async function getNativeBalanceWei(
  walletAddress: string,
  rpcUrl?: string
): Promise<bigint> {
  const url = rpcUrl ?? getPrimaryEvmRpcUrl();
  const provider = new ethers.JsonRpcProvider(url);
  return provider.getBalance(walletAddress);
}

export async function getXbglBalanceWei(
  walletAddress: string,
  erc20Address?: string | null
): Promise<bigint> {
  const net = await resolveNetworkFromRpc();
  if (net.isNativeXbgl) {
    return getNativeBalanceWei(walletAddress, net.rpcUrl);
  }

  const token =
    erc20Address ||
    import.meta.env.VITE_XBGL_TOKEN_ADDRESS?.toString().trim() ||
    null;
  if (!token || !ethers.isAddress(token)) {
    return 0n;
  }

  const provider = new ethers.JsonRpcProvider(net.rpcUrl);
  const erc20 = new ethers.Contract(
    token,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );
  return erc20.balanceOf(walletAddress);
}

export async function formatXbglBalance(
  walletAddress: string,
  erc20Address?: string | null
): Promise<{ formatted: string; symbol: string; wei: bigint }> {
  if (isOnChainCryptoMode()) {
    const { formatPaymentXbglBalance } = await import("@/lib/payment-balance");
    return formatPaymentXbglBalance(walletAddress);
  }

  const net = await resolveNetworkFromRpc();
  const wei = await getXbglBalanceWei(walletAddress, erc20Address);
  const decimals = net.isNativeXbgl ? net.nativeDecimals : 18;
  return {
    formatted: ethers.formatUnits(wei, decimals),
    symbol: "xBGL",
    wei,
  };
}
