import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import { connectWallet, getConnectedAddress, getRpcProvider, disconnectWalletConnect, connectWithPrivateKey, addChaosStarNetwork, detectWallets, type WalletInfo } from "@/lib/wallet";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface WalletContextType {
  address: string | null;
  signer: ethers.Signer | null;
  provider: ethers.JsonRpcProvider;
  isConnected: boolean;
  balance: string;
  availableWallets: WalletInfo[];
  connect: (useWalletConnect?: boolean, walletId?: string) => Promise<void>;
  connectWithPrivateKey: (privateKey: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const isMobile = useIsMobile();

  // Detect available wallets on mount and when window.ethereum changes
  useEffect(() => {
    const detect = () => {
      const wallets = detectWallets();
      setAvailableWallets(wallets);
    };
    
    detect();
    
    // Re-detect when ethereum provider changes
    const interval = setInterval(detect, 2000);
    return () => clearInterval(interval);
  }, []);

  const connect = async (useWalletConnect?: boolean, walletId?: string) => {
    try {
      // For browser wallets, always use browser wallet directly (skip WalletConnect)
      // WalletConnect is only useful for mobile wallets, but requires a valid project ID
      const shouldUseWalletConnect = false; // Disable WalletConnect for now due to invalid project ID
      
      // Check if any wallet is available
      const wallets = detectWallets();
      if (wallets.length === 0) {
        toast.error("No wallet found. Please install MetaMask, Core Wallet, or another compatible wallet extension.");
        throw new Error("No wallet found. Please install a compatible wallet extension.");
      }
      
      // Get the provider for the selected wallet (or best available)
      const selectedWallet = walletId 
        ? wallets.find(w => w.id === walletId)
        : wallets[0]; // Use first available if not specified
      
      if (!selectedWallet) {
        toast.error(`Wallet "${walletId}" not found.`);
        throw new Error(`Wallet "${walletId}" not found.`);
      }
      
      // Try to add/switch to ChaosStar Network before connecting
      try {
        await addChaosStarNetwork(selectedWallet.provider);
      } catch (networkError: any) {
        // If network switch fails, show warning but continue with connection
        // User can manually switch networks if needed
        console.warn("Network switch failed:", networkError.message);
        if (!networkError.message?.includes("rejected")) {
          toast.warning(`Could not switch to ChaosStar Network. You may need to switch manually in ${selectedWallet.name}.`);
        }
      }
      
      const { signer: newSigner, address: newAddress, provider: newProvider } = await connectWallet(shouldUseWalletConnect, walletId || selectedWallet.id);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletProvider(newProvider);
      await refreshBalance(newAddress);
      toast.success("Wallet connected!");

      // Listen to wallet events
      if (newProvider) {
        // Remove any existing listeners to avoid duplicates
        newProvider.removeAllListeners?.("accountsChanged");
        newProvider.removeAllListeners?.("chainChanged");
        
        newProvider.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnect();
          } else {
            setAddress(accounts[0]);
            refreshBalance(accounts[0]);
          }
        });
        
        newProvider.on("chainChanged", () => {
          // Refresh balance when chain changes
          refreshBalance(newAddress);
        });
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message || "Failed to connect wallet";
      
      // Handle specific error cases
      if (error.message?.includes("extension conflict") || error.message?.includes("evmAsk")) {
        errorMessage = "Browser extension conflict detected. Please disable other wallet extensions and try again.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your wallet extension and try again.";
      } else if (error.message?.includes("Invalid wallet provider")) {
        errorMessage = "Invalid wallet detected. Please ensure a compatible wallet is installed and enabled.";
      } else if (error.message?.includes("No wallet found")) {
        errorMessage = "No wallet found. Please install MetaMask, Core Wallet, or another compatible wallet extension.";
      }
      
      // Don't show toast for user rejection (they know they rejected it)
      if (error.code !== 4001 && !error.message?.includes("rejected")) {
        toast.error(errorMessage);
      }
      throw error; // Re-throw so caller can handle it
    }
  };

  const connectWithKey = async (privateKey: string) => {
    try {
      const { signer: newSigner, address: newAddress } = await connectWithPrivateKey(privateKey);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletProvider(null); // Not using external provider
      await refreshBalance(newAddress);
      toast.success("Wallet connected with private key!");
    } catch (error: any) {
      console.error("Failed to connect with private key:", error);
      toast.error(error.message || "Failed to connect with private key");
    }
  };

  const disconnect = async () => {
    await disconnectWalletConnect();
    if (walletProvider && walletProvider.disconnect) {
      await walletProvider.disconnect();
    }
    setAddress(null);
    setSigner(null);
    setBalance("0");
    setWalletProvider(null);
    toast.info("Wallet disconnected");
  };

  const refreshBalance = async (addr?: string | null) => {
    const addrToCheck = addr || address;
    if (!addrToCheck) return;

    try {
      // Use ethers.js directly (more reliable for C-Chain balance)
      const rpc = getRpcProvider();
      if (!rpc) {
        console.debug("RPC provider not available");
        return;
      }
      const bal = await rpc.getBalance(addrToCheck);
      setBalance(ethers.formatEther(bal));
    } catch (error: any) {
      // Check if it's an expected RPC error (404 when node not running)
      const isRpcError = error?.code === 'SERVER_ERROR' || 
                        error?.message?.includes('404') ||
                        error?.message?.includes('Not Found');
      if (isRpcError) {
        console.debug("RPC not available, balance fetch skipped");
      } else {
        console.error("Failed to fetch balance:", error);
      }
    }
  };

  useEffect(() => {
    // Check if already connected
    getConnectedAddress().then((addr) => {
      if (addr) {
        setAddress(addr);
        // Get signer if available
        const { ethereum } = window as any;
        if (ethereum) {
          const web3Provider = new ethers.BrowserProvider(ethereum);
          web3Provider.getSigner().then(setSigner).catch(() => {});
        }
        refreshBalance(addr);
      }
    });

    // Listen for account changes
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          refreshBalance(accounts[0]);
        }
      });

      ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (ethereum) {
        ethereum.removeAllListeners("accountsChanged");
        ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  // Refresh balance periodically
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      refreshBalance();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        signer,
        provider: getRpcProvider() as any,
        isConnected: !!address,
        balance,
        availableWallets,
        connect,
        connectWithPrivateKey: connectWithKey,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}


