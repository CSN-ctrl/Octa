import { hexlify, toUtf8Bytes } from "ethers";
import { addPaymentNetwork, getCurrentChainId } from "@/lib/wallet";
import { PILOT_CHAIN_ID } from "@/lib/node-approve-contract";
import { getPaymentChainIdHex, getPaymentNetworkName, getPaymentNativeSymbol, getPaymentBlockExplorerUrl } from "@/config/blockchain-profile";
import { getPaymentWalletRpcUrls } from "@/config/avax-network";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export async function personalSignRawMessage(
  provider: Eip1193,
  account: string,
  rawMessage: string,
): Promise<string> {
  const hexMessage = hexlify(toUtf8Bytes(rawMessage));
  const sig = await provider.request({
    method: "personal_sign",
    params: [hexMessage, account],
  });
  if (typeof sig !== "string" || !sig.startsWith("0x")) {
    throw new Error("Wallet did not return a signature.");
  }
  return sig;
}

export async function ensureWalletChain(
  provider: Eip1193 | null | undefined,
  targetChainId: number,
): Promise<boolean> {
  const walletProvider = provider ?? (typeof window !== "undefined" ? (window as any).ethereum : null);
  if (!walletProvider?.request) return false;

  const current = await getCurrentChainId(walletProvider);
  if (current === targetChainId) return true;

  if (targetChainId === PILOT_CHAIN_ID) {
    return addPaymentNetwork(walletProvider);
  }

  const chainIdHex = `0x${targetChainId.toString(16)}`;
  try {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (switchErr: any) {
    if (switchErr?.code === 4902 && targetChainId === PILOT_CHAIN_ID) {
      return addPaymentNetwork(walletProvider);
    }
    if (switchErr?.code === 4902) {
      try {
        await walletProvider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: getPaymentNetworkName(),
              nativeCurrency: {
                name: getPaymentNativeSymbol(),
                symbol: getPaymentNativeSymbol(),
                decimals: 18,
              },
              rpcUrls: getPaymentWalletRpcUrls(),
              blockExplorerUrls: getPaymentBlockExplorerUrl() ? [getPaymentBlockExplorerUrl()] : [],
            },
          ],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function resolveWalletProvider(
  contextProvider: unknown,
): Eip1193 | null {
  if (contextProvider && typeof (contextProvider as Eip1193).request === "function") {
    return contextProvider as Eip1193;
  }
  const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
  if (eth?.request) return eth as Eip1193;
  return null;
}

export { getPaymentChainIdHex };
