import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import * as supabaseService from "@/lib/supabase-service";
import type { Tables } from "@/integrations/supabase/types";
import { getStarSystemContract, getPlanetContract, STAR_SYSTEM_ABI, PLANET_ABI } from "@/lib/contracts";
import { getRpcProvider } from "@/lib/wallet";

type StarSystemRow = Tables<'star_systems'>;
type PlanetRow = Tables<'planets'>;

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
  contract_address?: string | null;
  tribute_percent?: number | null;
  native_balance?: bigint | null;
  active?: boolean | null;
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

  // Fetch star system data from blockchain contract
  const fetchStarSystemFromBlockchain = useCallback(async (contractAddress: string, systemId: string): Promise<Partial<StarSystem> | null> => {
    try {
      const provider = getRpcProvider();
      if (!provider) {
        console.debug("No RPC provider available for blockchain fetch");
        return null;
      }

      // Check if contract exists
      const code = await provider.getCode(contractAddress);
      if (!code || code === "0x") {
        console.debug(`No contract found at address ${contractAddress}`);
        return null;
      }

      const contract = new ethers.Contract(contractAddress, STAR_SYSTEM_ABI, provider);
      
      // Fetch system data from blockchain
      const systemData = await contract.systemData();
      
      // Fetch planets
      const planetAddresses = await contract.getPlanets();
      const planetCount = await contract.planetCount();

      return {
        name: systemData.name,
        subnet_id: systemData.subnetId,
        owner_wallet: systemData.owner,
        rpc_url: systemData.rpcUrl,
        chain_id: Number(systemData.chainId),
        tribute_percent: Number(systemData.tributePercent),
        native_balance: systemData.nativeBalance,
        active: systemData.active,
        status: systemData.active ? "active" : "inactive",
        planets: planetAddresses.map((addr: string) => addr.toLowerCase()),
        contract_address: contractAddress,
      };
    } catch (error: any) {
      console.error(`Error fetching star system ${contractAddress} from blockchain:`, error);
      return null;
    }
  }, []);

  // Fetch planet data from blockchain contract
  const fetchPlanetFromBlockchain = useCallback(async (contractAddress: string): Promise<any | null> => {
    try {
      const provider = getRpcProvider();
      if (!provider) {
        return null;
      }

      const code = await provider.getCode(contractAddress);
      if (!code || code === "0x") {
        return null;
      }

      const contract = new ethers.Contract(contractAddress, PLANET_ABI, provider);
      const planetData = await contract.planetData();
      
      return {
        name: planetData.name,
        owner_wallet: planetData.owner,
        star_system: planetData.starSystem,
        planet_type: planetData.planetType,
        node_type: planetData.nodeType,
        ip_address: planetData.ipAddress,
        active: planetData.active,
        status: planetData.active ? "active" : "inactive",
        native_balance: planetData.nativeBalance,
        contract_address: contractAddress,
      };
    } catch (error: any) {
      console.error(`Error fetching planet ${contractAddress} from blockchain:`, error);
      return null;
    }
  }, []);

  // Query Supabase to find all StarSystem contracts
  const discoverStarSystemsFromBlockchain = useCallback(async (): Promise<StarSystem[]> => {
    // Fetch from Supabase instead of backend API
    try {
      const systems = await supabaseService.getStarSystems();
      
      // Convert Supabase format to StarSystem format
      return systems.map((sys): StarSystem => ({
        id: sys.id,
        name: sys.name,
        subnet_id: sys.subnet_id || null,
        owner_wallet: sys.owner_wallet,
        treasury_balance: sys.treasury_balance || {},
        planets: sys.planets || [],
        created_at: sys.created_at || new Date().toISOString(),
        rpc_url: sys.rpc_url || null,
        chain_id: sys.chain_id || null,
        status: sys.status || "active",
        contract_address: null,
        tribute_percent: sys.tribute_percent ? Number(sys.tribute_percent) : null,
        native_balance: null,
        active: sys.status === "active",
      }));
    } catch (error) {
      console.debug("Could not fetch star systems from Supabase:", error);
    }
    
    // Return empty array if Supabase is not available
    return [];

  }, [fetchStarSystemFromBlockchain]);

  // Get Sarakt Star System (always available)
  const getSaraktStarSystem = useCallback(async (): Promise<StarSystem> => {
    try {
      // Try to get from Supabase first
      const sarakt = await supabaseService.getStarSystemById("sarakt-star-system");
      if (sarakt) {
          return {
          id: sarakt.id,
          name: sarakt.name,
            subnet_id: sarakt.subnet_id || "ChaosStarNetwork",
          owner_wallet: sarakt.owner_wallet,
            treasury_balance: sarakt.treasury_balance || {},
            planets: sarakt.planets || ["sarakt-prime", "zythera"],
            created_at: sarakt.created_at || new Date().toISOString(),
            rpc_url: sarakt.rpc_url || null,
            chain_id: sarakt.chain_id || null,
            status: sarakt.status || "active",
            contract_address: null,
          tribute_percent: sarakt.tribute_percent ? Number(sarakt.tribute_percent) : 0,
            native_balance: null,
          active: sarakt.status === "active",
          } as StarSystem;
      }
    } catch (error) {
      console.debug("Failed to fetch Sarakt Star System from Supabase, using default:", error);
    }

    // Default Sarakt Star System
    return {
      id: "sarakt-star-system",
      name: "Sarakt Star System",
      subnet_id: "ChaosStarNetwork",
      owner_wallet: "",
      treasury_balance: {},
      planets: ["sarakt-prime", "zythera"],
      created_at: new Date().toISOString(),
      rpc_url: null,
      chain_id: null,
      status: "active",
      contract_address: null,
      tribute_percent: 0, // Sarakt Star System doesn't pay tribute
      native_balance: null,
      active: true,
    } as StarSystem;
  }, []);

  const fetchStarSystems = useCallback(async () => {
    setLoading(true);
    try {
      // Always get Sarakt Star System first
      const saraktSystem = await getSaraktStarSystem();
      const allSystems: StarSystem[] = [saraktSystem];

      // Try to discover additional star systems from blockchain
      try {
        const blockchainSystems = await discoverStarSystemsFromBlockchain();
        
        // Add other systems (excluding Sarakt if it was already added)
        for (const system of blockchainSystems) {
          const isSarakt = system.id === "sarakt-star-system" || 
                          system.name === "Sarakt Star System" ||
                          system.subnet_id === "ChaosStarNetwork";
          if (!isSarakt) {
            allSystems.push(system);
          }
        }
      } catch (error) {
        console.debug("Blockchain discovery failed, using Sarakt only:", error);
      }

      // If we only have Sarakt, try Supabase as additional fallback
      if (allSystems.length === 1) {
        try {
          const systems = await supabaseService.getStarSystems();
            
          // Add systems from Supabase (excluding Sarakt)
          for (const sys of systems) {
            const isSarakt = sys.id === "sarakt-star-system" || 
                            sys.name === "Sarakt Star System";
              if (!isSarakt) {
                      allSystems.push({
                id: sys.id,
                name: sys.name,
                subnet_id: sys.subnet_id || null,
                owner_wallet: sys.owner_wallet,
                treasury_balance: sys.treasury_balance || {},
                planets: sys.planets || [],
                created_at: sys.created_at || new Date().toISOString(),
                rpc_url: sys.rpc_url || null,
                chain_id: sys.chain_id || null,
                status: sys.status || "active",
                contract_address: null,
                tribute_percent: sys.tribute_percent ? Number(sys.tribute_percent) : null,
                native_balance: null,
                active: sys.status === "active",
                      } as StarSystem);
            }
          }
        } catch (error) {
          console.debug("Supabase fetch failed:", error);
        }
      }

      // Always ensure we have at least Sarakt Star System
      if (allSystems.length === 0) {
        allSystems.push(saraktSystem);
      }

      setStarSystems(allSystems);

      // Filter user's systems
      if (address) {
        const userSystems = allSystems.filter(
          (sys) => sys.owner_wallet?.toLowerCase() === address.toLowerCase()
        );
        setUserStarSystems(userSystems);
      } else {
        setUserStarSystems([]);
      }
    } catch (error) {
      console.error('Error fetching star systems:', error);
      // Even on error, show Sarakt Star System
      const saraktSystem = await getSaraktStarSystem();
      setStarSystems([saraktSystem]);
      setUserStarSystems([]);
    } finally {
      setLoading(false);
    }
  }, [address, fetchStarSystemFromBlockchain, discoverStarSystemsFromBlockchain, getSaraktStarSystem]);

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

      // Check for duplicate names via Supabase
      try {
        const systems = await supabaseService.getStarSystems();
        const existingSystem = systems.find((s) => s.name === name);
      if (existingSystem) {
        throw new Error('Star system name already exists');
        }
      } catch (error: any) {
        // If check fails, continue (might be network issue)
        if (!error.message?.includes('already exists')) {
          console.debug("Could not check for duplicate names:", error);
        } else {
          throw error;
        }
      }

      // Balance check removed - allowing mock star system creation

      toast.info("Creating star system...");

      // Create star system in Supabase
      const starSystemData = await supabaseService.createStarSystem({
          name,
          owner_wallet: address,
          tribute_percent: tributePercent,
        status: "deploying",
        planets: [],
        treasury_balance: {},
      });

      toast.success(`Star system "${name}" created successfully!`);

      await fetchStarSystems();
      return {
        id: starSystemData.id,
        name: starSystemData.name,
        subnet_id: starSystemData.subnet_id,
        owner_wallet: starSystemData.owner_wallet,
        treasury_balance: starSystemData.treasury_balance || {},
        planets: starSystemData.planets || [],
        created_at: starSystemData.created_at || new Date().toISOString(),
        rpc_url: starSystemData.rpc_url,
        chain_id: starSystemData.chain_id,
        status: starSystemData.status || "deploying",
        contract_address: null,
        tribute_percent: starSystemData.tribute_percent ? Number(starSystemData.tribute_percent) : null,
        native_balance: null,
        active: false,
      } as StarSystem;
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

      // Check for duplicate planet names via Supabase
      try {
        const planets = await supabaseService.getPlanets({ starSystemId });
          const existingPlanet = planets.find(
          (p) => p.star_system_id === starSystemId && p.name === planetName
          );
      if (existingPlanet) {
        throw new Error('Planet name already exists in this star system');
        }
      } catch (error: any) {
        // If check fails, continue (might be network issue)
        if (!error.message?.includes('already exists')) {
          console.debug("Could not check for duplicate planet names:", error);
        } else {
          throw error;
        }
      }

      toast.info("Creating planet...");

      // Create planet in Supabase
      const planetData = await supabaseService.createPlanet({
          name: planetName,
          star_system_id: starSystemId,
          owner_wallet: address,
          planet_type: planetType,
        node_type: "master",
        status: "deploying",
      });

      // Update star system to include this planet
      const updatedPlanets = [...(starSystem.planets || []), planetData.id];
      await supabaseService.updateStarSystem(starSystemId, {
        planets: updatedPlanets,
      });

      toast.success(`Planet "${planetName}" created successfully!`);
      await fetchStarSystems();
      return {
        id: planetData.id,
        name: planetData.name,
        star_system_id: planetData.star_system_id || starSystemId,
        node_type: (planetData.node_type as "master" | "validator") || "master",
        owner_wallet: planetData.owner_wallet,
        ip_address: planetData.ip_address,
        status: (planetData.status as "active" | "deploying" | "inactive") || "deploying",
        created_at: planetData.created_at || new Date().toISOString(),
      } as Planet;
    } catch (error: any) {
      console.error("Error spawning planet:", error);
      toast.error(error.message || "Failed to spawn planet");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update star system on blockchain
  const updateStarSystemOnBlockchain = useCallback(async (
    contractAddress: string,
    updates: { status?: "active" | "inactive"; tributePercent?: number }
  ) => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const contract = getStarSystemContract(contractAddress, signer);
      const txPromises: Promise<ethers.ContractTransactionResponse>[] = [];

      // Update status if needed
      if (updates.status === "active") {
        txPromises.push(contract.activate());
      } else if (updates.status === "inactive") {
        txPromises.push(contract.deactivate());
      }

      // Update tribute percent if needed
      if (updates.tributePercent !== undefined) {
        txPromises.push(contract.setTributePercent(updates.tributePercent));
      }

      if (txPromises.length > 0) {
        const txs = await Promise.all(txPromises);
        await Promise.all(txs.map(tx => tx.wait()));
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Error updating star system on blockchain:", error);
      throw error;
    }
  }, [signer]);

  // Interaction functions
  const updateStarSystemStatus = async (systemId: string, status: "active" | "deploying" | "inactive") => {
    setLoading(true);
    try {
      // Find the system
      const system = starSystems.find(s => s.id === systemId);
      const contractAddress = system?.contract_address || (system as any)?.metadata?.contract_address;

      // If we have a contract address, update on blockchain
      if (contractAddress && signer && (status === "active" || status === "inactive")) {
        try {
          await updateStarSystemOnBlockchain(contractAddress, { status });
          toast.success(`Star system status updated on blockchain to ${status}`);
        } catch (blockchainError: any) {
          console.error("Blockchain update failed, falling back to Supabase:", blockchainError);
          // Fall back to Supabase update
          await supabaseService.updateStarSystem(systemId, { status });
          toast.success(`Star system status updated to ${status} (via Supabase)`);
        }
      } else {
        // No contract address or deploying status - use Supabase
        await supabaseService.updateStarSystem(systemId, { status });
        toast.success(`Star system status updated to ${status}`);
      }

      await fetchStarSystems();
    } catch (error: any) {
      console.error("Error updating star system status:", error);
      toast.error(error.message || "Failed to update star system status");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePlanetStatus = async (planetId: string, status: "active" | "deploying" | "inactive") => {
    setLoading(true);
    try {
      await supabaseService.updatePlanet(planetId, { status });
      toast.success(`Planet status updated to ${status}`);
      await fetchStarSystems();
    } catch (error: any) {
      console.error("Error updating planet status:", error);
      toast.error(error.message || "Failed to update planet status");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deployStarSystem = async (systemId: string) => {
    setLoading(true);
    try {
      await supabaseService.updateStarSystem(systemId, { status: "deploying" });
      toast.success("Star system deployment initiated");
      await fetchStarSystems();
      return { success: true, message: "Deployment initiated" };
    } catch (error: any) {
      console.error("Error deploying star system:", error);
      toast.error(error.message || "Failed to deploy star system");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStarSystemDetails = async (systemId: string) => {
    try {
      const system = await supabaseService.getStarSystemById(systemId);
      if (!system) {
        throw new Error("Star system not found");
      }
      return {
        success: true,
        star_system: {
          id: system.id,
          name: system.name,
          subnet_id: system.subnet_id,
          owner_wallet: system.owner_wallet,
          treasury_balance: system.treasury_balance || {},
          planets: system.planets || [],
          created_at: system.created_at,
          rpc_url: system.rpc_url,
          chain_id: system.chain_id,
          status: system.status,
          tribute_percent: system.tribute_percent,
        },
      };
    } catch (error: any) {
      console.error("Error getting star system details:", error);
      throw error;
    }
  };

  const getPlanetDetails = async (planetId: string) => {
    try {
      const planet = await supabaseService.getPlanetById(planetId);
      if (!planet) {
        throw new Error("Planet not found");
      }
      return {
        success: true,
        planet: {
          id: planet.id,
          name: planet.name,
          star_system_id: planet.star_system_id,
          owner_wallet: planet.owner_wallet,
          planet_type: planet.planet_type,
          node_type: planet.node_type,
          ip_address: planet.ip_address,
          status: planet.status,
          created_at: planet.created_at,
        },
      };
    } catch (error: any) {
      console.error("Error getting planet details:", error);
      throw error;
    }
  };

  // Update star system tribute percent on blockchain
  const updateStarSystemTributePercent = async (systemId: string, tributePercent: number) => {
    setLoading(true);
    try {
      const system = starSystems.find(s => s.id === systemId);
      const contractAddress = system?.contract_address || (system as any)?.metadata?.contract_address;

      if (contractAddress && signer) {
        try {
          await updateStarSystemOnBlockchain(contractAddress, { tributePercent });
          toast.success(`Tribute percent updated on blockchain to ${tributePercent}%`);
        } catch (blockchainError: any) {
          console.error("Blockchain update failed:", blockchainError);
          throw blockchainError;
        }
      } else {
        throw new Error("Contract address not found. Cannot update on blockchain.");
      }

      await fetchStarSystems();
    } catch (error: any) {
      console.error("Error updating tribute percent:", error);
      toast.error(error.message || "Failed to update tribute percent");
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
    updateStarSystemStatus,
    updateStarSystemTributePercent,
    updatePlanetStatus,
    deployStarSystem,
    getStarSystemDetails,
    getPlanetDetails,
  };
}
