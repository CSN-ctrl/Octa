import { useState, useCallback } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [provider, setProvider] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    if (!(window as any).ethereum) {
      console.warn("No wallet detected");
      return;
    }

    try {
      const eth = (window as any).ethereum;
      const web3Provider = new ethers.BrowserProvider(eth);
      const accounts = await eth.request({ method: "eth_requestAccounts" });

      const userAddress = accounts[0];

      setProvider(web3Provider);
      setAddress(userAddress);
      setIsConnected(true);

      const bal = await web3Provider.getBalance(userAddress);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  }, []);

  return { provider, address, balance, isConnected, connect };
}
