import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type StarSystemRow = Database['public']['Tables']['star_systems']['Row'];
type PlanetRow = Database['public']['Tables']['planets']['Row'];

export interface StarSystem {
  id: string;
  name: string;
  subnet_id: string | null;
  owner_wallet: string;
  treasury_balance: any;
  planets: string[];
  created_at: string;
  rpc_url?: string | null;
  chain_id?: number | null;
  status?: string | null;
}

export interface Planet {
  id: string;
  name: string;
  star_system_id: string;
  node_type: "master" | "validator";
  owner_wallet: string;
  ip_address?: string;
  status: "active" | "deploying" | "inactive";
  created_at: string;
}

export function useCelestialForge() {
  const { address, signer, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [starSystems, setStarSystems] = useState<StarSystem[]>([]);
  const [userStarSystems, setUserStarSystems] = useState<StarSystem[]>([]);

  // Cost constants (in AVAX)
  const STAR_SYSTEM_COST = 10000; // 10,000 AVAX for a new subnet
  const PLANET_COST = 2000; // 2,000 AVAX for a master node

  const fetchStarSystems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('star_systems')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const systems = (data || []) as StarSystem[];
      setStarSystems(systems);

      // Filter user's systems
      if (address) {
        const userSystems = systems.filter(
          (sys) => sys.owner_wallet?.toLowerCase() === address.toLowerCase()
        );
        setUserStarSystems(userSystems);
      }
    } catch (error) {
      console.error('Error fetching star systems:', error);
    }
  }, [address]);

  const spawnStarSystem = async (name: string, tributePercent: number = 5) => {
    if (!signer || !address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    try {
      // Validate inputs
      if (!name || name.length < 3) {
        throw new Error("Star system name must be at least 3 characters");
      }
      if (tributePercent < 0 || tributePercent > 20) {
        throw new Error("Tribute must be between 0-20%");
      }

      // Check user balance
      const balance = await signer.provider!.getBalance(address);
      const cost = ethers.parseEther(STAR_SYSTEM_COST.toString());
      
      if (balance < cost) {
        throw new Error(`Insufficient balance. Need ${STAR_SYSTEM_COST} AVAX`);
      }

      toast.info("Initiating star system deployment...");

      // Call edge function to spawn subnet
      const { data, error } = await supabase.functions.invoke('spawn-subnet', {
        body: {
          name,
          owner_wallet: address,
          tribute_percent: tributePercent,
          payment_amount: STAR_SYSTEM_COST
        }
      });

      if (error) throw error;

      toast.success(`Star system "${name}" deployment initiated!`);
      toast.info("Subnet provisioning may take 10-15 minutes...");

      await fetchStarSystems();
      return data;
    } catch (error: any) {
      console.error("Error spawning star system:", error);
      toast.error(error.message || "Failed to spawn star system");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const spawnPlanet = async (
    starSystemId: string,
    planetName: string,
    planetType: "habitable" | "resource" | "research" | "military"
  ) => {
    if (!signer || !address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    try {
      // Validate inputs
      if (!planetName || planetName.length < 3) {
        throw new Error("Planet name must be at least 3 characters");
      }

      // Check ownership
      const starSystem = starSystems.find(sys => sys.id === starSystemId);
      if (!starSystem) {
        throw new Error("Star system not found");
      }
      if (starSystem.owner_wallet?.toLowerCase() !== address.toLowerCase()) {
        throw new Error("You don't own this star system");
      }

      // Check user balance
      const balance = await signer.provider!.getBalance(address);
      const cost = ethers.parseEther(PLANET_COST.toString());
      
      if (balance < cost) {
        throw new Error(`Insufficient balance. Need ${PLANET_COST} AVAX`);
      }

      toast.info("Deploying master node for planet...");

      // Call edge function to spawn planet/node
      const { data, error } = await supabase.functions.invoke('spawn-planet', {
        body: {
          star_system_id: starSystemId,
          name: planetName,
          type: planetType,
          owner_wallet: address,
          payment_amount: PLANET_COST
        }
      });

      if (error) throw error;

      toast.success(`Planet "${planetName}" master node deployed!`);
      toast.info("Node synchronization in progress...");

      await fetchStarSystems();
      return data;
    } catch (error: any) {
      console.error("Error spawning planet:", error);
      toast.error(error.message || "Failed to spawn planet");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    starSystems,
    userStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
    spawnStarSystem,
    spawnPlanet,
    fetchStarSystems,
  };
}
