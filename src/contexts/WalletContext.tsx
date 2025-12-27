import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import { connectWallet, getConnectedAddress, disconnectWalletConnect, connectWithPrivateKey, detectWallets, type WalletInfo } from "@/lib/wallet";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface WalletContextType {
  address: string | null;
  signer: ethers.Signer | null;
  provider: ethers.JsonRpcProvider | null;
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
      
      // Note: Network switching removed - using Supabase instead of blockchain RPC
      const { signer: newSigner, address: newAddress, provider: newProvider } = await connectWallet(shouldUseWalletConnect, walletId || selectedWallet.id);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletProvider(selectedWallet.provider); // Store the actual provider for event listening
      await refreshBalance(newAddress);
      toast.success("Wallet connected!");

      // Listen to wallet events from the browser provider
      const { ethereum } = window as any;
      if (ethereum) {
        // Remove any existing listeners to avoid duplicates
        ethereum.removeAllListeners?.("accountsChanged");
        ethereum.removeAllListeners?.("chainChanged");
        
        ethereum.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnect();
          } else {
            setAddress(accounts[0]);
            refreshBalance(accounts[0]);
            // Update signer when account changes
            const web3Provider = new ethers.BrowserProvider(ethereum);
            web3Provider.getSigner().then(setSigner).catch(() => {});
          }
        });
        
        ethereum.on("chainChanged", () => {
          // Refresh balance and signer when chain changes
          refreshBalance(newAddress);
          const web3Provider = new ethers.BrowserProvider(ethereum);
          web3Provider.getSigner().then(setSigner).catch(() => {});
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
      // Get balance from Supabase instead of RPC
      const { getUserBalance } = await import("@/lib/supabase-service");
      const balanceData = await getUserBalance(addrToCheck);
      
      if (balanceData) {
        // Use xBGL balance as the primary balance
        const xbglBalance = balanceData.xbgl_balance || 0;
        setBalance(xbglBalance.toString());
      } else {
        setBalance("0");
      }
    } catch (error: any) {
      console.debug("Failed to fetch balance from Supabase:", error);
      setBalance("0");
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
        provider: null, // No RPC provider needed - using Supabase
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


