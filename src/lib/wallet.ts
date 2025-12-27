import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { detectWallets, getWalletProvider, getBestWallet, type WalletInfo } from "./wallet-detection";

// ChaosStar Network configuration (for wallet connection only - no RPC)
export const CHAOSSTAR_NETWORK = {
  chainId: 8088,
  chainIdHex: "0x1F98",
  name: "ChaosStar Network",
  symbol: "xBGL",
  decimals: 18,
  blockExplorer: "", // No explorer yet
};

let walletConnectProvider: any = null;

export async function connectWallet(useWalletConnect = false, walletId?: string) {
  // Skip WalletConnect for now - the project ID is invalid
  // Always use browser wallet directly
  // WalletConnect can be re-enabled later with a valid project ID from https://cloud.walletconnect.com
  if (useWalletConnect) {
    console.warn("WalletConnect is currently disabled due to invalid project ID. Using browser wallet instead.");
    // Fall through to browser wallet connection
  }

  // Get the wallet provider to use
  let provider: any = null;
  
  if (walletId) {
    // Use specific wallet if requested
    provider = getWalletProvider(walletId);
    if (!provider) {
      throw new Error(`Wallet "${walletId}" not found. Please install the wallet extension.`);
    }
  } else {
    // Auto-detect best available wallet
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
  try {
    // Use a timeout to prevent hanging on extension conflicts
    const requestPromise = provider.request({ 
      method: "eth_requestAccounts",
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout. Please try again.")), 10000);
    });
    
    const accounts = await Promise.race([requestPromise, timeoutPromise]) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock your wallet and try again.");
    }

    // Note: Network switching is optional - wallet connection works for signing regardless of network
    // Using Supabase for data, so network doesn't matter for signing operations
    try {
      await addChaosStarNetwork(provider);
    } catch (networkError: any) {
      // If network switch fails, that's OK - we can still sign transactions
      // User can manually switch networks later if needed
      console.debug("Network switch optional - wallet can still sign:", networkError.message);
    }

    // Use the wallet's provider for signing only (no RPC needed - using Supabase)
    const web3Provider = new ethers.BrowserProvider(provider);
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();

    return { signer, address, provider: null };
  } catch (error: any) {
    // Handle user rejection
    if (error.code === 4001) {
      throw new Error("Connection request was rejected. Please approve the connection in your wallet.");
    }
    // Handle timeout
    if (error.message?.includes("timeout")) {
      throw new Error("Connection timeout. A browser extension may be interfering. Please disable conflicting extensions and try again.");
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
  
  // Create a wallet from the private key (no RPC provider needed)
  const wallet = new ethers.Wallet(formattedKey);
  const address = await wallet.getAddress();
  
  return { signer: wallet, address, provider: null };
}

// Add ChaosStar Network to wallet (no RPC needed - just for wallet display)
export async function addChaosStarNetwork(provider?: any): Promise<boolean> {
  const walletProvider = provider || (window as any).ethereum;
  if (!walletProvider) {
    throw new Error("No wallet found. Please install a wallet extension.");
  }
  
  // Get the actual provider if it's wrapped
  let actualProvider = walletProvider;
  if (Array.isArray(walletProvider.providers)) {
    actualProvider = walletProvider.providers[0] || walletProvider;
  }

  try {
    // Try to switch to the network first
    await actualProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAOSSTAR_NETWORK.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    // If network doesn't exist, we can't add it without an RPC URL
    // Just return false - wallet connection will still work for signing
    if (switchError.code === 4902) {
      console.debug("ChaosStar network not configured in wallet - this is OK, using Supabase only");
      return false;
    } else if (switchError.code === 4001) {
      // User rejected the switch
      throw new Error("Network switch was rejected. Please approve the request in your wallet.");
    }
    throw switchError;
  }
}

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
export { detectWallets, getWalletProvider, getBestWallet, isWalletInstalled } from "./wallet-detection";
export type { WalletInfo } from "./wallet-detection";

// Check if connected to ChaosStar network
export async function isConnectedToChaosStar(): Promise<boolean> {
  const chainId = await getCurrentChainId();
  return chainId === CHAOSSTAR_NETWORK.chainId;
}

// RPC functions removed - using Supabase only
