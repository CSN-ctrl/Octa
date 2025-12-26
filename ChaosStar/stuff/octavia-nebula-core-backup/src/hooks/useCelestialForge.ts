import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import {
  spawnStarSystem as apiSpawnStarSystem,
  spawnPlanet as apiSpawnPlanet,
  getForgeToolsStatus,
  listStarSystems as apiListStarSystems,
  getStarSystem as apiGetStarSystem,
  listPlanets as apiListPlanets,
  getPlanet as apiGetPlanet,
  updateStarSystemStatus as apiUpdateStarSystemStatus,
  updatePlanetStatus as apiUpdatePlanetStatus,
  deployStarSystem as apiDeployStarSystem,
} from "@/lib/api";
import { getStarSystemContract, getPlanetContract, STAR_SYSTEM_ABI, PLANET_ABI } from "@/lib/contracts";
import { getRpcProvider } from "@/lib/wallet";

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

  // Query blockchain directly to find all StarSystem contracts using Avalanche CLI
  const discoverStarSystemsFromBlockchain = useCallback(async (): Promise<StarSystem[]> => {
    // Since contracts are natively integrated into the VM, we use the backend API instead
    // of trying to discover from blockchain contracts directly
    try {
      const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
      const response = await fetch(`${base}/api/celestial-forge/star-systems`, {
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data = await response.json();
        const systems = (data.star_systems || data || []) as StarSystem[];
        return systems;
      }
    } catch (error) {
      console.debug("Could not fetch star systems from backend API:", error);
    }
    
    // Return empty array if backend API is not available
    return [];

    try {
      // Method 1: Query backend API to get subnets (which are star systems) via Avalanche CLI
      const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
      
      // Get list of subnets from backend API (VM-based)
      const subnetsResponse = await fetch(`${base}/api/avalanche-info/subnets`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!subnetsResponse.ok) {
        console.debug("Failed to get subnets list from Avalanche CLI");
        return [];
      }
      
      const subnetsData = await subnetsResponse.json();
      // Handle both old format (subnets array) and new format (success + subnets)
      const subnets = subnetsData.subnets || [];
      if (!Array.isArray(subnets) || subnets.length === 0) {
        console.debug("No subnets found or invalid response");
        return [];
      }
      
      const discoveredSystems: StarSystem[] = [];
      
      // For each subnet, try to find StarSystem contracts
      for (const subnet of subnets) {
        const subnetName = subnet.name || subnet.subnet_name;
        if (!subnetName) continue;
        
        let starSystemAddress: string | null = null;
        let blockchainData: Partial<StarSystem> | null = null;
        
        try {
          // Get contracts for this subnet (star system)
          const contractsResponse = await fetch(`${base}/api/celestial-forge/star-systems/${subnetName}/contracts`, {
            signal: AbortSignal.timeout(5000),
          });
          
          if (contractsResponse.ok) {
            const contractsData = await contractsResponse.json();
            
            // Look for StarSystem contract in the contracts list
            starSystemAddress = contractsData.addresses?.StarSystem || 
                               contractsData.addresses?.starSystem ||
                               (contractsData.deployment_status?.StarSystem?.address) ||
                               null;
            
            if (starSystemAddress) {
              // Fetch the actual contract data from blockchain
              blockchainData = await fetchStarSystemFromBlockchain(starSystemAddress, subnetName);
            }
          }
        } catch (error) {
          console.debug(`Failed to get contracts for subnet ${subnetName}:`, error);
          // Continue to add subnet even if contract fetch fails
        }
        
        // Add the subnet as a star system (with or without contract data)
        if (blockchainData) {
          discoveredSystems.push({
            id: subnetName,
            name: blockchainData.name || subnetName,
            subnet_id: blockchainData.subnet_id || subnet.subnet_id || subnet.blockchain_id || null,
            owner_wallet: blockchainData.owner_wallet || "",
            treasury_balance: {},
            planets: blockchainData.planets || [],
            created_at: new Date().toISOString(),
            rpc_url: blockchainData.rpc_url || subnet.rpc_url || null,
            chain_id: blockchainData.chain_id || subnet.chain_id || null,
            status: blockchainData.status || (blockchainData.active ? "active" : "inactive"),
            contract_address: starSystemAddress,
            tribute_percent: blockchainData.tribute_percent || null,
            native_balance: blockchainData.native_balance || null,
            active: blockchainData.active || false,
          } as StarSystem);
        } else {
          // If no StarSystem contract found, still add the subnet as a star system
          // (it might be in the process of being set up)
          discoveredSystems.push({
            id: subnetName,
            name: subnetName,
            subnet_id: subnet.subnet_id || subnet.blockchain_id || null,
            owner_wallet: "",
            treasury_balance: {},
            planets: [],
            created_at: new Date().toISOString(),
            rpc_url: subnet.rpc_url || null,
            chain_id: subnet.chain_id || null,
            status: subnet.status || "deploying",
            contract_address: starSystemAddress,
            tribute_percent: null,
            native_balance: null,
            active: false,
          } as StarSystem);
        }
      }
      
      // Always include Sarakt Star System (ChaosStarNetwork)
      const saraktSystemName = "ChaosStarNetwork";
      const hasSarakt = discoveredSystems.some(s => 
        s.id === "sarakt-star-system" || 
        s.name === "Sarakt Star System" || 
        s.subnet_id === saraktSystemName ||
        s.id === saraktSystemName
      );

      if (!hasSarakt) {
        // Get Sarakt Star System info from backend API or create default
        try {
          const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
          const saraktResponse = await fetch(`${base}/api/celestial-forge/star-systems/sarakt-star-system`, {
            signal: AbortSignal.timeout(5000),
          });

          if (saraktResponse.ok) {
            const saraktData = await saraktResponse.json();
            if (saraktData.success && saraktData.star_system) {
              const sarakt = saraktData.star_system;
              discoveredSystems.unshift({
                id: sarakt.id || "sarakt-star-system",
                name: sarakt.name || "Sarakt Star System",
                subnet_id: sarakt.subnet_id || saraktSystemName,
                owner_wallet: sarakt.owner_wallet || "",
                treasury_balance: sarakt.treasury_balance || {},
                planets: sarakt.planets || [],
                created_at: sarakt.created_at || new Date().toISOString(),
                rpc_url: sarakt.rpc_url || null,
                chain_id: sarakt.chain_id || null,
                status: sarakt.status || "active",
                contract_address: null,
                tribute_percent: 0, // Sarakt Star System doesn't pay tribute (it's the primary system)
                native_balance: null,
                active: sarakt.status === "active",
              } as StarSystem);
            }
          } else {
            // Create default Sarakt Star System if API fails
            discoveredSystems.unshift({
              id: "sarakt-star-system",
              name: "Sarakt Star System",
              subnet_id: saraktSystemName,
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
          } as StarSystem);
          }
        } catch (error) {
          console.debug("Failed to fetch Sarakt Star System from API, using default:", error);
          // Create default Sarakt Star System
          discoveredSystems.unshift({
            id: "sarakt-star-system",
            name: "Sarakt Star System",
            subnet_id: saraktSystemName,
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
          } as StarSystem);
        }
      }

      return discoveredSystems;
    } catch (error) {
      console.error("Error discovering star systems from blockchain:", error);
      // Even on error, return Sarakt Star System as fallback
      return [{
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
          } as StarSystem];
    }
  }, [fetchStarSystemFromBlockchain]);

  // Get Sarakt Star System (always available)
  const getSaraktStarSystem = useCallback(async (): Promise<StarSystem> => {
    try {
      const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
      const saraktResponse = await fetch(`${base}/api/celestial-forge/star-systems/sarakt-star-system`, {
        signal: AbortSignal.timeout(5000),
      });

      if (saraktResponse.ok) {
        const saraktData = await saraktResponse.json();
        if (saraktData.success && saraktData.star_system) {
          const sarakt = saraktData.star_system;
          return {
            id: sarakt.id || "sarakt-star-system",
            name: sarakt.name || "Sarakt Star System",
            subnet_id: sarakt.subnet_id || "ChaosStarNetwork",
            owner_wallet: sarakt.owner_wallet || "",
            treasury_balance: sarakt.treasury_balance || {},
            planets: sarakt.planets || ["sarakt-prime", "zythera"],
            created_at: sarakt.created_at || new Date().toISOString(),
            rpc_url: sarakt.rpc_url || null,
            chain_id: sarakt.chain_id || null,
            status: sarakt.status || "active",
            contract_address: null,
            tribute_percent: 0, // Sarakt Star System doesn't pay tribute (it's the primary system)
            native_balance: null,
            active: sarakt.status === "active" || true,
          } as StarSystem;
        }
      }
    } catch (error) {
      console.debug("Failed to fetch Sarakt Star System from API, using default:", error);
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

      // If we only have Sarakt, try backend API as additional fallback
      if (allSystems.length === 1) {
        try {
          const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
          const response = await fetch(`${base}/api/celestial-forge/star-systems`, {
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            const data = await response.json();
            const systems = (data.star_systems || data || []) as StarSystem[];
            
            // Add systems from backend (excluding Sarakt)
            for (const system of systems) {
              const isSarakt = system.id === "sarakt-star-system" || 
                              system.name === "Sarakt Star System";
              if (!isSarakt) {
                // Try to enhance with blockchain data if contract address exists
                const contractAddress = (system as any).contract_address || 
                                      (system as any).metadata?.contract_address;
                
                if (contractAddress) {
                  try {
                    const blockchainData = await fetchStarSystemFromBlockchain(contractAddress, system.id);
                    if (blockchainData) {
                      allSystems.push({
                        ...system,
                        ...blockchainData,
                        id: system.id,
                        created_at: system.created_at,
                      } as StarSystem);
                      continue;
                    }
                  } catch (error) {
                    console.debug(`Failed to fetch blockchain data for system ${system.id}:`, error);
                  }
                }
                
                allSystems.push(system);
              }
            }
          }
        } catch (error) {
          console.debug("Backend API fetch failed:", error);
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

      // Check for duplicate names via backend API
      const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
      try {
        const checkResponse = await fetch(`${base}/api/celestial-forge/star-systems`, {
          signal: AbortSignal.timeout(5000),
        });
        if (checkResponse.ok) {
          const data = await checkResponse.json();
          const systems = (data.star_systems || data || []) as StarSystem[];
          const existingSystem = systems.find((s: StarSystem) => s.name === name);
      if (existingSystem) {
        throw new Error('Star system name already exists');
          }
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

      toast.info("Creating star system with Avalanche CLI...");

      // Call backend API to create subnet using Avalanche CLI (real mode)
      let apiResult;
      try {
        apiResult = await apiSpawnStarSystem({
          name,
          owner_wallet: address,
          tribute_percent: tributePercent,
          mock: false, // Use real Avalanche CLI to create actual subnets
        });
      } catch (error: any) {
        // Network error - backend might not be running
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(
            "Backend API is not reachable. Please start the backend server:\n" +
            "cd backend && uvicorn app:app --reload\n\n" +
            "Then ensure it's running on http://localhost:5001"
          );
        }
        throw error;
      }

      if (!apiResult.success) {
        throw new Error(apiResult.error || "Failed to create star system");
      }

      const starSystemData = apiResult.star_system;

      // Star system is already created in backend via API call
      // No need to store in Supabase - backend handles persistence

      toast.success(
        `Star system "${name}" creation initiated! ${apiResult.message || ''}`
      );

      // Show next steps if available
      if (apiResult.next_steps && apiResult.next_steps.length > 0) {
        toast.info(`Next: ${apiResult.next_steps[0]}`);
      }

      await fetchStarSystems();
      return starSystemData;
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

      // Check for duplicate planet names via backend API
      const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5001";
      try {
        const checkResponse = await fetch(`${base}/api/celestial-forge/planets`, {
          signal: AbortSignal.timeout(5000),
        });
        if (checkResponse.ok) {
          const data = await checkResponse.json();
          const planets = (data.planets || data || []) as Planet[];
          const existingPlanet = planets.find(
            (p: Planet) => p.star_system_id === starSystemId && p.name === planetName
          );
      if (existingPlanet) {
        throw new Error('Planet name already exists in this star system');
          }
        }
      } catch (error: any) {
        // If check fails, continue (might be network issue)
        if (!error.message?.includes('already exists')) {
          console.debug("Could not check for duplicate planet names:", error);
        } else {
          throw error;
        }
      }

      // Balance check removed - allowing mock planet creation

      toast.info("Creating planet with Avalanche CLI...");

      // Call backend API to create planet/validator node (real mode)
      let apiResult;
      try {
        apiResult = await apiSpawnPlanet({
          name: planetName,
          star_system_id: starSystemId,
          star_system_name: starSystem.name,
          owner_wallet: address,
          planet_type: planetType,
          mock: false, // Use real Avalanche CLI to create actual nodes
        });
      } catch (error: any) {
        // Network error - backend might not be running
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(
            "Backend API is not reachable. Please start the backend server:\n" +
            "cd backend && uvicorn app:app --reload\n\n" +
            "Then ensure it's running on http://localhost:5001"
          );
        }
        throw error;
      }

      if (!apiResult.success) {
        throw new Error(apiResult.error || "Failed to create planet");
      }

      const planetData = apiResult.planet;

      // Planet is already created in backend via API call
      // No need to store in Supabase - backend handles persistence

      // Show next steps if available
      if (apiResult.next_steps && apiResult.next_steps.length > 0) {
        toast.info(`Next: ${apiResult.next_steps[0]}`);
      }

      toast.success(`Planet "${planetName}" created successfully!`);
      await fetchStarSystems();
      return planetData;
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
          console.error("Blockchain update failed, falling back to API:", blockchainError);
          // Fall back to API update
          await apiUpdateStarSystemStatus(systemId, status);
          toast.success(`Star system status updated to ${status} (via API)`);
        }
      } else {
        // No contract address or deploying status - use API
        await apiUpdateStarSystemStatus(systemId, status);
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
      await apiUpdatePlanetStatus(planetId, status);
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
      const result = await apiDeployStarSystem(systemId);
      toast.success(result.message || "Star system deployment initiated");
      await fetchStarSystems();
      return result;
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
      const result = await apiGetStarSystem(systemId);
      return result;
    } catch (error: any) {
      console.error("Error getting star system details:", error);
      throw error;
    }
  };

  const getPlanetDetails = async (planetId: string) => {
    try {
      const result = await apiGetPlanet(planetId);
      return result;
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
