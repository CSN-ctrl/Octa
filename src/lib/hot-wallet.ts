/**
 * Hot Wallet Configuration and Management
 */

import { supabase } from "@/integrations/supabase/client";
import { PROJECT_WALLET } from "@/config/project-wallet";
import { getDepositNetworkId } from "@/config/blockchain-profile";
import { NETWORKS, NetworkConfig } from "./networks";

export interface HotWallet {
  id: string;
  network_id: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get hot wallet address for a specific network
 */
export async function getHotWalletAddress(networkId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("hot_wallets")
      .select("address")
      .eq("network_id", networkId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.address;
  } catch (error) {
    console.error("Failed to fetch hot wallet address:", error);
    return null;
  }
}

/**
 * Get all hot wallet addresses
 */
export async function getAllHotWallets(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from("hot_wallets")
      .select("network_id, address")
      .eq("is_active", true);

    if (error || !data) {
      return { [getDepositNetworkId()]: PROJECT_WALLET };
    }

    const wallets: Record<string, string> = {};
    data.forEach((wallet: any) => {
      wallets[wallet.network_id] = wallet.address;
    });

    // Ensure the active deposit network always has a wallet (Fuji).
    const depositNetworkId = getDepositNetworkId();
    if (!wallets[depositNetworkId]) {
      wallets[depositNetworkId] = PROJECT_WALLET;
    }

    return wallets;
  } catch (error) {
    console.error("Failed to fetch hot wallets:", error);
    return { [getDepositNetworkId()]: PROJECT_WALLET };
  }
}

/**
 * Set hot wallet address for a network (admin only)
 */
export async function setHotWalletAddress(
  networkId: string,
  address: string
): Promise<boolean> {
  try {
    // Validate network exists
    const network = NETWORKS.find(n => n.id === networkId);
    if (!network) {
      throw new Error(`Invalid network ID: ${networkId}`);
    }

    // Validate address format (basic check)
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error("Invalid wallet address format");
    }

    const { error } = await supabase
      .from("hot_wallets")
      .upsert({
        network_id: networkId,
        address: address.toLowerCase(),
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "network_id"
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to set hot wallet address:", error);
    return false;
  }
}
