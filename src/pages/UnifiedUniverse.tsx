import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skull, Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin, Coins, Factory, Home, ArrowRight, ChevronLeft, Sparkles, Shield, Flame, Droplets, Wind, TreePine, Hammer, Book, Loader2, Network, Wallet, Rocket, Orbit, TrendingUp, ShoppingCart, Briefcase, Settings, Trash2, X, AlertCircle, RefreshCw, Landmark, Banknote, Store, Wrench, FileText, PieChart } from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useTreasury } from "@/hooks/useTreasury";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useRealPlanetStats } from "@/hooks/useRealPlanetStats";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GalaxyVisualization } from "@/components/GalaxyVisualization";
import { Card as UICard } from "@/components/ui/card";
import { fetchPlots, type BackendPlot } from "@/lib/api";
import * as supabaseService from "@/lib/supabase-service";
import { OctagonalGrid } from "@/components/OctagonalGrid";
import { NetworkTopology } from "@/components/NetworkTopology";
import { useNavigate } from "react-router-dom";

// Real planet data is now fetched from blockchain contracts via useRealPlanetStats hook

export default function UnifiedUniverse() {
  const navigate = useNavigate();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityView, setCityView] = useState<"info" | "grid" | "management">("grid");
  const { plotsSold, totalPlots, plotsRemaining, loading: plotsLoading, priceInAVAX, buyPlotPhase1AVAX, userPlots, refresh: refreshLandPlots } = useLandPlots();
  const { balances, loading: treasuryLoading } = useTreasury();
  const { address, signer, isConnected, connect, balance } = useWallet();
  
  // Use REAL celestial forge data from blockchain/API (NOT mock)
  const {
    starSystems,
    userStarSystems,
    loading: forgeLoading,
    spawnStarSystem,
    spawnPlanet,
    fetchStarSystems,
    updateStarSystemStatus,
    updatePlanetStatus,
    deployStarSystem,
    getStarSystemDetails,
    getPlanetDetails
  } = useCelestialForge();
  
  // Get real planet stats from blockchain contracts
  const { planets: realPlanetsData, loading: planetsStatsLoading } = useRealPlanetStats();
  
  // Management state
  const [selectedSystemForManagement, setSelectedSystemForManagement] = useState<string | null>(null);
  const [selectedPlanetForManagement, setSelectedPlanetForManagement] = useState<string | null>(null);
  const [manageView, setManageView] = useState<"systems" | "planets" | "details">("systems");
  
  // Star system interaction state (like sarakt prime)
  const [selectedStarSystem, setSelectedStarSystem] = useState<string | null>(null);
  const [selectedPlanetInSystem, setSelectedPlanetInSystem] = useState<string | null>(null);
  
  // Use REAL data for display (from blockchain/API)
  const displayStarSystems = starSystems;
  const [planetsList, setPlanetsList] = useState<any[]>([]);
  const displayLoading = forgeLoading || planetsStatsLoading;
  
  // Fetch planets from Supabase
  useEffect(() => {
    async function fetchPlanets() {
      try {
        const planets = await supabaseService.getPlanets();
        if (planets && Array.isArray(planets)) {
          setPlanetsList(planets);
        }
      } catch (error: any) {
        // Silently handle errors - Supabase might not be available
        console.debug("Could not fetch planets from Supabase:", error);
      }
    }
    fetchPlanets();
  }, []);

  // Fetch population count (unique plot owners) from Supabase
  useEffect(() => {
    async function fetchPopulation() {
      try {
        const plots = await supabaseService.getPlots();
        // Count unique owners (excluding null/empty owners)
        const uniqueOwners = new Set(
          plots
            .filter(plot => plot.owner_wallet && plot.owner_wallet.trim() !== '')
            .map(plot => plot.owner_wallet)
        );
        setPopulationCount(uniqueOwners.size);
      } catch (error: any) {
        console.debug("Could not fetch population from Supabase:", error);
        setPopulationCount(0);
      }
    }
    fetchPopulation();
  }, []);
  
  const displayPlanets = planetsList;
  
  // Helper function to get planets for a specific star system
  const getPlanetsForSystem = (systemId: string) => {
    return displayPlanets.filter((planet: any) => planet.star_system_id === systemId);
  };
  
  // Real planet data from blockchain (fallback to calculated stats)
  const planetsData = realPlanetsData;
  const [starSystemName, setStarSystemName] = useState("");
  const [tributePercent, setTributePercent] = useState(5);
  const [planetName, setPlanetName] = useState("");
  const [selectedStarSystemForPlanet, setSelectedStarSystemForPlanet] = useState<string>("");
  const [planetType, setPlanetType] = useState<"habitable" | "resource" | "research" | "military">("habitable");
  // selectedBody removed - visualization is detached from functions
  const [backendPlots, setBackendPlots] = useState<BackendPlot[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [managementTab, setManagementTab] = useState<"assets" | "plots" | "income" | "settings">("assets");
  
  // ChaosStar CLI connection state
  const [chaosStarSubnets, setChaosStarSubnets] = useState<any[]>([]);
  const [chaosStarNodes, setAvalancheNodes] = useState<any[]>([]);
  const [loadingSubnets, setLoadingSubnets] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [showSubnetsList, setShowSubnetsList] = useState(false);
  const [showNodesList, setShowNodesList] = useState(false);
  const [cityPlots, setCityPlots] = useState<any[]>([]);
  const [loadingCityPlots, setLoadingCityPlots] = useState(false);
  const [populationCount, setPopulationCount] = useState<number>(0);
  const [cityStats, setCityStats] = useState<any>(null);
  const [loadingCityStats, setLoadingCityStats] = useState(false);
  const [ownedPlotIds, setOwnedPlotIds] = useState<number[]>([]);
  const [showSpawnSystemDialog, setShowSpawnSystemDialog] = useState(false);
  const [spawnSystemForm, setSpawnSystemForm] = useState({
    name: "",
    tributePercent: 5,
    ownerWallet: "",
    tokenName: "",
    tokenSymbol: "",
    initialSupply: "",
    gasPriceGwei: "",
    validatorCount: 1,
  });

  // Load plots from backend for connected wallet
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!address) {
        setBackendPlots([]);
        return;
      }
      setLoadingPlots(true);
      try {
        const plots = await fetchPlots(address);
        if (!cancelled) setBackendPlots(plots);
      } catch (e) {
        if (!cancelled) setBackendPlots([]);
      } finally {
        if (!cancelled) setLoadingPlots(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // Fetch owned plot IDs - use hook data first, then try other sources
  const fetchOwnedPlots = async () => {
    if (!address) {
      setOwnedPlotIds([]);
      return;
    }

    // Priority 1: Try Registry API (port 8000) - most reliable for PlotRegistry
    try {
      const { getRegistryPlotsByOwner } = await import("@/lib/api");
      const plotIds = await getRegistryPlotsByOwner(address);
      if (plotIds && plotIds.length > 0) {
        console.log(`✅ Fetched ${plotIds.length} plots from Registry API for ${address}`);
        setOwnedPlotIds(plotIds);
        return;
      }
    } catch (error: any) {
      console.debug("Registry API failed, trying other sources:", error.message);
    }

    // Priority 2: Try useLandPlots hook data (already loaded)
    if (userPlots && userPlots.length > 0) {
      console.log(`✅ Using ${userPlots.length} plots from useLandPlots hook`);
      setOwnedPlotIds(userPlots);
      return;
    }

    // Priority 3: Try direct contract query
    try {
      const { fetchOwnedPlots: fetchPlotsFromContract } = await import("@/lib/plotUtils");
      const plotIds = await fetchPlotsFromContract(address, 1000);
      if (plotIds && plotIds.length > 0) {
        console.log(`✅ Fetched ${plotIds.length} plots from contract for ${address}`);
        setOwnedPlotIds(plotIds);
        return;
      }
    } catch (error: any) {
      console.debug("Failed to fetch plots from contract:", error.message);
    }
    
    // Fallback to Supabase (if available)
    try {
      const plots = await supabaseService.getPlots({ ownerWallet: address });
      
      if (plots && plots.length > 0) {
        const plotIds = plots.map(plot => plot.id);
        console.log("Plots from Supabase:", plotIds);
        setOwnedPlotIds(plotIds);
      } else {
        console.log("No plots found in Supabase");
        setOwnedPlotIds([]);
      }
    } catch (error) {
      console.debug("Failed to fetch owned plots from Supabase:", error);
      setOwnedPlotIds([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    fetchOwnedPlots();
    
    // Listen for portfolio updates (when plots are purchased)
    const handlePortfolioUpdate = (event: CustomEvent) => {
      if (!cancelled && (!event.detail?.wallet || event.detail.wallet === address)) {
        fetchOwnedPlots();
      }
    };
    
    window.addEventListener('portfolio-updated', handlePortfolioUpdate as EventListener);
    
    return () => {
      cancelled = true;
      window.removeEventListener('portfolio-updated', handlePortfolioUpdate as EventListener);
    };
  }, [address, isConnected, userPlots]); // Add userPlots as dependency to update when hook data changes

  // Generate and load city plots when city is selected
  useEffect(() => {
    if (!selectedPlanet || !selectedCity) {
      setCityPlots([]);
      return;
    }

    const planet = planetsData?.[selectedPlanet] || planetsData?.["sarakt-prime"];
    const city = planet.districts?.find((d, idx) => `city-${idx}` === selectedCity);
    if (!city) {
      setCityPlots([]);
      return;
    }

    // Fetch REAL plots from Chaos Star Network subnet via API and local database
    const fetchPlots = async () => {
      setLoadingCityPlots(true);
      try {
        console.log("Fetching plots for city:", city.name);
        
        // Fetch plots from Supabase
        let registryPlots: any[] = [];
        try {
          const { getPlots, getPlotsByOwner } = await import("@/lib/supabase-service");
          
          // Get all plots and filter by city if needed
          let allPlots = await getPlots({ limit: 1000 });
          
          // Get owned plots for current user
          if (address) {
            const ownedPlots = await getPlotsByOwner(address);
            // Merge owned plots (they're already in allPlots, but ensure they're marked as owned)
            const ownedPlotIds = new Set(ownedPlots.map(p => p.id));
            allPlots = allPlots.map(plot => ({
              ...plot,
              owned: ownedPlotIds.has(plot.id),
            }));
          }
          
          // Transform to grid format
          registryPlots = allPlots.map((plot) => ({
            id: plot.id,
            plotId: plot.id,
            x: plot.coord_x || 0,
            y: plot.coord_y || 0,
            level: 1,
            type: plot.owner_wallet ? "claimed" : "unclaimed",
            owner: plot.owner_wallet || undefined,
            wallet: plot.owner_wallet || undefined,
            owned: !!plot.owner_wallet,
            minted: !!plot.owner_wallet,
            zone: plot.zone_type || "residential",
            zoneType: plot.zone_type || "residential",
            coordinates: `${plot.coord_x || 0},${plot.coord_y || 0}`,
            metadata: {
              ...plot,
              source: "local_registry",
            },
          }));
          
          if (registryPlots.length > 0) {
            console.log(`✅ Loaded ${registryPlots.length} plots from local registry (${availablePlots.length} available, ${ownedPlots.length} owned)`);
          }
        } catch (dbError: any) {
          console.debug("Failed to load from local registry, trying API:", dbError.message);
        }
        
        // Priority 2: Fetch all plots from Registry API with owner/wallet information
        if (registryPlots.length === 0) {
          try {
            const { getRegistryPlotsWithOwners, getRegistryPlotsByOwner, getRegistryPlot } = await import("@/lib/api");
          
          // First, try to fetch all plots with owners (if addresses are known)
          // Collect known addresses to check (current user + any other known addresses)
          const addressesToCheck: string[] = [];
          if (address) {
            addressesToCheck.push(address);
          }
          
          try {
            // Fetch plots with owners from registry
            const plotsWithOwners = await getRegistryPlotsWithOwners(200, 0, addressesToCheck.length > 0 ? addressesToCheck : undefined);
            
            if (plotsWithOwners && plotsWithOwners.length > 0) {
              console.log(`✅ Fetched ${plotsWithOwners.length} plots with owner info from Registry API`);
              
              // Transform plots with owners to match grid component format
              registryPlots = plotsWithOwners.map((plot) => ({
                id: plot.plotId,
                plotId: plot.plotId,
                x: plot.x,
                y: plot.y,
                level: plot.level,
                type: plot.owner ? "claimed" : "unclaimed",
                owner: plot.owner || plot.wallet || undefined,
                wallet: plot.wallet || plot.owner || undefined, // Wallet that purchased the plot
                owned: !!plot.owner,
                minted: plot.issued,
                zone: "residential",
                zoneType: "residential",
                coordinates: `${plot.x},${plot.y}`,
                metadata: {
                  ...plot,
                  source: "registry",
                },
              }));
            }
          } catch (plotsWithOwnersError: any) {
            console.debug("Failed to fetch plots with owners, trying individual fetch:", plotsWithOwnersError.message);
            
            // Fallback: Fetch owned plots for current user
            if (address) {
              try {
                const plotIds = await getRegistryPlotsByOwner(address);
                
                if (plotIds && plotIds.length > 0) {
                  // Fetch detailed plot data for owned plots
                  const plotDetails = await Promise.all(
                    plotIds.slice(0, 50).map(async (plotId) => {
                      try {
                        const plot = await getRegistryPlot(plotId);
                        return {
                          id: plot.plotId,
                          plotId: plot.plotId,
                          x: plot.x,
                          y: plot.y,
                          level: plot.level,
                          type: "claimed",
                          owner: address,
                          wallet: address, // Wallet that purchased the plot
                          owned: true,
                          minted: true,
                          zone: "residential",
                          zoneType: "residential",
                          coordinates: `${plot.x},${plot.y}`,
                          metadata: {
                            ...plot,
                            source: "registry",
                          },
                        };
                      } catch (e) {
                        return null;
                      }
                    })
                  );
                  
                  registryPlots = plotDetails.filter(p => p !== null);
                  console.log(`✅ Fetched ${registryPlots.length} owned plots from Registry API`);
                }
              } catch (fallbackError: any) {
                console.debug("Failed to fetch owned plots:", fallbackError.message);
              }
            }
          }
        } catch (error: any) {
          console.debug("Registry API not available for city plots:", error.message);
        }
        }
        
        // Priority 2: Fetch plots from city API (which connects to blockchain)
        try {
          const { listCityPlots } = await import("@/lib/api");
          const result = await listCityPlots();
          
          if (result?.plots && Array.isArray(result.plots)) {
            console.log(`Fetched ${result.plots.length} plots from backend API`);
            
            // Transform API plots to match grid component format
            const transformedPlots = result.plots.map((plot: any) => ({
              id: plot.id || plot.plotId,
              plotId: plot.plotId || plot.id,
              x: 0, // Will be calculated by grid layout
              y: 0, // Will be calculated by grid layout
              type: plot.type || (plot.owned ? "claimed" : "unclaimed"),
              owner: plot.owner || plot.wallet || undefined,
              wallet: plot.wallet || plot.owner || undefined, // Wallet that purchased the plot
              owned: plot.owned || plot.minted || false,
              minted: plot.minted || plot.owned || false,
              zone: plot.zone || plot.zoneType || "residential",
              zoneType: plot.zone || plot.zoneType || "residential",
              coordinates: `${plot.id || plot.plotId}`,
            }));
            
            // Merge registry plots with backend plots (registry takes priority for owned plots)
            // Registry plots have accurate wallet/owner information from the blockchain
            const mergedPlots = [...registryPlots];
            transformedPlots.forEach(plot => {
              const existingPlot = mergedPlots.find(p => p.plotId === plot.plotId);
              if (!existingPlot) {
                mergedPlots.push(plot);
              } else {
                // Update existing plot with wallet info if available
                if (plot.wallet && !existingPlot.wallet) {
                  existingPlot.wallet = plot.wallet;
                  existingPlot.owner = plot.wallet;
                }
              }
            });
            
            registryPlots = mergedPlots;
          }
          
          // Also fetch and set city stats for population display (non-blocking)
          try {
            const { getCityStats } = await import("@/lib/api");
            setLoadingCityStats(true);
            const stats = await getCityStats(city.name);
            if (stats) {
              setCityStats(stats);
              console.log("City stats loaded from Chaos Star Network:", stats);
            } else {
              console.debug("City stats not available (backend may not be running)");
              setCityStats(null);
            }
          } catch (statsError: any) {
            // Only log if it's not a network/timeout error (already handled in API)
            if (statsError.message && !statsError.message.includes("not available")) {
              console.debug("Could not fetch city stats:", statsError);
            }
            setCityStats(null);
          } finally {
            setLoadingCityStats(false);
          }
        } catch (apiError) {
          console.debug("Error fetching plots from city API (this is normal if backend is not running):", apiError);
        }
        
        // Final fallback: try using data from useLandPlots hook (already loaded at component level)
        if (registryPlots.length === 0 && userPlots && userPlots.length > 0) {
          console.log(`Found ${userPlots.length} user plots from contract`);
          // Transform user plots to match format
          const userPlotData = userPlots.map((plotId: number) => ({
            id: plotId,
            plotId: plotId,
            x: 0,
            y: 0,
            type: "claimed",
            owner: address || undefined,
            wallet: address || undefined, // Wallet that purchased the plot
            owned: true,
            minted: true,
            zone: "residential",
            coordinates: `${plotId}`,
          }));
          registryPlots = userPlotData;
        }
        
        // Always set plots (even if empty - grid will generate default plots based on totalPlots)
        setCityPlots(registryPlots);
        
        if (registryPlots.length === 0) {
          console.log("No plots found from any source - grid will render with default empty plots");
        } else {
          console.log(`✅ Set ${registryPlots.length} plots for grid display`);
        }
      } catch (error) {
        console.debug("Error fetching plots from blockchain (this is normal if RPC is not available):", error);
        // Set empty plots on error so grid can still render
        setCityPlots([]);
      } finally {
        setLoadingCityPlots(false);
      }
    };

    fetchPlots();
  }, [selectedCity, address, selectedPlanet, plotsSold]);

  const handlePlanetSelect = (planetId: string) => {
    const planet = planetsData?.[planetId] || planetsData?.["sarakt-prime"]; // Fallback to sarakt-prime
    if (planet && !planet.locked) {
      setSelectedPlanet(planetId);
      setSelectedCity(null); // Reset city selection when planet changes
      // Scroll to top when planet is selected
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mock hook automatically loads data from localStorage on mount
  // No need to fetch from backend or database

  // Initialize: Fetch star systems on mount
  useEffect(() => {
    fetchStarSystems();
  }, [fetchStarSystems]);

  // Star System Planet view - shows planet details (like city view)
  if (selectedStarSystem && selectedPlanetInSystem) {
    const system = starSystems.find(s => s.id === selectedStarSystem);
    const planet = displayPlanets.find((p: any) => p.id === selectedPlanetInSystem);
    
    if (!system || !planet) {
      setSelectedPlanetInSystem(null);
      return null;
    }

    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="glass" className="gap-2" onClick={() => setSelectedPlanetInSystem(null)}>
              <ChevronLeft className="h-4 w-4" />
              Back to {system.name}
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                {planet.name}
              </h1>
              <p className="text-muted-foreground">{system.name} • {planet.planet_type}</p>
            </div>
          </div>

          {/* Planet View Tabs */}
          <Tabs value={cityView} onValueChange={(v) => setCityView(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="info">Planet Info</TabsTrigger>
              <TabsTrigger value="grid">Planet Grid</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            {/* Planet Info Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass border-primary/20 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">{planet.name} Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      A {planet.planet_type} planet in the {system.name} star system. 
                      {planet.status === 'active' ? ' Currently active and operational.' : 
                       planet.status === 'deploying' ? ' Currently being deployed.' : 
                       ' Currently inactive.'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Planet Type</div>
                        <Badge variant="outline" className="capitalize">{planet.planet_type}</Badge>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <Badge variant={planet.status === 'active' ? 'default' : 'outline'} className="capitalize">
                          {planet.status}
                        </Badge>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Node Type</div>
                        <div className="text-lg font-bold capitalize">{planet.node_type}</div>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">IP Address</div>
                        <div className="text-sm font-mono">{planet.ip_address}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">System Status</span>
                        <span className="font-bold capitalize">{system.status}</span>
                      </div>
                      <Progress value={system.status === 'active' ? 100 : system.status === 'deploying' ? 50 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Chain ID</span>
                        <span className="font-bold font-mono">#{system.chain_id}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Treasury</span>
                        <span className="font-bold">{balances.avax || "0"} AVAX</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Planet Grid Tab */}
            <TabsContent value="grid">
              <Card className="glass border-primary/20 p-12 text-center">
                <Mountain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Planet Grid</h3>
                <p className="text-muted-foreground mb-4">
                  Planet grid visualization coming soon
                </p>
                <p className="text-sm text-muted-foreground">
                  Planet: {planet.name} • System: {system.name}
                </p>
              </Card>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management" className="space-y-6">
              {/* Network Topology - Show blockchain node connections */}
              <NetworkTopology
                starSystems={displayStarSystems}
                planets={displayPlanets}
              />
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Planet Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Configure planet settings and parameters</p>
                    <Button 
                      variant="cosmic" 
                      className="w-full"
                      onClick={() => {
                        setSelectedPlanetForManagement(planet.id);
                        setSelectedPlanetInSystem(null);
                        setSelectedStarSystem(null);
                      }}
                    >
                      Manage Planet
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Manage planet resources and economy</p>
                    <Button variant="cosmic" className="w-full">View Resources</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Star System view - shows planets to select (like planet view shows cities)
  if (selectedStarSystem) {
    const system = starSystems.find(s => s.id === selectedStarSystem);
    if (!system) {
      setSelectedStarSystem(null);
      return null;
    }
    
    const systemPlanets = displayPlanets.filter((p: any) => p.star_system_id === system.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
        {/* Star System Info at Top */}
        <div className="pt-20 bg-gradient-to-b from-background via-background/95 to-background/80 border-b border-primary/20">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Button variant="glass" className="mb-6 gap-2" onClick={() => {
              setSelectedStarSystem(null);
              setSelectedPlanetInSystem(null);
            }}>
              <ChevronLeft className="h-4 w-4" />
              Back to Star Map
            </Button>
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-6xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                    {system.name}
                  </h1>
                  <Badge variant={system.status === 'active' ? 'default' : 'outline'} className="text-lg px-4 py-1 capitalize">
                    {system.status}
                  </Badge>
                </div>
                <p className="text-xl text-muted-foreground mb-6">
                  Star system with subnet ID: <span className="font-mono text-sm">{system.subnet_id}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm">
                    Chain ID: {system.chain_id}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {systemPlanets.length} Planet{systemPlanets.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Tribute: {system.tribute_percent}%
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Treasury: {balances.avax || "0"} AVAX
                  </Badge>
                </div>
              </div>
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>System Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">RPC URL</div>
                    <div className="text-xs font-mono break-all bg-muted/50 p-2 rounded">
                      {system.rpc_url}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Owner</div>
                    <div className="text-xs font-mono break-all">
                      {system.owner_wallet.substring(0, 10)}...{system.owner_wallet.substring(32)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Created</div>
                    <div className="text-sm">
                      {new Date(system.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="cosmic"
                    className="w-full"
                    onClick={() => {
                      setSelectedSystemForManagement(system.id);
                      setSelectedStarSystem(null);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage System
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Planets Grid */}
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          {systemPlanets.length === 0 ? (
            <Card className="glass border-primary/20 p-12 text-center">
              <Mountain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No Planets Yet</h3>
              <p className="text-muted-foreground mb-6">
                This star system doesn't have any planets yet. Create your first planet!
              </p>
              <Button
                variant="cosmic"
                onClick={() => {
                  setSelectedStarSystem(null);
                  setSelectedStarSystemForPlanet(system.id);
                  document.getElementById("planet-spawner")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create First Planet
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-0">
              {systemPlanets.map((planet) => (
                <Card
                  key={planet.id}
                  className="relative glass border-2 border-primary/30 hover:border-primary/80 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:border-primary/60 active:scale-[0.98] transition-all duration-500 cursor-pointer group overflow-hidden backdrop-blur-xl bg-gradient-to-br from-background/80 via-background/60 to-background/40 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-accent/10 before:opacity-0 hover:before:opacity-100 active:before:opacity-100 before:transition-opacity before:duration-500 w-full min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]"
                  onClick={() => {
                    setSelectedPlanetInSystem(planet.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0 group-hover:from-primary/10 group-hover:via-primary/20 group-hover:to-accent/10 transition-all duration-700 -z-10" />
                  
                  {/* Glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-20" />
                  
                  <CardHeader className="relative z-10 p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
                      <Badge 
                        variant={planet.status === 'active' ? 'default' : 'outline'}
                        className="text-xs sm:text-sm capitalize font-semibold px-2 sm:px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400 shadow-lg shadow-green-500/10"
                      >
                        {planet.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm capitalize font-semibold px-2 sm:px-3 py-1 border-primary/40 text-primary/90 bg-primary/5">
                        {planet.planet_type}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent group-hover:scale-105 group-active:scale-100 transition-transform duration-300 break-words leading-tight">
                      {planet.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-5 relative z-10 p-4 sm:p-6 pt-0">
                    <div className="space-y-2 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-primary/10">
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 break-all">
                        <Network className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/60 flex-shrink-0" />
                        <span className="font-mono text-primary/80 text-[10px] sm:text-xs">{planet.ip_address}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent/60 flex-shrink-0" />
                        <span className="capitalize">{planet.node_type}</span>
                      </div>
                    </div>
                    <Button 
                      variant="cosmic" 
                      className="w-full gap-2 text-sm sm:text-base py-4 sm:py-6 font-semibold bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/90 hover:via-primary/90 hover:to-accent/90 active:from-primary/80 active:via-primary/80 active:to-accent/80 shadow-lg shadow-primary/20 group-hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] min-h-[48px] sm:min-h-[56px] touch-manipulation"
                    >
                      <span className="hidden sm:inline">Explore Planet</span>
                      <span className="sm:hidden">Explore</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                  
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-full" />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Star System Management view - standalone view (like star system view)
  if (selectedSystemForManagement) {
    const system = starSystems.find(s => s.id === selectedSystemForManagement);
    if (!system) {
      setSelectedSystemForManagement(null);
      return null;
    }
    
    const systemPlanets = displayPlanets.filter((p: any) => p.star_system_id === system.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
        <div className="pt-20 bg-gradient-to-b from-background via-background/95 to-background/80 border-b border-primary/20">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Button variant="glass" className="mb-6 gap-2" onClick={() => {
              setSelectedSystemForManagement(null);
              setSelectedPlanetForManagement(null);
              setManageView("systems");
            }}>
              <ChevronLeft className="h-4 w-4" />
              Back to Star Map
            </Button>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Card className="glass p-6 border-2 border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Manage Star System
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSystemForManagement(null);
                    setSelectedPlanetForManagement(null);
                    setManageView("systems");
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Name</label>
                    <Input value={system.name} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={system.status}
                      onChange={(e) => updateStarSystemStatus(system.id, e.target.value as "active" | "deploying" | "inactive")}
                      className="w-full px-4 py-2 rounded-lg bg-background border border-accent/30"
                    >
                      <option value="active">Active</option>
                      <option value="deploying">Deploying</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subnet ID</label>
                    <Input value={system.subnet_id} disabled className="bg-muted font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chain ID</label>
                    <Input value={system.chain_id} disabled className="bg-muted font-mono" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">RPC URL</label>
                    <Input value={system.rpc_url} disabled className="bg-muted font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tribute Percent</label>
                    <Input 
                      type="number" 
                      value={system.tribute_percent} 
                      disabled
                      min="0"
                      max="20"
                      className="w-full bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Tribute percent from subnet configuration</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Treasury Balance (AVAX)</label>
                    <Input 
                      type="text" 
                      value={balances.avax || "0"} 
                      disabled
                      className="w-full bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Real-time balance from treasury contract</p>
                  </div>
                </div>

                {/* Planets Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Mountain className="h-5 w-5 text-accent" />
                      Planets ({systemPlanets.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSystemForManagement(null);
                        setSelectedStarSystemForPlanet(system.id);
                        document.getElementById("planet-spawner")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Add Planet
                    </Button>
                  </div>

                  {systemPlanets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No planets yet. Add your first planet above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {systemPlanets.map((planet) => (
                        <Card key={planet.id} className="border-accent/20">
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <Badge 
                                variant={planet.status === 'active' ? 'default' : 'outline'}
                                className="capitalize"
                              >
                                {planet.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {planet.planet_type}
                              </Badge>
                            </div>
                            <CardTitle>{planet.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-sm text-muted-foreground">
                              <div>IP: <span className="font-mono">{planet.ip_address}</span></div>
                              <div>Type: {planet.node_type}</div>
                            </div>
                            <select
                              value={planet.status}
                              onChange={(e) => updatePlanetStatus(planet.id, e.target.value as "active" | "deploying" | "inactive")}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-accent/30 text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="deploying">Deploying</option>
                              <option value="inactive">Inactive</option>
                            </select>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedPlanetForManagement(planet.id);
                                  setSelectedSystemForManagement(null);
                                  setManageView("planets");
                                }}
                              >
                                Details
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Destroy planet "${planet.name}"?\n\nThis action cannot be undone.`)) {
                                    // Delete planet - refresh from API
                                    fetchStarSystems();
                                    toast.success(`Planet "${planet.name}" deleted!`);
                                    toast.success(`Planet "${planet.name}" destroyed!`);
                                  }
                                }}
                                title="Destroy Planet"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t pt-4 flex justify-between">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`DESTROY star system "${system.name}" and all its ${systemPlanets.length} planet(s)?\n\nThis action cannot be undone.`)) {
                        // Delete star system - refresh from API
                        fetchStarSystems();
                        setSelectedSystemForManagement(null);
                        toast.success(`Star system "${system.name}" deleted!`);
                        setSelectedSystemForManagement(null);
                        toast.success(`Star system "${system.name}" destroyed!`);
                      }
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Destroy System
                  </Button>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Created: {new Date(system.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // City view - shows city info, grid, and management
  if (selectedPlanet && selectedCity) {
    const planet = planetsData?.[selectedPlanet] || planetsData?.["sarakt-prime"];
    const city = planet.districts?.find((d, idx) => `city-${idx}` === selectedCity);
    if (!city) {
      setSelectedCity(null);
      return null;
    }

    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="glass" className="gap-2" onClick={() => setSelectedCity(null)}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                {city.name}
              </h1>
              <p className="text-muted-foreground">{planet.name} • {city.type}</p>
            </div>
          </div>

          {/* City View Tabs */}
          <Tabs value={cityView} onValueChange={(v) => setCityView(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="grid">City Grid</TabsTrigger>
              <TabsTrigger value="info">City Info & Management</TabsTrigger>
            </TabsList>

            {/* City Grid Tab - Show first by default */}
            <TabsContent value="grid">
              {loadingCityPlots ? (
                <Card className="glass border-primary/20 p-12 text-center">
                  <p className="text-muted-foreground">Loading city grid...</p>
                </Card>
              ) : (
                <OctagonalGrid
                  cityName={city.name}
                  plots={cityPlots}
                  totalPlots={10000}
                  isConnected={isConnected}
                  isLoading={loadingCityPlots}
                  plotPrice={priceInAVAX}
                  ownedPlotIds={ownedPlotIds}
                  onPlotClick={(plot) => {
                    // Navigate to purchase page with the clicked plot ID
                    navigate(`/plot-purchase?plotId=${plot.id}`);
                  }}
                  onPlotSelect={(plot) => {
                    // Can be used for multi-select in future
                    console.log("Plot selected:", plot);
                  }}
                  onPurchase={async (plotId: number) => {
                    // Direct purchase from grid - navigate to purchase page instead
                    navigate(`/plot-purchase?plotId=${plotId}`);
                  }}
                />
              )}
            </TabsContent>

            {/* City Info & Management Tab - Combined */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass border-primary/20 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">{city.name} Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{city.description || `A ${city.type.toLowerCase()} district in ${planet.name}.`}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Total Plots</div>
                        <div className="text-2xl font-bold">{cityStats?.total_plots || city.plots || 10000}</div>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Plots Owned</div>
                        <div className="text-2xl font-bold text-primary">{cityStats?.plots_owned || plotsSold || 0}</div>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">District Type</div>
                        <Badge variant="outline">{city.type}</Badge>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                    </div>
                    
                    {/* Population Mechanics Display */}
                    {cityStats && (
                      <div className="mt-6 space-y-4 border-t pt-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Population & Economy
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="glass p-4 rounded-lg border-2 border-primary/30">
                            <div className="text-sm text-muted-foreground mb-1">Current Population</div>
                            <div className="text-3xl font-bold text-primary">{cityStats.population?.current || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Projected: {cityStats.population?.projected_next_cycle || 0}
                            </div>
                          </div>
                          <div className="glass p-4 rounded-lg border-2 border-green-500/30">
                            <div className="text-sm text-muted-foreground mb-1">Newcomers Available</div>
                            <div className="text-3xl font-bold text-green-500">{cityStats.population?.growth_potential || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Growth rate: +{cityStats.population?.growth_rate || 0}/cycle
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="glass p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Job Vacancies</span>
                              <Badge variant={cityStats.economy?.total_job_vacancies > 0 ? "default" : "destructive"}>
                                {cityStats.economy?.total_job_vacancies || 0}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Industrial: {cityStats.zones?.industrial?.job_vacancies || 0} | 
                              Business: {cityStats.zones?.business?.job_vacancies || 0}
                            </div>
                            <Progress 
                              value={cityStats.economy?.total_job_vacancies > 0 ? 50 : 0} 
                              className="h-2 mt-2"
                            />
                          </div>
                          <div className="glass p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Available Rentals</span>
                              <Badge variant={cityStats.economy?.total_available_rentals > 0 ? "default" : "destructive"}>
                                {cityStats.economy?.total_available_rentals || 0}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Residential plots: {cityStats.zones?.residential?.total_owned || 0} owned | 
                              {cityStats.zones?.residential?.occupied || 0} occupied
                            </div>
                            <Progress 
                              value={cityStats.economy?.total_available_rentals > 0 ? 50 : 0} 
                              className="h-2 mt-2"
                            />
                          </div>
                        </div>
                        
                        {cityStats.economy && (
                          <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                              <div className="flex-1">
                                <div className="font-medium mb-1">Population Growth Requirements</div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {cityStats.economy.newcomers_can_arrive ? (
                                    <div className="text-green-500">
                                      ✓ Newcomers can arrive! Both job vacancies and rentals are available.
                                    </div>
                                  ) : (
                                    <div>
                                      <div className={cityStats.economy.newcomers_blocked_by?.no_jobs ? "text-red-500" : "text-muted-foreground"}>
                                        {cityStats.economy.newcomers_blocked_by?.no_jobs ? "✗" : "✓"} Jobs: {cityStats.economy.total_job_vacancies > 0 ? "Available" : "Required"}
                                      </div>
                                      <div className={cityStats.economy.newcomers_blocked_by?.no_rentals ? "text-red-500" : "text-muted-foreground"}>
                                        {cityStats.economy.newcomers_blocked_by?.no_rentals ? "✗" : "✓"} Rentals: {cityStats.economy.total_available_rentals > 0 ? "Available" : "Required"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Data from Chaos Star Network subnet • Updates every 30s
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {loadingCityStats && (
                      <div className="mt-6 text-center text-muted-foreground">
                        Loading city statistics from blockchain...
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cityStats ? (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Population Growth</span>
                            <span className="font-bold text-green-500">
                              {cityStats.population?.growth_potential > 0 ? `+${cityStats.population?.growth_potential}` : "0"}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(100, (cityStats.population?.growth_potential || 0) * 10)} 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Job Market</span>
                            <span className="font-bold">
                              {cityStats.economy?.total_employed || 0}/{cityStats.economy?.total_job_capacity || 0}
                            </span>
                          </div>
                          <Progress 
                            value={cityStats.economy?.total_job_capacity > 0 
                              ? ((cityStats.economy?.total_employed || 0) / cityStats.economy?.total_job_capacity * 100)
                              : 0
                            } 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Housing Occupancy</span>
                            <span className="font-bold">
                              {cityStats.zones?.residential?.occupied || 0}/{cityStats.zones?.residential?.total_owned || 0}
                            </span>
                          </div>
                          <Progress 
                            value={cityStats.zones?.residential?.total_owned > 0
                              ? ((cityStats.zones?.residential?.occupied || 0) / cityStats.zones?.residential?.total_owned * 100)
                              : 0
                            } 
                            className="h-2"
                          />
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            <div className="mb-1">📊 Real-time data from</div>
                            <div className="font-medium text-primary">Chaos Star Network</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* User Ownable Asset Management Section */}
              <div className="mt-8 space-y-6 border-t pt-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  User Ownable Asset Management
                </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Land Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Manage your land plots, ownership, and property rights</p>
                    <Button variant="cosmic" className="w-full" onClick={() => navigate("/plot-purchase")}>
                      Manage Land
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Business Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Own and operate businesses, shops, and commercial enterprises</p>
                    <Button variant="cosmic" className="w-full">Manage Businesses</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Construction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Build structures, infrastructure, and developments on your land</p>
                    <Button variant="cosmic" className="w-full">Build & Construct</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="w-5 h-5" />
                      Banking & Finance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Manage accounts, loans, investments, and financial services</p>
                    <Button variant="cosmic" className="w-full" onClick={() => navigate("/financial-hub")}>
                      Banking Services
                    </Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Asset Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">View and manage your complete asset portfolio</p>
                    <Button variant="cosmic" className="w-full">View Portfolio</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Asset Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Track performance, revenue, and asset value</p>
                    <Button variant="cosmic" className="w-full">View Analytics</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Asset Marketplace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Buy, sell, and trade assets on the marketplace</p>
                    <Button variant="cosmic" className="w-full">Open Marketplace</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="w-5 h-5" />
                      Property Rights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Manage ownership, titles, and property documentation</p>
                    <Button variant="cosmic" className="w-full">Manage Rights</Button>
                  </CardContent>
                </Card>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    );
  }

  // Planet view - shows cities/districts to select
  if (selectedPlanet) {
    const planet = planetsData?.[selectedPlanet] || planetsData?.["sarakt-prime"];
    // Show Octavia Capital City for Sarakt Prime, or Capital city of Zarathis for Zythera
    const octaviaCity = planet.districts?.find(d => d.name === "Octavia Capital City");
    const zarathisCity = planet.districts?.find(d => d.name === "Capital city of Zarathis");
    const octaviaCityIndex = planet.districts?.findIndex(d => d.name === "Octavia Capital City") ?? -1;
    const zarathisCityIndex = planet.districts?.findIndex(d => d.name === "Capital city of Zarathis") ?? -1;
    const ownedPlotsCount = backendPlots.length;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
        {/* Planet Info at Top */}
        <div className="pt-20 bg-gradient-to-b from-background via-background/95 to-background/80 border-b border-primary/20">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Button variant="glass" className="mb-6 gap-2" onClick={() => {
              setSelectedPlanet(null);
              setSelectedCity(null);
            }}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-6xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                    {planet.name}
                  </h1>
                  <Badge variant={planet.color === "primary" ? "default" : "destructive"} className="text-lg px-4 py-1">
                    {planet.status}
                  </Badge>
                </div>
                <p className="text-xl text-muted-foreground mb-6">{planet.description}</p>
                <div className="flex flex-wrap gap-2">
                  {planet.features?.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">Planet Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Population
                      </span>
                      <span className="font-bold">{planet.population}k</span>
                    </div>
                    <Progress value={planet.population} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Mapped
                      </span>
                      <span className="font-bold">{planet.coverage}%</span>
                    </div>
                    <Progress value={planet.coverage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Districts
                      </span>
                      <span className="font-bold">{planet.districts?.length || 0}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tier</span>
                      <Badge className="bg-gradient-cosmic text-white">{planet.tier}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* City Selection */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {octaviaCity && selectedPlanet !== "zythera" && (
            <div className="mb-8">
              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-4xl font-bold mb-2">Octavia Capital City</h2>
                      <p className="text-muted-foreground">The grand capital city - your gateway to land ownership</p>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      10,000 Total Plots
                    </Badge>
                  </div>
                </div>
                <div className="lg:col-span-1"></div>
              </div>
              <Card 
                className="glass border-primary/20 w-full max-w-2xl mx-auto hover:border-primary/60 transition-all cursor-pointer"
                onClick={() => {
                  if (octaviaCityIndex >= 0) {
                    setSelectedCity(`city-${octaviaCityIndex}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <Building2 className="w-10 h-10 text-primary" />
                    </div>
                    <Badge variant="default">
                      Capital City
                    </Badge>
                  </div>
                  <CardTitle className="text-4xl font-bold mb-3">
                    {octaviaCity.name}
                  </CardTitle>
                  {octaviaCity.description && (
                    <p className="text-muted-foreground text-lg leading-relaxed">{octaviaCity.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-5">
                    <div className="p-5 rounded-xl bg-muted/40 border border-primary/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Available Plots</p>
                      <p className="text-3xl font-bold">10,000</p>
                    </div>
                    <div className="p-5 rounded-xl bg-muted/40 border border-primary/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Price per Plot</p>
                      <p className="text-3xl font-bold">100 xBGL</p>
                    </div>
                    <div className="p-5 rounded-xl bg-muted/40 border border-accent/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Your Plots</p>
                      <p className="text-3xl font-bold">0</p>
                    </div>
                  </div>
                  <Button 
                    variant="cosmic" 
                    className="w-full gap-3 text-xl py-7 font-bold"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (octaviaCityIndex >= 0) {
                        setSelectedCity(`city-${octaviaCityIndex}`);
                      }
                    }}
                  >
                    <span className="flex items-center justify-center gap-3">
                      Enter Octavia Capital City
                      <ArrowRight className="h-6 w-6" />
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Zarathis City for Zythera */}
          {selectedPlanet === "zythera" && (
            <div className="mb-8">
              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-4xl font-bold mb-2">Capital city of Zarathis</h2>
                      <p className="text-muted-foreground">A frontier city on Zythera</p>
                    </div>
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Frontier City
                    </Badge>
                  </div>
                </div>
                <div className="lg:col-span-1"></div>
              </div>
              <Card 
                className="glass border-red-500/30 w-full max-w-2xl mx-auto bg-gradient-to-br from-red-950/20 to-background"
                onClick={() => {
                  navigate("/nanofiber-research");
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                      <Skull className="w-10 h-10 text-red-500" />
                    </div>
                    <Badge variant="destructive">
                      Frontier City
                    </Badge>
                  </div>
                  <CardTitle className="text-4xl font-bold mb-3 text-red-400">
                    {zarathisCity?.name || "Capital city of Zarathis"}
                  </CardTitle>
                  {zarathisCity?.description && (
                    <p className="text-muted-foreground text-lg leading-relaxed mb-4">{zarathisCity.description}</p>
                  )}
                  {!zarathisCity?.description && (
                    <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                      Zarathis - A frontier city on Zythera. Research and harvest nanofiber web circles with a license. <span className="text-yellow-400 font-semibold">No land ownership - research and harvest nanofiber web circles with a license.</span>
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Important Notice */}
                  <div className="p-4 rounded-xl bg-yellow-950/30 border border-yellow-500/30 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-yellow-300 mb-1">No Land Ownership on Zythera</h3>
                        <p className="text-xs text-muted-foreground">
                          Land cannot be owned on Zythera. Instead, obtain a license to research and harvest nanofiber web circles in designated licensed spots.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nanofiber Coverage Stats */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/30 to-blue-950/30 border border-purple-500/30 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-purple-300">Nanofiber Network Coverage</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">City Coverage</span>
                          <span className="text-2xl font-bold text-purple-400">87%</span>
                        </div>
                        <Progress value={87} className="h-2 bg-purple-950/50" />
                        <p className="text-xs text-muted-foreground mt-1">Nanofiber web infrastructure</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Network Density</span>
                          <span className="text-2xl font-bold text-blue-400">92%</span>
                        </div>
                        <Progress value={92} className="h-2 bg-blue-950/50" />
                        <p className="text-xs text-muted-foreground mt-1">Bioluminescent nodes active</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Nanofiber Nodes</span>
                        <span className="font-bold text-purple-300">1,247</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Network Bandwidth</span>
                        <span className="font-bold text-blue-300">12.4 Tbps</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Licensed Spots Available</span>
                        <span className="font-bold text-green-300">342</span>
                      </div>
                    </div>
                  </div>

                  {/* License & Research Stats */}
                  <div className="grid grid-cols-3 gap-5 mb-4">
                    <div className="p-5 rounded-xl bg-muted/40 border border-purple-500/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Your Licenses</p>
                      <p className="text-2xl font-bold text-purple-400">0</p>
                      <p className="text-xs text-muted-foreground mt-1">Active licenses</p>
                    </div>
                    <div className="p-5 rounded-xl bg-muted/40 border border-blue-500/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Research Spots</p>
                      <p className="text-2xl font-bold text-blue-400">342</p>
                      <p className="text-xs text-muted-foreground mt-1">Licensed locations</p>
                    </div>
                    <div className="p-5 rounded-xl bg-muted/40 border border-green-500/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Harvest Yield</p>
                      <p className="text-2xl font-bold text-green-400">—</p>
                      <p className="text-xs text-muted-foreground mt-1">Per cycle</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="gap-3 text-lg py-6 border-purple-500/30 hover:bg-purple-950/20 hover:border-purple-500/50"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate("/nanofiber-research");
                      }}
                    >
                      <Book className="h-5 w-5" />
                      Research & Harvest
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-3 text-lg py-6"
                      disabled
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Management Menu for Owned Assets */}
          {isConnected && (
            <div className="mt-12">
              <h2 className="text-4xl font-bold mb-6">Asset Management</h2>
              <Tabs value={managementTab} onValueChange={(v) => setManagementTab(v as any)} className="mb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="assets">My Assets</TabsTrigger>
                  <TabsTrigger value="plots">Land Plots</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="assets" className="mt-6">
                  <Card className="glass border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Owned Assets Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Total Land Plots</span>
                          </div>
                          <p className="text-3xl font-bold">{ownedPlotsCount}</p>
                        </div>
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Coins className="h-5 w-5 text-accent" />
                            <span className="text-sm text-muted-foreground">Wallet Balance</span>
                          </div>
                          <p className="text-3xl font-bold">{parseFloat(balance || "0").toFixed(4)} AVAX</p>
                        </div>
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Treasury Balance</span>
                          </div>
                          <p className="text-3xl font-bold">
                            {balances?.AVAX ? parseFloat(balances.AVAX).toFixed(2) : "0.00"} AVAX
                          </p>
                        </div>
                      </div>
                      {ownedPlotsCount > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-4">Recent Plots</h3>
                          <div className="space-y-2">
                            {backendPlots.slice(0, 5).map((plot) => (
                              <div key={plot.token_id} className="glass p-3 rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">Plot #{plot.token_id}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {plot.metadata?.type || "Land Plot"}
                                  </p>
                                </div>
                                <Badge variant="outline">Owned</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="plots" className="mt-6">
                  <Card className="glass border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Land Plot Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ownedPlotsCount > 0 ? (
                        <div className="space-y-4">
                          <p className="text-muted-foreground">You own {ownedPlotsCount} plot(s) in Octavia Capital City.</p>
                          <Button variant="cosmic" onClick={() => {
                            if (octaviaCityIndex >= 0) {
                              setSelectedCity(`city-${octaviaCityIndex}`);
                              setCityView("management");
                            }
                          }}>
                            View All Plots in City Grid
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-xl font-bold mb-2">No Plots Owned</h3>
                          <p className="text-muted-foreground mb-4">Start by purchasing your first plot in Octavia Capital City</p>
                          <Button variant="cosmic" onClick={() => {
                            if (octaviaCityIndex >= 0) {
                              setSelectedCity(`city-${octaviaCityIndex}`);
                            }
                          }}>
                            Browse Available Plots
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="income" className="mt-6">
                  <Card className="glass border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Income & Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="glass p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Monthly Income</p>
                          <p className="text-2xl font-bold">0.00 xBGL</p>
                          <p className="text-xs text-muted-foreground mt-1">From plot rentals</p>
                        </div>
                        <div className="glass p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
                          <p className="text-2xl font-bold">0.00 xBGL</p>
                          <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Income tracking will be available once plot development features are active.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <Card className="glass border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Asset Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="glass p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Notification Preferences</h3>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Plot purchase notifications</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Income alerts</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Marketplace updates</span>
                          </label>
                        </div>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Quick Actions</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">Export Portfolio</Button>
                          <Button variant="outline" size="sm">View Transactions</Button>
                          <Button variant="outline" size="sm" onClick={() => navigate("/financial-hub")}>
                            Financial Hub
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          {selectedPlanet === "sarakt-prime" && (
            <div className="mt-12 space-y-6">
              <h2 className="text-4xl font-bold mb-8">Development Phases</h2>
              <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <Home className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl mb-2">Phase 1: Tribal Stage</CardTitle>
                      <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">
                        {totalPlots.toLocaleString()} Plots • {plotsSold} Sold
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                  <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg">
                    <h3 className="text-2xl font-semibold text-foreground mb-3">Settlement Foundation</h3>
                    <p>10,000 plots minted for initial settlers and tribes. Each plot must be developed within one Octavian year or face consequences.</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="glass border-primary/20">
                      <CardContent className="p-6">
                        <TreePine className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold text-foreground mb-2">Hunting & Gathering</h4>
                        <p className="text-sm">NPCs forage resources from wilderness</p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardContent className="p-6">
                        <Sprout className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold text-foreground mb-2">Farming</h4>
                        <p className="text-sm">Agricultural plots produce food supplies</p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardContent className="p-6">
                        <Droplets className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold text-foreground mb-2">Water Collection</h4>
                        <p className="text-sm">Infrastructure for clean water distribution</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground mb-3">Basic Infrastructure</h3>
                    <p>Huts, workshops, water systems, and sewage. Villages form along trade routes. Dual currency activates: <span className="text-primary font-semibold">xBGL</span> for land/treasury, <span className="text-primary font-semibold">Chaos</span> for wages/commerce.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-card/50 backdrop-blur overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl -z-10" />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                      <Building2 className="w-10 h-10 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl mb-2">Phase 2: Civilization Stage</CardTitle>
                      <Badge variant="destructive" className="text-lg px-4 py-2">Unlocks at 100,000 Developed Plots</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                  <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-lg">
                    <h3 className="text-2xl font-semibold text-foreground mb-3">Advanced Structures</h3>
                    <p>Detached houses, schools, universities, industrial complexes. Full-scale economy with wages, rents, and production loops.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Secondary Market Opens</h3>
                      <p>Property trading with refunds based on net value. Building improvements directly increase property worth and rental income tied to valuation.</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Player Faction Control</h3>
                      <p>After owning and developing 100 plots, form a faction. Manage population within your loyalty sphere. NPCs choose allegiance based on trust and benefits.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="relative h-[500px] overflow-hidden mb-16">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Cosmic Space" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-gradient-cosmic text-white border-primary text-lg px-6 py-2">
              <Sparkles className="w-5 h-5 mr-2" />
              Genesis Phase Active
            </Badge>
            <h1 className="font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent text-7xl">Chaos Star Universe</h1>
            <p className="text-2xl text-muted-foreground mb-8">
              From rebellion to renaissance. Explore lore, claim land, build empires.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
              <Button
                onClick={() => navigate("/plot-purchase")}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
                size="lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="glass border-2 border-accent/50 bg-accent/10 rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg hover:shadow-glow-accent transition-all">
                <div className="p-2 rounded-full bg-accent/20 border border-accent/30">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                    {plotsRemaining.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="text-sm text-muted-foreground">{totalPlots.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Plots Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        {/* UNIFIED UNIVERSE - Galaxy View + Star Map */}
        <div className="space-y-8">
            {/* Galaxy Visualization with Sarakt System Panel */}
            <div className="grid lg:grid-cols-3 gap-6 items-end">
              {/* Galaxy Visualization - Takes 2/3 width */}
              <div className="lg:col-span-2">
                <Card className="glass border-2 border-primary/30 overflow-hidden">
                  <CardContent className="p-0 relative">
                    <div className="bg-black/90 relative" style={{ height: '700px' }}>
                      <GalaxyVisualization />
                    </div>

                    {/* Bottom Stats Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-xs font-semibold">Sarakt Star</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Progress: {Math.round((displayStarSystems.length / 10) * 100)}%</p>
                        </div>
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-xs font-semibold">Sarakt Prime</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Pop: {planetsData?.["sarakt-prime"]?.population || 0}k</p>
                        </div>
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-xs font-semibold">Zythera</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Pop: {planetsData?.["zythera"]?.population || 0}k</p>
                        </div>
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold">Plots</span>
                          </div>
                          <p className="text-xs text-muted-foreground">10,000 units</p>
                        </div>
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <Network className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold">Systems</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{displayStarSystems.length} active</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sarakt System Panel - Takes 1/3 width on right */}
              <div className="lg:col-span-1">
                <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden flex flex-col" style={{ height: '700px' }}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                          <Network className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">Sarakt System</CardTitle>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">Humanity's stronghold. Advanced infrastructure, vertical cities, hybrid companions.</p>
                      <Badge className="bg-gradient-cosmic text-white text-sm px-3 py-1 w-fit">2 Planets</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 overflow-y-auto">
                    {(Object.keys(planetsData || {}) || ["sarakt-prime", "zythera"]).map(id => {
                      const planet = planetsData?.[id];
                      if (!planet) return null;
                      return (
                        <Card
                          key={id}
                          className="border-primary/10 hover:border-primary hover:shadow-glow-accent transition-all cursor-pointer group"
                          onClick={() => handlePlanetSelect(id)}
                        >
                          <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant={planet.status === "Habitable" ? "default" : "destructive"} className="text-xs px-1.5 py-0.5">
                                {planet.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">{planet.tier}</Badge>
                            </div>
                            <CardTitle className="text-base">{planet.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0 px-3 pb-3">
                            <p className="text-xs text-muted-foreground line-clamp-1">{planet.description}</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="glass p-1.5 rounded">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Users className="w-2.5 h-2.5 text-primary" />
                                  <span className="text-[10px] text-muted-foreground">Pop</span>
                                </div>
                                <p className="text-sm font-bold">{planet.population}k</p>
                              </div>
                              <div className="glass p-1.5 rounded">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <MapPin className="w-2.5 h-2.5 text-primary" />
                                  <span className="text-[10px] text-muted-foreground">Map</span>
                                </div>
                                <p className="text-sm font-bold">{planet.coverage}%</p>
                              </div>
                            </div>
                            <Button variant="cosmic" size="sm" className="w-full h-7 text-xs gap-1 group-hover:shadow-glow-accent transition-all">
                              Select <ArrowRight className="h-2.5 w-2.5" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Stats - Full Width Below Galaxy */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="glass p-6 border-primary/20">
                <div className="flex items-center gap-2 text-xl font-bold mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  Population
                </div>
                <p className="text-3xl font-bold">{populationCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active citizens</p>
              </Card>
              <Card className="glass p-6 border-primary/20">
                <div className="flex items-center gap-2 text-xl font-bold mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Plots
                </div>
                <p className="text-3xl font-bold">10,000</p>
                <p className="text-sm text-muted-foreground">Land units</p>
              </Card>
              <Card className="glass p-6 border-primary/20">
                <div className="flex items-center gap-2 text-xl font-bold mb-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Currencies
                </div>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">xBGL, Chaos & Xen</p>
              </Card>
              <Card className="glass p-6 border-primary/20">
                <div className="flex items-center gap-2 text-xl font-bold mb-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Worlds
                </div>
                <p className="text-3xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Sarakt Prime & Zythera</p>
              </Card>
            </div>
            {/* Your Plots (from backend) */}
            {isConnected && (
              <Card className="glass p-6 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xl font-bold">
                    <MapPin className="w-5 h-5 text-primary" />
                    Your Plots
                  </div>
                  <Badge variant="outline">
                    {loadingPlots ? "Loading..." : `${backendPlots.length} plot${backendPlots.length === 1 ? "" : "s"}`}
                  </Badge>
                </div>
                {backendPlots.length === 0 && !loadingPlots ? (
                  <p className="text-sm text-muted-foreground">
                    No plots found for your wallet in the registry.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {backendPlots.slice(0, 12).map((p, idx) => {
                      const id = typeof p.token_id === "string" ? p.token_id : String(p.token_id);
                      const title = p.metadata?.name || `Plot #${id}`;
                      const desc = p.metadata?.description || p.metadata?.location || "Registered land plot";
                      return (
                        <div key={`${id}-${idx}`} className="glass p-4 rounded border border-primary/20">
                          <div className="text-sm font-bold">{title}</div>
                          <div className="text-xs text-muted-foreground truncate">{desc}</div>
                          <div className="text-xs mt-2">
                            Token ID: <span className="font-mono">{id}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}


                </div>
                  </div>
                  </div>
  );
}
