import { ethers } from "ethers";
import { getAppRpcUrl, isOnChainCryptoMode } from "@/lib/chain-network";
import { getPaymentRpcUrl } from "@/config/payment-network";

let cachedAppProvider: ethers.JsonRpcProvider | null = null;
let cachedAppUrl: string | null = null;
let cachedPaymentProvider: ethers.JsonRpcProvider | null = null;
let cachedPaymentUrl: string | null = null;

export function getEvmRpcUrl(): string {
  return getAppRpcUrl();
}

/** Default read provider — payment rail (1337) when on-chain game mode is enabled. */
export function getJsonRpcProvider(): ethers.JsonRpcProvider {
  if (isOnChainCryptoMode()) {
    return getPaymentJsonRpcProvider();
  }
  const url = getAppRpcUrl();
  if (!cachedAppProvider || cachedAppUrl !== url) {
    cachedAppUrl = url;
    cachedAppProvider = new ethers.JsonRpcProvider(url);
  }
  return cachedAppProvider;
}

/** Payment rail reads (chain 1337). */
export function getPaymentJsonRpcProvider(): ethers.JsonRpcProvider {
  const url = getPaymentRpcUrl();
  if (!cachedPaymentProvider || cachedPaymentUrl !== url) {
    cachedPaymentUrl = url;
    cachedPaymentProvider = new ethers.JsonRpcProvider(url);
  }
  return cachedPaymentProvider;
}

export async function getNativeBalance(address: string): Promise<bigint> {
  return getJsonRpcProvider().getBalance(address);
}
