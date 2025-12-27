import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import * as supabaseService from "@/lib/supabase-service";
import { toast } from "sonner";

export interface DigitalIDInfo {
  firstName: string;
  lastName: string;
  email: string;
  avatarURI: string;
  registeredAt: bigint;
  active: boolean;
}

export function useDigitalID() {
  const { address, isConnected } = useWallet();
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
      const identity = await supabaseService.getDigitalIdentity(addr);
      if (identity) {
        // Parse name to extract first/last name if needed
        const nameParts = identity.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setDigitalID({
          firstName,
          lastName,
          email: '', // Not stored in Supabase schema
          avatarURI: identity.avatar_cid || '',
          registeredAt: BigInt(new Date(identity.created_at || '').getTime()),
          active: true,
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
    if (!address) {
      throw new Error("Wallet not connected. Please connect your wallet to register a Digital ID.");
    }

    setLoading(true);
    setError(null);
    try {
      await supabaseService.upsertDigitalIdentity({
        wallet_address: address,
        name: `${firstName} ${lastName}`.trim(),
        avatar_cid: avatarURI || null,
        identity_type: 'user',
      });
      
      toast.success("Digital ID registered successfully!");
      
      // Refresh digital ID after registration
      await checkDigitalID();
    } catch (err: any) {
      console.error("Error registering digital ID:", err);
      const errorMessage = err.message || "Failed to register Digital ID";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deactivateDigitalID = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);
    try {
      const identity = await supabaseService.getDigitalIdentity(address);
      if (identity) {
        await supabaseService.deleteDigitalIdentity(identity.id);
        toast.success("Digital ID deactivated");
      }
      
      await checkDigitalID();
    } catch (err: any) {
      console.error("Error deactivating digital ID:", err);
      const errorMessage = err.message || "Failed to deactivate Digital ID";
      setError(errorMessage);
      throw new Error(errorMessage);
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
    deactivateDigitalID,
    refresh: () => checkDigitalID(),
    hasContract: true, // Always available with Supabase
  };
}
