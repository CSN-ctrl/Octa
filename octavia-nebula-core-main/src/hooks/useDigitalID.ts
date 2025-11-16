import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getDigitalIDContract } from "@/lib/contracts";
import { useWallet } from "@/contexts/WalletContext";

export interface DigitalIDInfo {
  firstName: string;
  lastName: string;
  email: string;
  avatarURI: string;
  registeredAt: bigint;
  active: boolean;
}

export function useDigitalID() {
  const { address, signer, isConnected } = useWallet();
  const [digitalID, setDigitalID] = useState<DigitalIDInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDigitalID = async (userAddress?: string) => {
    const addr = userAddress || address;
    if (!addr || !isConnected) {
      setDigitalID(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const contract = getDigitalIDContract();
      const idData = await contract.ids(addr);
      
      if (idData.active) {
        setDigitalID({
          firstName: idData.firstName,
          lastName: idData.lastName,
          email: idData.email,
          avatarURI: idData.avatarURI,
          registeredAt: idData.registeredAt,
          active: idData.active,
        });
      } else {
        setDigitalID(null);
      }
    } catch (err: any) {
      console.error("Error checking digital ID:", err);
      setError(err.message);
      setDigitalID(null);
    } finally {
      setLoading(false);
    }
  };

  const registerDigitalID = async (firstName: string, lastName: string, email: string, avatarURI: string) => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);
    try {
      const contract = getDigitalIDContract(signer);
      const tx = await contract.registerID(firstName, lastName, email, avatarURI);
      await tx.wait();
      
      // Refresh digital ID after registration
      await checkDigitalID();
      return tx.hash;
    } catch (err: any) {
      console.error("Error registering digital ID:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      checkDigitalID();
    } else {
      setDigitalID(null);
    }
  }, [address, isConnected]);

  return {
    digitalID,
    hasDigitalID: digitalID?.active || false,
    loading,
    error,
    checkDigitalID,
    registerDigitalID,
    refresh: () => checkDigitalID(),
  };
}


