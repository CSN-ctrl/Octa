import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  getConnectedAddress,
  disconnectWalletConnect,
  connectWithPrivateKey,
  detectWallets,
  getBestWallet,
  requestProviderAnnouncements,
  isWalletConnectConfigured,
  type WalletInfo,
} from "@/lib/wallet";
import { saveConnectedWallet } from "@/lib/supabase-service";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";

interface WalletContextType {
  address: string | null;
  signer: ethers.Signer | null;
  provider: any | null;
  isConnected: boolean;
  balance: string;
  availableWallets: WalletInfo[];
  connect: (useWalletConnect?: boolean, walletId?: string) => Promise<void>;
  connectWithPrivateKey: (privateKey: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/** QR / mobile wallets when VITE_WALLETCONNECT_PROJECT_ID is set */
function withWalletConnectOption(wallets: WalletInfo[]): WalletInfo[] {
  if (!isWalletConnectConfigured()) return wallets;
  if (wallets.some((w) => w.id === "walletconnect")) return wallets;
  return [
    ...wallets,
    {
      id: "walletconnect",
      name: "WalletConnect",
      provider: null,
      icon: "🔗",
      isInstalled: true,
    },
  ];
}

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
      setAvailableWallets(withWalletConnectOption(detectWallets()));
    };
    
    detect();
    
    // Re-detect when ethereum provider changes
    const interval = setInterval(detect, 2000);
    return () => clearInterval(interval);
  }, []);

  const refreshBalance = async (addr?: string | null) => {
    const addrToCheck = addr || address;
    if (!addrToCheck) return;

    try {
      const { getUserBalance } = await import("@/lib/supabase-service");
      const balanceData = await getUserBalance(addrToCheck).catch((err: any) => {
        if (err?.status === 406 || err?.code === "PGRST301") {
          return null;
        }
        throw err;
      });

      if (balanceData) {
        const xbglBalance = balanceData.xbgl_balance || 0;
        setBalance(xbglBalance.toString());
      } else {
        setBalance("0");
      }
    } catch (error: any) {
      if (error?.status !== 406 && error?.code !== "PGRST301") {
        logger.debug("Failed to fetch balance from Supabase:", error);
      }
      setBalance("0");
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

  const attachEip1193Listeners = (eth: any, connectedAddr: string) => {
    if (!eth?.on) return;
    try {
      eth.removeAllListeners?.("accountsChanged");
      eth.removeAllListeners?.("chainChanged");
    } catch {
      /* ignore */
    }
    eth.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        void disconnect();
      } else {
        setAddress(accounts[0]);
        void refreshBalance(accounts[0]);
        const web3Provider = new ethers.BrowserProvider(eth);
        web3Provider.getSigner().then(setSigner).catch(() => {});
      }
    });
    eth.on("chainChanged", () => {
      void refreshBalance(connectedAddr);
      const web3Provider = new ethers.BrowserProvider(eth);
      web3Provider.getSigner().then(setSigner).catch(() => {});
    });
  };

  const connect = async (useWalletConnect?: boolean, walletId?: string) => {
    try {
      requestProviderAnnouncements();
      await new Promise((r) => setTimeout(r, 100));

      const wallets = withWalletConnectOption(detectWallets());
      setAvailableWallets(wallets);

      if (useWalletConnect || walletId === "walletconnect") {
        const { signer: newSigner, address: newAddress, provider: eip1193 } = await connectWallet(true, "walletconnect");
        setSigner(newSigner);
        setAddress(newAddress);
        setWalletProvider(eip1193);
        await refreshBalance(newAddress);
        toast.success("Wallet connected!");
        saveConnectedWallet(newAddress).catch(() => {});
        attachEip1193Listeners(eip1193, newAddress);
        return;
      }

      const best = getBestWallet();
      if (!best) {
        const msg = isWalletConnectConfigured()
          ? "No browser wallet found. Install an extension or choose WalletConnect."
          : "No wallet found. Please install MetaMask, Core Wallet, or another compatible wallet extension.";
        toast.error(msg);
        throw new Error(msg);
      }

      const picked = walletId ? wallets.find((w) => w.id === walletId && w.id !== "walletconnect") : null;
      const selectedWallet = picked ?? best;
      const connectId = walletId && walletId !== "walletconnect" ? walletId : selectedWallet.id;

      const { signer: newSigner, address: newAddress, provider: eip1193 } = await connectWallet(false, connectId);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletProvider(eip1193 ?? selectedWallet.provider);
      await refreshBalance(newAddress);
      toast.success("Wallet connected!");
      saveConnectedWallet(newAddress).catch(() => {});

      const listenerTarget = eip1193 ?? selectedWallet.provider ?? (window as any).ethereum;
      attachEip1193Listeners(listenerTarget, newAddress);
    } catch (error: any) {
      logger.error("Failed to connect wallet:", error);

      let errorMessage = error.message || "Failed to connect wallet";

      if (error.message?.includes("extension conflict") || error.message?.includes("evmAsk")) {
        errorMessage = "Browser extension conflict detected. Please disable other wallet extensions and try again.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your wallet extension and try again.";
      } else if (error.message?.includes("Invalid wallet provider")) {
        errorMessage = "Invalid wallet detected. Please ensure a compatible wallet is installed and enabled.";
      } else if (error.message?.includes("No wallet found")) {
        errorMessage = "No wallet found. Please install MetaMask, Core Wallet, or another compatible wallet extension.";
      }

      if (error.code !== 4001 && !error.message?.includes("rejected")) {
        toast.error(errorMessage);
      }
      throw error;
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
      logger.error("Failed to connect with private key:", error);
      toast.error(error.message || "Failed to connect with private key");
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
        setAddress(null);
        setSigner(null);
        setBalance("0");
        toast.info("Network changed. Please reconnect your wallet.");
      });
    }

    return () => {
      if (ethereum) {
        ethereum.removeAllListeners("accountsChanged");
        ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  // Refresh balance periodically (reduced frequency to save Supabase calls)
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000); // Every 30 seconds (reduced from 10s)

    return () => clearInterval(interval);
  }, [address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        signer,
        provider: walletProvider,
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


