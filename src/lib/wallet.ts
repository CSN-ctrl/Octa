import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { detectWallets, getWalletProvider, getBestWallet, type WalletInfo } from "./wallet-detection";

const DEFAULT_FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc"; // public Fuji endpoint

// ChaosStar Network RPC options (in order of preference):
// 1. Direct EVM RPC from L1 node (port 24362) - Primary endpoint
// 2. Stargate EVM-compatible RPC (has CORS enabled) - port 8545
// 3. Backend proxy RPC (has CORS enabled) - port 5001
// 4. Direct HyperSDK RPC (no CORS - only works server-side)
// EVM RPC endpoint from L1 node (port 24362)
// Blockchain ID from sidecar.json: ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy
// Both blockchain ID and name formats work on port 24362
// Node: http://127.0.0.1:24362 [NodeID-MYY8LGJszhXRusAWnUuNTFeHCo1pZDoJP]
const EVM_RPC = "http://127.0.0.1:24362/ext/bc/ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy/rpc";
const STARGATE_RPC = "http://localhost:8545";
const STARGATE_RPC_FULL = "http://localhost:8545/ext/bc/ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy/rpc";
const BACKEND_RPC_PROXY = "http://localhost:5001/rpc";


// ChaosStar Network configuration
export const CHAOSSTAR_NETWORK = {
  chainId: 8088,
  chainIdHex: "0x1F98",
  name: "ChaosStar Network",
  rpcUrl: EVM_RPC, // Direct EVM RPC endpoint (port 24362)
  rpcUrlFull: EVM_RPC, // Full path for MetaMask
  symbol: "xBGL",
  decimals: 18,
  blockExplorer: "", // No explorer yet
};

// Get RPC URL - Use direct EVM RPC endpoint (port 24362)
function getRpcUrl(): string {
  // Check environment variable first
  const envRpc = (import.meta as any).env?.VITE_CHAOSSTAR_RPC;
  if (envRpc) return envRpc;
  
  // Use direct EVM RPC endpoint (port 24362) - the actual EVM chain
  // Note: This may have CORS issues in browser, but it's the correct endpoint
  return EVM_RPC;
}

export function getRpcProvider(): ethers.JsonRpcProvider | null {
	try {
		const rpcUrl = getRpcUrl();
		if (!rpcUrl) {
			console.warn("No RPC URL configured");
			return null;
		}
		// Create provider with network configuration to disable ENS
		// In ethers v6, chainId must be a number, not BigInt
		const network = {
			name: "ChaosStar Network",
			chainId: CHAOSSTAR_NETWORK.chainId, // Use number directly
			ensAddress: null, // Disable ENS resolution
		};
		const provider = new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: true });
		return provider;
	} catch (error) {
		console.error("Failed to create RPC provider:", error);
		return null;
	}
}

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

    // Ensure we're on the correct network (ChaosStar Network)
    try {
      await addChaosStarNetwork();
    } catch (networkError: any) {
      // If network switch fails, log but don't fail the connection
      // User can manually switch networks later
      console.warn("Failed to switch to ChaosStar Network:", networkError.message);
    }

    // Use the wallet's provider but transactions will go through Chaos Star Network
    // The actual RPC connection is handled by getRpcProvider() in contract calls
    const web3Provider = new ethers.BrowserProvider(provider);
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();

    return { signer, address, provider };
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
  
  // Create a wallet from the private key
  const wallet = new ethers.Wallet(formattedKey, getRpcProvider());
  const address = await wallet.getAddress();
  
  return { signer: wallet, address, provider: getRpcProvider() };
}

// Legacy function - use getLandContract from @/lib/contracts instead
export function getContract(signer: ethers.Signer) {
  const { getLandContract } = require("./contracts");
  return getLandContract(signer);
}

// Add ChaosStar Network to wallet
export async function addChaosStarNetwork(provider?: any): Promise<boolean> {
  const walletProvider = provider || (window as any).ethereum;
  if (!walletProvider) {
    throw new Error("No wallet found. Please install a wallet extension or use a ChaosStar Key instead.");
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
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        // Use the direct EVM RPC URL
        const rpcUrl = CHAOSSTAR_NETWORK.rpcUrl || EVM_RPC;
        
        await actualProvider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAOSSTAR_NETWORK.chainIdHex,
            chainName: CHAOSSTAR_NETWORK.name,
            nativeCurrency: {
              name: CHAOSSTAR_NETWORK.symbol,
              symbol: CHAOSSTAR_NETWORK.symbol,
              decimals: CHAOSSTAR_NETWORK.decimals,
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: CHAOSSTAR_NETWORK.blockExplorer ? [CHAOSSTAR_NETWORK.blockExplorer] : [],
          }],
        });
        return true;
      } catch (addError: any) {
        console.error("Failed to add ChaosStar network:", addError);
        // Provide more helpful error messages
        if (addError.code === 4001) {
          throw new Error("Network addition was rejected. Please approve the request in your wallet.");
        } else if (addError.message?.includes("user rejected")) {
          throw new Error("Network addition was cancelled.");
        } else {
          throw new Error(`Failed to add network: ${addError.message || "Unknown error"}. Make sure the EVM node is running on port 24362.`);
        }
      }
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

// Check Stargate RPC health
export async function checkStargateHealth(): Promise<{ connected: boolean; chainId?: number; blockNumber?: number }> {
  try {
    const provider = getRpcProvider();
    if (!provider) return { connected: false };
    
    const [network, blockNumber] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
    ]);
    
    return {
      connected: true,
      chainId: Number(network.chainId),
      blockNumber,
    };
  } catch (error: any) {
    // Check for RPC connection errors
    const isRpcError = error?.message?.includes('404') || 
                      error?.message?.includes('Not Found') ||
                      error?.code === 'NETWORK_ERROR' ||
                      error?.code === 'SERVER_ERROR' ||
                      error?.status === 404 ||
                      error?.message?.includes('fetch failed') ||
                      error?.message?.includes('ERR_CONNECTION_REFUSED');
    
    if (isRpcError) {
      console.debug("RPC node not available (expected if local node isn't running)");
    }
    return { connected: false };
  }
}

// Check if RPC is available before making calls
export async function isRpcAvailable(): Promise<boolean> {
  const health = await checkStargateHealth();
  return health.connected;
}
