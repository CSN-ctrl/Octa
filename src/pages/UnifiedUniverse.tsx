import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Mountain, Users, MapPin, ArrowRight, ChevronLeft, Sparkles, Settings, Trash2, Network } from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useTreasury } from "@/hooks/useTreasury";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useRealPlanetStats } from "@/hooks/useRealPlanetStats";
import { useWallet } from "@/contexts/WalletContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { UniverseVisualization } from "@/components/UniverseVisualization";
import { fetchPlots, type BackendPlot } from "@/lib/api";
import * as supabaseService from "@/lib/supabase-service";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { StarSystemView } from "@/components/unified-universe/StarSystemView";
import { PlanetView } from "@/components/unified-universe/PlanetView";
import { UniverseCityView } from "@/components/unified-universe/UniverseCityView";
import { SaraktPlanetView } from "@/components/unified-universe/SaraktPlanetView";
import {
  GALAXY_UNIVERSE_PLANET_IDS,
  resolveCityKeyFromSlug,
  useUniverseRoutes,
} from "@/hooks/useUniverseRoutes";
import { SARAKT_STAR_SYSTEM_ID } from "@/config/world-ids";
import { LazyImage } from "@/components/ui/LazyImage";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import { GAME_CURRENCY_SYMBOL } from "@/lib/game-currency";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { UniverseGalaxySkeleton } from "@/components/unified-universe/UniverseLoadingSkeleton";
import { cn } from "@/lib/utils";

// Real planet data is now fetched from blockchain contracts via useRealPlanetStats hook

export default function UnifiedUniverse() {
  const navigate = useNavigate();
  const { systemId, planetId, citySlug } = useParams<{
    systemId?: string;
    planetId?: string;
    citySlug?: string;
  }>();
  const { goToUniverse, goToSystem, goToPlanet, goToCity } = useUniverseRoutes();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityView, setCityView] = useState<"info" | "grid" | "management">("grid");
  const { plotsSold, plotsRemaining, priceInXBGL, userPlots } = useLandPlots();
  const [resolvedPlotPrice, setResolvedPlotPrice] = useState<string>(() => getPlotPriceInXBGL().toFixed(4));

  useEffect(() => {
    setResolvedPlotPrice(
      typeof priceInXBGL === "string" ? priceInXBGL : getPlotPriceInXBGL().toFixed(4)
    );
  }, [priceInXBGL]);
  const { balances } = useTreasury();
  const { address, isConnected, balance } = useWallet();
  const gameSymbol = isOnChainCryptoMode() ? GAME_CURRENCY_SYMBOL : "AVAX";

  // Use REAL celestial forge data from blockchain/API (NOT mock)
  const {
    starSystems,
    fetchStarSystems,
    updateStarSystemStatus,
    updatePlanetStatus,
  } = useCelestialForge();
  
  // Get real planet stats from blockchain contracts
  const { planets: realPlanetsData, loading: loadingPlanets } = useRealPlanetStats();
  
  // Management state
  const [selectedSystemForManagement, setSelectedSystemForManagement] = useState<string | null>(null);
  const [, setSelectedPlanetForManagement] = useState<string | null>(null);
  const [, setManageView] = useState<"systems" | "planets" | "details">("systems");
  
  
  // Use REAL data for display (from blockchain/API)
  const displayStarSystems = starSystems;
  const [planetsList, setPlanetsList] = useState<any[]>([]);
  
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
        logger.debug("Could not fetch planets from Supabase:", error);
      }
    }
    fetchPlanets();
  }, []);

  // Fetch ILO participant status (Phase 1: 10,000 participants limit)
  useEffect(() => {
    async function fetchILOStatus() {
      try {
        const { getILOStatus } = await import("@/lib/ilo-service");
        const status = await getILOStatus();
        setIloStatus({
          isOpen: status.isOpen,
          currentParticipants: status.currentPhase?.current_participants || 0,
          maxParticipants: status.currentPhase?.max_participants || 10000,
          plotsRemaining: status.plotsRemaining,
        });
      } catch (error: any) {
        logger.debug("Could not fetch ILO status:", error);
        setIloStatus({
          isOpen: true,
          currentParticipants: 0,
          maxParticipants: 10000,
          plotsRemaining: 10000,
        });
      }
    }
    fetchILOStatus();
    // Refresh every 5 minutes (reduced frequency to avoid 404 spam)
    const interval = setInterval(fetchILOStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const displayPlanets = planetsList;
  
  // Real planet data from blockchain (fallback to calculated stats)
  const planetsData = realPlanetsData;
  const [, setSelectedStarSystemForPlanet] = useState<string>("");
  // selectedBody removed - visualization is detached from functions
  const [backendPlots, setBackendPlots] = useState<BackendPlot[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [managementTab, setManagementTab] = useState<"assets" | "plots" | "income" | "settings">("assets");
  
  const [cityPlots, setCityPlots] = useState<any[]>([]);
  const [loadingCityPlots, setLoadingCityPlots] = useState(false);
  const [cityStats, setCityStats] = useState<any>(null);
  const [loadingCityStats, setLoadingCityStats] = useState(false);
  const [ownedPlotIds, setOwnedPlotIds] = useState<number[]>([]);
  
  // ILO participant stats (Phase 1: 10,000 participants limit)
  const [iloStatus, setIloStatus] = useState<{
    isOpen: boolean;
    currentParticipants: number;
    maxParticipants: number;
    plotsRemaining: number;
  } | null>(null);

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
        logger.debug(`✅ Fetched ${plotIds.length} plots from Registry API for ${address}`);
        setOwnedPlotIds(plotIds);
        return;
      }
    } catch (error: any) {
      logger.debug("Registry API failed, trying other sources:", error.message);
    }

    // Priority 2: Try useLandPlots hook data (already loaded)
    if (userPlots && userPlots.length > 0) {
      logger.debug(`Using ${userPlots.length} plots from useLandPlots hook`);
      setOwnedPlotIds(userPlots);
      return;
    }

    // Priority 3: Try direct contract query
    try {
      const { fetchOwnedPlots: fetchPlotsFromContract } = await import("@/lib/plotUtils");
      const plotIds = await fetchPlotsFromContract(address, 1000);
      if (plotIds && plotIds.length > 0) {
        logger.debug(`Fetched ${plotIds.length} plots from contract for ${address}`);
        setOwnedPlotIds(plotIds);
        return;
      }
    } catch (error: any) {
      logger.debug("Failed to fetch plots from contract:", error.message);
    }
    
    // Fallback to Supabase (if available)
    try {
      const plots = await supabaseService.getPlots({ ownerWallet: address });
      
      if (plots && plots.length > 0) {
        const plotIds = plots.map(plot => plot.id);
        setOwnedPlotIds(plotIds);
      } else {
        setOwnedPlotIds([]);
      }
    } catch (error) {
      logger.debug("Failed to fetch owned plots from Supabase:", error);
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
    if (!planet) {
      setCityPlots([]);
      return;
    }
    const city = planet.districts?.find((_d, idx) => `city-${idx}` === selectedCity);
    if (!city) {
      setCityPlots([]);
      return;
    }

    // Fetch REAL plots from Chaos Star Network subnet via API and local database
    const fetchPlots = async () => {
      setLoadingCityPlots(true);
      try {
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
          
        } catch (dbError: any) {
          logger.debug("Failed to load from local registry, trying API:", dbError.message);
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
            logger.debug("Failed to fetch plots with owners, trying individual fetch:", plotsWithOwnersError.message);
            
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
                }
              } catch (fallbackError: any) {
                logger.debug("Failed to fetch owned plots:", fallbackError.message);
              }
            }
          }
        } catch (error: any) {
          logger.debug("Registry API not available for city plots:", error.message);
        }
        }
        
        // Priority 2: Fetch plots from city API (which connects to blockchain)
        try {
          const { listCityPlots } = await import("@/lib/api");
          const result = await listCityPlots();
          
          if (result?.plots && Array.isArray(result.plots)) {
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
            transformedPlots.forEach((plot: {
              plotId?: number;
              id?: number;
              wallet?: string;
              owner?: string;
            }) => {
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
            } else {
              setCityStats(null);
            }
          } catch (statsError: any) {
            // Only log if it's not a network/timeout error (already handled in API)
            if (statsError.message && !statsError.message.includes("not available")) {
              logger.debug("Could not fetch city stats:", statsError);
            }
            setCityStats(null);
          } finally {
            setLoadingCityStats(false);
          }
        } catch (apiError) {
          logger.debug("Error fetching plots from city API (this is normal if backend is not running):", apiError);
        }
        
        // Final fallback: try using data from useLandPlots hook (already loaded at component level)
        if (registryPlots.length === 0 && userPlots && userPlots.length > 0) {
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
        
        setCityPlots(registryPlots);
      } catch (error) {
        logger.debug("Error fetching plots from blockchain (this is normal if RPC is not available):", error);
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

  const clearUniverseDeepLinkParams = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("planet");
        next.delete("city");
        return next;
      },
      { replace: true }
    );
  };

  const handleBackToGalaxy = () => {
    setSelectedPlanet(null);
    setSelectedCity(null);
    clearUniverseDeepLinkParams();
    goToUniverse({ replace: true });
  };

  const handleEnterOctaviaCapital = () => {
    const planet = planetsData?.["sarakt-prime"];
    if (!planet || planet.locked) return;
    setSelectedPlanet("sarakt-prime");
    goToCity("sarakt-prime", "octavia");
  };

  const handleBackToPlanet = () => {
    const activePlanet = selectedPlanet ?? planetId ?? null;
    setSelectedCity(null);
    clearUniverseDeepLinkParams();
    if (activePlanet) {
      setSelectedPlanet(activePlanet);
    }
    goToUniverse();
  };

  useEffect(() => {
    if (!planetId || !citySlug) return;
    if (!GALAXY_UNIVERSE_PLANET_IDS.includes(planetId as (typeof GALAXY_UNIVERSE_PLANET_IDS)[number])) {
      return;
    }

    const planet = planetsData?.[planetId];
    if (!planet || planet.locked) {
      goToUniverse({ replace: true });
      return;
    }

    const cityKey = resolveCityKeyFromSlug(planet.districts, citySlug);
    if (!cityKey) {
      goToUniverse({ replace: true });
      return;
    }

    setSelectedPlanet(planetId);
    setSelectedCity(cityKey);
    clearUniverseDeepLinkParams();
  }, [planetId, citySlug, planetsData, goToUniverse]);

  useEffect(() => {
    if (systemId || planetId || citySlug) return;

    const planetParam = searchParams.get("planet");
    const cityParam = searchParams.get("city");
    if (planetParam !== "sarakt-prime" || !cityParam) return;

    const planet = planetsData?.["sarakt-prime"];
    if (!planet || planet.locked) return;

    const octaviaCityIndex =
      planet.districts?.findIndex((d) => d.name === "Octavia Capital City") ?? 0;
    const resolvedCityIndex = Math.max(octaviaCityIndex, 0);
    const isOctaviaDeepLink =
      cityParam === "octavia" ||
      cityParam === String(resolvedCityIndex) ||
      cityParam === `city-${resolvedCityIndex}`;

    if (!isOctaviaDeepLink) return;

    goToCity("sarakt-prime", "octavia", { replace: true });
  }, [planetsData, searchParams, systemId, planetId, citySlug, goToCity]);

  useEffect(() => {
    if (!systemId || starSystems.length === 0) return;
    if (!starSystems.some((s) => s.id === systemId)) {
      goToUniverse({ replace: true });
    }
  }, [systemId, starSystems, goToUniverse]);

  useEffect(() => {
    if (!planetId || citySlug) return;
    if (GALAXY_UNIVERSE_PLANET_IDS.includes(planetId as (typeof GALAXY_UNIVERSE_PLANET_IDS)[number])) {
      return;
    }
    if (displayPlanets.length === 0 && planetsList.length === 0) return;
    const planet = displayPlanets.find((p: any) => p.id === planetId);
    const system = planet ? starSystems.find((s) => s.id === planet.star_system_id) : undefined;
    if (!planet || !system) {
      goToUniverse({ replace: true });
    }
  }, [planetId, citySlug, displayPlanets, planetsList.length, starSystems, goToUniverse]);

  // Mock hook automatically loads data from localStorage on mount
  // No need to fetch from backend or database

  // Initialize: Fetch star systems on mount
  useEffect(() => {
    fetchStarSystems();
  }, [fetchStarSystems]);

  // Route: /universe/planet/:planetId/city/:citySlug — galaxy city view
  if (planetId && citySlug) {
    const planet = planetsData?.[planetId] || planetsData?.["sarakt-prime"];
    if (!planet) {
      return null;
    }
    const cityKey = resolveCityKeyFromSlug(planet.districts, citySlug) ?? selectedCity;
    const city = cityKey ? planet.districts?.find((_d, idx) => `city-${idx}` === cityKey) : undefined;
    if (!city) {
      return null;
    }

    return (
      <UniverseCityView
        planet={planet}
        city={city}
        cityView={cityView}
        onCityViewChange={setCityView}
        loadingCityPlots={loadingCityPlots}
        cityPlots={cityPlots}
        isConnected={isConnected}
        resolvedPlotPrice={resolvedPlotPrice}
        ownedPlotIds={ownedPlotIds}
        cityStats={cityStats}
        loadingCityStats={loadingCityStats}
        plotsSold={plotsSold}
        onBackToGalaxy={handleBackToGalaxy}
        onBackToPlanet={handleBackToPlanet}
      />
    );
  }

  // Route: /universe/planet/:planetId — celestial forge planet detail
  if (planetId) {
    const planet = displayPlanets.find((p: any) => p.id === planetId);
    const system = planet ? starSystems.find((s) => s.id === planet.star_system_id) : undefined;

    if (!planet || !system) {
      return null;
    }

    return (
      <PlanetView
        system={system}
        planet={planet}
        balances={balances}
        starSystems={displayStarSystems}
        planets={displayPlanets}
        gameSymbol={gameSymbol}
        cityView={cityView}
        onCityViewChange={(view) => setCityView(view)}
        onBack={() => goToSystem(system.id)}
        onManagePlanet={(id) => {
          setSelectedPlanetForManagement(id);
          goToUniverse();
        }}
      />
    );
  }

  // Route: /universe/system/:systemId — star system with planet grid
  if (systemId) {
    const system = starSystems.find((s) => s.id === systemId);
    if (!system) {
      return null;
    }

    const systemPlanets = displayPlanets.filter((p: any) => p.star_system_id === system.id);

    return (
      <StarSystemView
        system={system}
        systemPlanets={systemPlanets}
        balances={balances}
        gameSymbol={gameSymbol}
        onBack={() => goToUniverse()}
        onManageSystem={(id) => {
          setSelectedSystemForManagement(id);
          goToUniverse();
        }}
        onSelectPlanet={(id) => goToPlanet(id)}
        onCreatePlanet={(id) => {
          setSelectedStarSystemForPlanet(id);
          goToUniverse();
          document.getElementById("planet-spawner")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
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
                      value={system.status ?? ""}
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
                    <Input value={system.subnet_id ?? ""} disabled className="bg-muted font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chain ID</label>
                    <Input value={system.chain_id ?? ""} disabled className="bg-muted font-mono" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">RPC URL</label>
                    <Input value={system.rpc_url ?? ""} disabled className="bg-muted font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tribute Percent</label>
                    <Input 
                      type="number" 
                      value={system.tribute_percent ?? ""} 
                      disabled
                      min="0"
                      max="20"
                      className="w-full bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Tribute percent from subnet configuration</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Treasury Balance ({gameSymbol})</label>
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

  // City view - state fallback on /universe (canonical path uses citySlug route above)
  if (selectedPlanet && selectedCity && !citySlug) {
    const planet = planetsData?.[selectedPlanet] || planetsData?.["sarakt-prime"];
    if (!planet) {
      setSelectedCity(null);
      return null;
    }
    const city = planet.districts?.find((_d, idx) => `city-${idx}` === selectedCity);
    if (!city) {
      setSelectedCity(null);
      return null;
    }

    if (selectedPlanet === "sarakt-prime" && city.name === "Octavia Capital City") {
      goToCity("sarakt-prime", "octavia", { replace: true });
      return null;
    }

    return (
      <UniverseCityView
        planet={planet}
        city={city}
        cityView={cityView}
        onCityViewChange={setCityView}
        loadingCityPlots={loadingCityPlots}
        cityPlots={cityPlots}
        isConnected={isConnected}
        resolvedPlotPrice={resolvedPlotPrice}
        ownedPlotIds={ownedPlotIds}
        cityStats={cityStats}
        loadingCityStats={loadingCityStats}
        plotsSold={plotsSold}
        onBackToGalaxy={handleBackToGalaxy}
        onBackToPlanet={handleBackToPlanet}
      />
    );
  }

  // Planet view - shows cities/districts to select
  if (selectedPlanet && !citySlug) {
    const planet = planetsData?.[selectedPlanet] || planetsData?.["sarakt-prime"];
    if (!planet) {
      handleBackToGalaxy();
      return null;
    }
    const octaviaCity = planet.districts?.find((d) => d.name === "Octavia Capital City");
    const zarathisCity = planet.districts?.find((d) => d.name === "Capital city of Zarathis");

    return (
      <SaraktPlanetView
        selectedPlanet={selectedPlanet}
        planet={planet}
        octaviaCity={octaviaCity}
        zarathisCity={zarathisCity}
        isConnected={isConnected}
        managementTab={managementTab}
        onManagementTabChange={setManagementTab}
        backendPlots={backendPlots}
        balance={balance}
        balances={balances}
        gameSymbol={gameSymbol}
        iloStatus={iloStatus}
        plotsSold={plotsSold}
        onBackToGalaxy={handleBackToGalaxy}
        onEnterOctavia={() => goToCity("sarakt-prime", "octavia")}
        onEnterOctaviaManagement={() => {
          setCityView("management");
          goToCity("sarakt-prime", "octavia");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <LazyImage src={heroImage} alt="Cosmic Space" className="w-full h-full object-cover opacity-60" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/35 to-background/60"></div>
          <div className="absolute bottom-0 right-0 w-40 h-16 bg-gradient-to-l from-background via-background/85 to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-gradient-cosmic text-white border-primary text-lg px-6 py-2">
              <Sparkles className="w-5 h-5 mr-2" />
              Genesis Phase Active
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">Chaos Star Universe</h1>
            <p className="text-2xl text-muted-foreground mb-8">
              From ashes to empire: explore the story, seize the land, and command human and AI populations that define your era.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="cosmic"
                onClick={() => navigate("/ilo")}
                size="lg"
                className="gap-2 rounded-full px-10 tracking-[0.08em] uppercase text-sm"
              >
                Get Started
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" />
              </Button>
              <div className="glass border-2 border-accent/50 bg-accent/10 rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg hover:shadow-glow-accent transition-all">
                <div className="p-2 rounded-full bg-accent/20 border border-accent/30">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                    {iloStatus ? (iloStatus.maxParticipants - iloStatus.currentParticipants).toLocaleString() : plotsRemaining.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="text-sm text-muted-foreground">{iloStatus ? iloStatus.maxParticipants.toLocaleString() : "10,000"}</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  participant slots
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppPageShell className="min-h-0 pt-0 bg-transparent" innerClassName="max-w-7xl pb-16">
        {/* UNIFIED UNIVERSE - Galaxy View + Star Map */}
        <div className="space-y-8">
            {/* Galaxy Visualization with Sarakt System Panel */}
            <div className="grid lg:grid-cols-3 gap-6 items-end">
              {/* Galaxy Visualization - Takes 2/3 width */}
              <div className="lg:col-span-2">
                <Card className="glass border-2 border-primary/30 overflow-hidden">
                  <CardContent className="p-0 relative">
                    <div className="bg-black/90 relative h-[min(700px,60vh)] min-h-[320px]">
                      {loadingPlanets ? (
                        <UniverseGalaxySkeleton />
                      ) : (
                        <UniverseVisualization
                          onSelectPlanet={(id) =>
                            id === "sarakt-prime" ? handleEnterOctaviaCapital() : handlePlanetSelect(id)
                          }
                          onSelectCity={(id) =>
                            id === "sarakt-prime" ? handleEnterOctaviaCapital() : handlePlanetSelect(id)
                          }
                        />
                      )}
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Sarakt System Panel - Takes 1/3 width on right */}
              <div className="lg:col-span-1">
                <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden flex flex-col h-[min(700px,60vh)] min-h-[320px]">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-gradient-cosmic text-white text-sm px-3 py-1 w-fit">2 Planets</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => goToSystem(SARAKT_STAR_SYSTEM_ID)}
                        >
                          Explore System
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 overflow-y-auto">
                    {(() => {
                      const data = planetsData || {};
                      const canonical = ["sarakt-prime", "zythera"] as const;
                      const rest = Object.keys(data).filter((k) => !canonical.includes(k as (typeof canonical)[number]));
                      const orderedIds = [...canonical.filter((id) => data[id]), ...rest.sort()];
                      return orderedIds;
                    })().map((id) => {
                      const planet = planetsData?.[id];
                      if (!planet) return null;
                      return (
                        <Card
                          key={id}
                          className={cn(
                            "border-primary/10 hover:border-primary hover:shadow-glow-accent transition-all cursor-pointer group",
                            id === "sarakt-prime" && "border-primary/40 ring-1 ring-primary/20",
                          )}
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
                                <p className="text-sm font-bold">{(planet.population || 0).toLocaleString()}k</p>
                              </div>
                              <div className="glass p-1.5 rounded">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <MapPin className="w-2.5 h-2.5 text-primary" />
                                  <span className="text-[10px] text-muted-foreground">Map</span>
                                </div>
                                <p className="text-sm font-bold">{(planet.coverage || 0)}%</p>
                              </div>
                            </div>
                            <Button
                              variant="cosmic"
                              size="sm"
                              className="w-full h-8 text-[11px] gap-1 rounded-lg tracking-wide uppercase group-hover:shadow-[0_1px_0_0_rgba(255,255,255,0.16)_inset,0_0_0_1px_rgba(232,220,180,0.12)_inset,0_8px_24px_-6px_hsl(268_65%_44%_/_0.35)] transition-[box-shadow,opacity] duration-200"
                            >
                              Select
                              <ArrowRight className="h-2.5 w-2.5 opacity-90" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
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
      </AppPageShell>
    </div>
  );
}
