import { ethers } from "ethers";
import { getPaymentWalletRpcUrls } from "@/config/avax-network";
import {
  getPaymentChainId,
  getPaymentChainIdHex,
  getPaymentBlockExplorerUrl,
  getPaymentNativeSymbol,
  getPaymentNetworkName,
} from "@/config/blockchain-profile";
import {
  CHAOSSTAR_NETWORK_DEFAULTS,
  getChaosstarWalletRpcUrl,
} from "@/config/chaosstar-network";
import {
  detectWallets,
  getWalletProvider,
  getBestWallet,
  getMetaMaskOrEthereumProvider,
  type WalletInfo,
} from "./wallet-detection";

export { LOCAL_AVAX_NETWORK } from "@/config/avax-network";
export { CHAOSSTAR_NETWORK_DEFAULTS as CHAOSSTAR_NETWORK } from "@/config/chaosstar-network";

let walletConnectProvider: any = null;

export async function connectWallet(useWalletConnect = false, walletId?: string) {
  if (useWalletConnect || walletId === "walletconnect") {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.toString().trim();
    if (!projectId) {
      throw new Error(
        "WalletConnect is not configured. Add VITE_WALLETCONNECT_PROJECT_ID (https://cloud.walletconnect.com) and rebuild."
      );
    }
    await disconnectWalletConnect();
    const { default: EthereumProvider } = await import("@walletconnect/ethereum-provider");
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sarakt.com";
    walletConnectProvider = await EthereumProvider.init({
      projectId,
      chains: [1],
      optionalChains: [137, 42161, 8453, 43114, 43113, 56, 84532, getPaymentChainId()],
      showQrModal: true,
      metadata: {
        name: "Chaos Star Universe",
        description: "Connect your wallet",
        url: origin,
        icons: [`${origin}/favicon-48.png`],
      },
    });
    await walletConnectProvider.enable();
    const accounts: string[] = await walletConnectProvider.request({ method: "eth_accounts" });
    if (!accounts?.length) {
      throw new Error("WalletConnect returned no accounts.");
    }
    const web3Provider = new ethers.BrowserProvider(walletConnectProvider);
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();
    return { signer, address, provider: walletConnectProvider };
  }

  // Get the wallet provider to use
  let provider: any = null;
  
  if (walletId) {
    // Use specific wallet if requested
    provider = getWalletProvider(walletId);
    if (!provider && (walletId === "generic" || walletId === "metamask")) {
      const best = getBestWallet();
      if (best) provider = best.provider;
      if (!provider) provider = getMetaMaskOrEthereumProvider();
    }
    if (!provider) {
      throw new Error(`Wallet "${walletId}" not found. Please install the wallet extension.`);
    }
  } else {
    // Auto-detect best available wallet (includes window.ethereum / window.metamask fallback)
    const bestWallet = getBestWallet();
    if (!bestWallet) {
      throw new Error("No wallet found. Please install MetaMask, Core Wallet, or another compatible wallet extension.");
    }
    provider = bestWallet.provider;
    console.log(`Using wallet: ${bestWallet.name}`);
  }
  
  // Validate the provider has the required methods
  if (!provider || typeof provider.request !== 'function') {
    throw new Error("Invalid wallet provider detected. Please ensure a compatible wallet is installed and enabled.");
  }

  // Request account access - this will trigger wallet popup
  const CONNECT_TIMEOUT_MS = 20000; // 20s - wallet extensions (e.g. with SES/lockdown) can be slow to respond
  const attemptConnect = (): Promise<string[]> =>
    new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Connection timeout. Please try again."));
      }, CONNECT_TIMEOUT_MS);
      provider
        .request({ method: "eth_requestAccounts" })
        .then((accounts: string[]) => {
          clearTimeout(timeoutId);
          resolve(accounts);
        })
        .catch((err: any) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });

  try {
    let accounts: string[];
    try {
      accounts = await attemptConnect();
    } catch (firstErr: any) {
      // Retry once on timeout (SES/lockdown and other extensions can delay the first response)
      if (firstErr?.message?.includes("timeout")) {
        accounts = await attemptConnect();
      } else {
        throw firstErr;
      }
    }

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock your wallet and try again.");
    }

    await addPaymentNetwork(provider);

    const web3Provider = new ethers.BrowserProvider(provider);
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();

    return { signer, address, provider: null };
  } catch (error: any) {
    // Handle user rejection
    if (error.code === 4001) {
      throw new Error("Connection request was rejected. Please approve the connection in your wallet.");
    }
    // Handle timeout (SES/lockdown or other extensions can delay wallet response)
    if (error.message?.includes("timeout")) {
      throw new Error(
        "Wallet is taking too long to respond. If you use MetaMask or a security extension (SES/lockdown), try again or allow the wallet popup—it may appear behind this window."
      );
    }
    // Handle extension conflicts
    if (error.message?.includes("Unexpected error") || error.message?.includes("evmAsk")) {
      throw new Error("Browser extension conflict detected. Please disable other wallet extensions and try again.");
    }
    // Handle other errors
    if (error.message?.includes("User rejected")) {
      throw new Error("Connection request was rejected. Please approve the connection in your wallet.");
    }
    // Re-throw with more context
    throw new Error(`Failed to connect wallet: ${error.message || "Unknown error"}`);
  }
}

export async function disconnectWalletConnect() {
  if (walletConnectProvider) {
    await walletConnectProvider.disconnect();
    walletConnectProvider = null;
  }
}

export async function getConnectedAddress(): Promise<string | null> {
  const { ethereum } = window as any;
  if (!ethereum) return null;

  const accounts = await ethereum.request({ method: "eth_accounts" });
  return accounts.length ? accounts[0] : null;
}

export async function connectWithPrivateKey(privateKey: string) {
  // Ensure private key has 0x prefix
  const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  
  const { getJsonRpcProvider } = await import("./evm-provider");
  const provider = getJsonRpcProvider();
  const wallet = new ethers.Wallet(formattedKey, provider);
  const address = await wallet.getAddress();

  return { signer: wallet, address, provider };
}

/** Prompt MetaMask to add/switch to ChaosStar Network (native xBGL, chain 8888). */
export async function addChaosStarNetwork(provider?: any): Promise<boolean> {
  const walletProvider = provider || (window as any).ethereum;
  if (!walletProvider?.request) return false;

  const net = CHAOSSTAR_NETWORK_DEFAULTS;
  const params = {
    chainId: net.chainIdHex,
    chainName: net.name,
    nativeCurrency: { name: net.symbol, symbol: net.symbol, decimals: net.decimals },
    rpcUrls: [getChaosstarWalletRpcUrl()],
    blockExplorerUrls: net.blockExplorer ? [net.blockExplorer] : [],
  };

  try {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: net.chainIdHex }],
    });
    return true;
  } catch (switchErr: any) {
    if (switchErr?.code === 4902) {
      try {
        await walletProvider.request({
          method: "wallet_addEthereumChain",
          params: [params],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/** Prompt MetaMask to add/switch to the payment rail (1337 or Fuji from env). */
export async function addPaymentNetwork(provider?: any): Promise<boolean> {
  const walletProvider = provider || (window as any).ethereum;
  if (!walletProvider?.request) return false;

  const chainIdHex = getPaymentChainIdHex();
  const symbol = getPaymentNativeSymbol();
  const explorer = getPaymentBlockExplorerUrl();
  const params = {
    chainId: chainIdHex,
    chainName: getPaymentNetworkName(),
    nativeCurrency: { name: symbol, symbol, decimals: 18 },
    rpcUrls: getPaymentWalletRpcUrls(),
    blockExplorerUrls: explorer ? [explorer] : [],
  };

  try {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (switchErr: any) {
    if (switchErr?.code === 4902) {
      try {
        await walletProvider.request({
          method: "wallet_addEthereumChain",
          params: [params],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/** @deprecated Use addPaymentNetwork */
export const addLocalAvaxNetwork = addPaymentNetwork;


// Get current chain ID from wallet
export async function getCurrentChainId(provider?: any): Promise<number | null> {
  const walletProvider = provider || (window as any).ethereum;
  if (!walletProvider) return null;
  
  try {
    const chainIdHex = await walletProvider.request({ method: "eth_chainId" });
    return parseInt(chainIdHex, 16);
  } catch {
    return null;
  }
}

// Export wallet detection functions (re-export from wallet-detection)
export {
  detectWallets,
  getWalletProvider,
  getBestWallet,
  isWalletInstalled,
  requestProviderAnnouncements,
  getMetaMaskOrEthereumProvider,
  isWalletConnectConfigured,
  findMetaMaskProvider,
  isLikelyMetaMaskProvider,
} from "./wallet-detection";
export type { WalletInfo } from "./wallet-detection";

export async function isConnectedToChaosStar(): Promise<boolean> {
  const chainId = await getCurrentChainId();
  if (chainId == null) return false;
  const { isChaosStarChainId } = await import("@/config/chaosstar-network");
  return isChaosStarChainId(chainId);
}

// RPC functions removed - using Supabase only
