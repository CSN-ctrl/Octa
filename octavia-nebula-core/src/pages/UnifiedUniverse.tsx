import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skull, Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin, Coins, Factory, Home, ArrowRight, ChevronLeft, Sparkles, Shield, Flame, Droplets, Wind, TreePine, Hammer, Book, Loader2, Network, Wallet, Rocket, Orbit, TrendingUp, ShoppingCart, Briefcase } from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useTreasury } from "@/hooks/useTreasury";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GalaxyVisualization } from "@/components/GalaxyVisualization";
import { Card as UICard } from "@/components/ui/card";
import { fetchPlots, type BackendPlot } from "@/lib/api";
import { OctagonalGrid } from "@/components/OctagonalGrid";
import { useNavigate } from "react-router-dom";

const planetsData = {
  "sarakt-prime": {
    name: "Sarakt Prime",
    status: "Habitable",
    population: 65,
    coverage: 42,
    tier: "Capital",
    color: "primary",
    locked: false,
    description: "Cliff-carved capital overlooking the Sapphire Sea. Vertical architecture, Treasury Tower, xBGL economy hub.",
    districts: [{
      name: "Octavia Capital City",
      plots: 10000,
      price: 75,
      type: "Capital",
      icon: Building2,
      description: "The grand capital city of Octavia, heart of the Sarakt Prime planet. Home to the Treasury Tower, vertical architecture, and the central xBGL economy hub."
    }, {
      name: "District A",
      plots: 423,
      price: 75,
      type: "Residential",
      icon: Home
    }, {
      name: "District B",
      plots: 289,
      price: 68,
      type: "Commercial",
      icon: Factory
    }, {
      name: "District C",
      plots: 356,
      price: 82,
      type: "Industrial",
      icon: Hammer
    }, {
      name: "District D",
      plots: 198,
      price: 65,
      type: "Residential",
      icon: Home
    }, {
      name: "Harbor District",
      plots: 145,
      price: 95,
      type: "Trading",
      icon: Droplets
    }, {
      name: "Mining Tunnels",
      plots: 234,
      price: 55,
      type: "Resource",
      icon: Mountain
    }],
    features: ["Treasury Tower", "Vertical Architecture", "Sapphire Sea Access", "Underground Mines"]
  },
  "zythera": {
    name: "Zythera",
    status: "Isolated",
    population: 12,
    coverage: 8,
    tier: "Frontier",
    color: "destructive",
    locked: false,
    description: "Bioluminescent nanofiber ecosystem. Black market research, ShadowCoin trades, chaotic frontier.",
    districts: [{
      name: "Research Outpost Alpha",
      plots: 89,
      price: 120,
      type: "Research",
      icon: Book
    }, {
      name: "Nanofiber Web Zone",
      plots: 156,
      price: 95,
      type: "Experimental",
      icon: Sparkles
    }, {
      name: "Underground Labs",
      plots: 67,
      price: 140,
      type: "Science",
      icon: Zap
    }, {
      name: "Black Market Hub",
      plots: 203,
      price: 110,
      type: "Trading",
      icon: Shield
    }],
    features: ["Nanofiber Web", "Bioluminescent Flora", "Black Market", "Chaos Energy"]
  }
};

export default function UnifiedUniverse() {
  const navigate = useNavigate();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityView, setCityView] = useState<"info" | "grid" | "management">("info");
  const { plotsSold, totalPlots, plotsRemaining, loading: plotsLoading, priceInAVAX, buyPlotPhase1AVAX } = useLandPlots();
  const { balances, loading: treasuryLoading } = useTreasury();
  const { address, signer, isConnected, connect, balance } = useWallet();
  const {
    starSystems,
    userStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
    spawnStarSystem,
    spawnPlanet,
    loading: forgeLoading,
    fetchStarSystems
  } = useCelestialForge();
  const [starSystemName, setStarSystemName] = useState("");
  const [tributePercent, setTributePercent] = useState(5);
  const [planetName, setPlanetName] = useState("");
  const [selectedStarSystem, setSelectedStarSystem] = useState<string>("");
  const [planetType, setPlanetType] = useState<"habitable" | "resource" | "research" | "military">("habitable");
  const [selectedBody, setSelectedBody] = useState<null | { id: "star" | "octavia" | "zythera"; position: { x: number; y: number; z: number }; radius?: number }>(null);
  const [backendPlots, setBackendPlots] = useState<BackendPlot[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [managementTab, setManagementTab] = useState<"assets" | "plots" | "income" | "settings">("assets");
  const [cityPlots, setCityPlots] = useState<any[]>([]);
  const [loadingCityPlots, setLoadingCityPlots] = useState(false);

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
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [address]);

  // Generate and load city plots when city is selected
  useEffect(() => {
    if (!selectedPlanet || !selectedCity) {
      setCityPlots([]);
      return;
    }

    const planet = planetsData[selectedPlanet];
    const city = planet.districts?.find((d, idx) => `city-${idx}` === selectedCity);
    if (!city) {
      setCityPlots([]);
      return;
    }

    const generatePlots = async () => {
      const plots = [];
      const totalPlots = 10000; // Total available plots
      
      // Try to fetch real plot data
      try {
        if (address) {
          const backendPlotsData = await fetchPlots(address);
          const ownedPlotIds = new Set(backendPlotsData.map(p => {
            const id = typeof p.token_id === "string" ? parseInt(p.token_id) : p.token_id;
            return id;
          }));
          
          for (let i = 1; i <= totalPlots; i++) {
            const isOwned = ownedPlotIds.has(i);
            plots.push({
              id: i,
              x: 0, // Will be positioned by grid
              y: 0, // Will be positioned by grid
              type: city.type.toLowerCase(),
              owner: isOwned ? address : undefined,
              ownerName: isOwned ? "You" : undefined,
              building: isOwned && i % 5 === 0 ? "Building" : undefined,
              occupied: isOwned && i % 4 === 0,
            });
          }
        } else {
          // Generate sample data if not connected
          for (let i = 1; i <= totalPlots; i++) {
            plots.push({
              id: i,
              x: 0,
              y: 0,
              type: city.type.toLowerCase(),
              owner: i % 100 === 0 ? `0x${Math.random().toString(16).slice(2, 42)}` : undefined,
              ownerName: i % 100 === 0 ? `Owner${i}` : undefined,
              building: i % 200 === 0 ? "Building" : undefined,
              occupied: i % 150 === 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching plots:", error);
        // Fallback to sample data
        for (let i = 1; i <= totalPlots; i++) {
          plots.push({
            id: i,
            x: 0,
            y: 0,
            type: city.type.toLowerCase(),
            owner: i % 100 === 0 ? `0x${Math.random().toString(16).slice(2, 42)}` : undefined,
            ownerName: i % 100 === 0 ? `Owner${i}` : undefined,
            building: i % 200 === 0 ? "Building" : undefined,
            occupied: i % 150 === 0,
          });
        }
      }
      
      return plots;
    };

    setLoadingCityPlots(true);
    generatePlots().then(plots => {
      setCityPlots(plots);
      setLoadingCityPlots(false);
    });
  }, [selectedCity, address, selectedPlanet]);

  const handlePlanetSelect = (planetId: string) => {
    const planet = planetsData[planetId];
    if (!planet.locked) {
      setSelectedPlanet(planetId);
      setSelectedCity(null); // Reset city selection when planet changes
      // Scroll to top when planet is selected
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fetch star systems on mount
  useEffect(() => {
    fetchStarSystems();
  }, [fetchStarSystems]);

  // City view - shows city info, grid, and management
  if (selectedPlanet && selectedCity) {
    const planet = planetsData[selectedPlanet];
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
              <TabsTrigger value="info">City Info</TabsTrigger>
              <TabsTrigger value="grid">City Grid</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            {/* City Info Tab */}
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
                        <div className="text-2xl font-bold">{city.plots}</div>
                      </div>
                      <div className="glass p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Price per Plot</div>
                        <div className="text-2xl font-bold text-primary">{city.price} xBGL</div>
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
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Occupancy</span>
                        <span className="font-bold">68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Development</span>
                        <span className="font-bold">42%</span>
                      </div>
                      <Progress value={42} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Revenue (Monthly)</span>
                        <span className="font-bold">1,240 xBGL</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* City Grid Tab */}
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
                  onPlotClick={(plot) => {
                    console.log("Plot clicked:", plot);
                  }}
                  onPlotSelect={(plot) => {
                    console.log("Plot selected:", plot);
                  }}
                  onPurchase={async (plotId: number) => {
                    try {
                      await buyPlotPhase1AVAX(plotId);
                    } catch (error) {
                      // Error handling is done in the hook
                      throw error;
                    }
                  }}
                />
              )}
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Build Structures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Construct buildings and infrastructure on your plots</p>
                    <Button variant="cosmic" className="w-full">Manage Buildings</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Assign Workers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Manage NPC workers and assignments</p>
                    <Button variant="cosmic" className="w-full">Manage Workers</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      Economy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">View revenue, taxes, and economic data</p>
                    <Button variant="cosmic" className="w-full">View Economy</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Governance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Set policies and manage city rules</p>
                    <Button variant="cosmic" className="w-full">Manage Policies</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Marketplace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Buy and sell plots and assets</p>
                    <Button variant="cosmic" className="w-full">Open Marketplace</Button>
                  </CardContent>
                </Card>
                <Card className="glass border-primary/20 hover:border-primary transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">View detailed city analytics and reports</p>
                    <Button variant="cosmic" className="w-full">View Analytics</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Planet view - shows cities/districts to select
  if (selectedPlanet) {
    const planet = planetsData[selectedPlanet];
    // Only show Octavia Capital City as selectable
    const octaviaCity = planet.districts?.find(d => d.name === "Octavia Capital City");
    const octaviaCityIndex = planet.districts?.findIndex(d => d.name === "Octavia Capital City") ?? -1;
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

        {/* City Selection - Only Octavia Capital City */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {octaviaCity && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-4xl font-bold mb-2">Octavia Capital City</h2>
                  <p className="text-muted-foreground">The grand capital city - your gateway to land ownership</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {octaviaCity.plots.toLocaleString()} Total Plots
                </Badge>
              </div>
              <Card
                className="glass border-primary/30 hover:border-primary hover:shadow-glow-accent transition-all group cursor-pointer"
                onClick={() => {
                  if (octaviaCityIndex >= 0) {
                    setSelectedCity(`city-${octaviaCityIndex}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-colors">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <Badge variant="default" className="bg-gradient-cosmic text-white">Capital City</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{octaviaCity.name}</CardTitle>
                  {octaviaCity.description && (
                    <p className="text-muted-foreground">{octaviaCity.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Available Plots</p>
                      <p className="text-2xl font-bold">{octaviaCity.plots.toLocaleString()}</p>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Price per Plot</p>
                      <p className="text-2xl font-bold text-primary">{octaviaCity.price} xBGL</p>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Your Plots</p>
                      <p className="text-2xl font-bold text-accent">{ownedPlotsCount}</p>
                    </div>
                  </div>
                  <Button variant="cosmic" className="w-full gap-2 group-hover:shadow-glow-accent transition-all text-lg py-6">
                    Enter Octavia Capital City <ArrowRight className="h-5 w-5" />
                  </Button>
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
            <div className="flex gap-4 justify-center">
              <Badge variant="outline" className="text-lg px-6 py-3">
                <Users className="w-5 h-5 mr-2" />
                {plotsSold} Citizens
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-3">
                <MapPin className="w-5 h-5 mr-2" />
                {totalPlots.toLocaleString()} Plots
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-3">
                <Coins className="w-5 h-5 mr-2" />
                Live Treasury
              </Badge>
            </div>
            <div className="mt-6 flex justify-center">
              <a
                href="/digital-id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
              >
                Apply for Citizenship
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        <Tabs defaultValue="universe" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1">
            <TabsTrigger value="universe" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white text-lg py-4">
              <Orbit className="w-5 h-5 mr-2" />
              Universe Map
            </TabsTrigger>
            <TabsTrigger value="forge" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white text-lg py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              Celestial Forge
            </TabsTrigger>
          </TabsList>

          {/* UNIFIED UNIVERSE TAB - Galaxy View + Star Map */}
          <TabsContent value="universe" className="space-y-8">
            {/* Galaxy Visualization with Sarakt System Panel */}
            <div className="grid lg:grid-cols-3 gap-6 items-end">
              {/* Galaxy Visualization - Takes 2/3 width */}
              <div className="lg:col-span-2">
                <Card className="glass border-2 border-primary/30 overflow-hidden">
                  <CardContent className="p-0 relative">
                    <div className="bg-black/90 relative" style={{ height: '700px' }}>
                      <GalaxyVisualization
                        systemProgress={starSystems.length / 10}
                        octaviaProgress={planetsData["sarakt-prime"].population / 100}
                        zytheraProgress={planetsData["zythera"].population / 100}
                        onSelect={(id, info) => setSelectedBody({ id, position: info.position, radius: info.radius })}
                      />
                      {selectedBody && (
                        <div className="absolute bottom-4 right-4 pointer-events-auto">
                          <div className="glass border border-primary/30 rounded-lg p-4 w-[320px]">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-lg font-bold capitalize">
                                {selectedBody.id === 'star' ? 'Sarakt Star System' : selectedBody.id}
                              </div>
                              <Badge variant="outline">Control Panel</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-3">
                              Pos: {selectedBody.position.x.toFixed(2)}, {selectedBody.position.y.toFixed(2)}, {selectedBody.position.z.toFixed(2)}
                              {selectedBody.radius ? <> • Orbit r={selectedBody.radius}</> : null}
                            </div>
                            {selectedBody.id !== 'star' ? (
                              <div className="space-y-2">
                                <Button variant="glass" className="w-full">Center Camera</Button>
                                <Button variant="cosmic" className="w-full">Track Orbit</Button>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button variant="outline">Details</Button>
                                  <Button variant="outline">Manage</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Button variant="glass" className="w-full">Center System</Button>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button variant="outline">Lore</Button>
                                  <Button variant="outline">Telemetry</Button>
                                </div>
                              </div>
                            )}
                            <div className="pt-3">
                              <Button variant="secondary" size="sm" className="w-full" onClick={() => setSelectedBody(null)}>
                                Close
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Overlay Info Cards */}
                    <div className="absolute top-4 left-4 right-4 flex flex-col gap-4 pointer-events-none">
                      <div className="glass border border-primary/30 p-4 backdrop-blur-xl pointer-events-auto">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/20 border border-primary">
                            <Orbit className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Sarakt Galaxy</h3>
                            <p className="text-xs text-muted-foreground">100,000 particle spiral • Multi-subnet universe</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-muted-foreground">• Each star system = blockchain subnet</span>
                          <span className="text-muted-foreground">• Each planet = node on subnet</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Stats Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-xs font-semibold">Sarakt Star</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Progress: {Math.round((starSystems.length / 10) * 100)}%</p>
                        </div>
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-xs font-semibold">Octavia</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Pop: {planetsData["sarakt-prime"].population}k</p>
                        </div>
                        <div className="glass border border-primary/30 p-3 backdrop-blur-xl pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-xs font-semibold">Zythera</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Pop: {planetsData["zythera"].population}k</p>
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
                          <p className="text-xs text-muted-foreground">{starSystems.length} active</p>
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
                          <Badge variant="outline" className="text-xs">Primary Network • Bulgarian Subnet</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">Humanity's stronghold. Advanced infrastructure, vertical cities, hybrid companions.</p>
                      <Badge className="bg-gradient-cosmic text-white text-sm px-3 py-1 w-fit">2 Planets</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 overflow-y-auto">
                    {["sarakt-prime", "zythera"].map(id => {
                      const planet = planetsData[id];
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
                <p className="text-3xl font-bold">5,247</p>
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
                <p className="text-3xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">xBGL & SC</p>
              </Card>
              <Card className="glass p-6 border-primary/20">
                <div className="flex items-center gap-2 text-xl font-bold mb-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Worlds
                </div>
                <p className="text-3xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">Planets & hubs</p>
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

            {/* User-Created Star Systems */}
            {userStarSystems.length > 0 && (
              <Card className="border-accent/20 bg-card/50 backdrop-blur overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                        <Rocket className="w-10 h-10 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-4xl mb-2">Your Star Systems</CardTitle>
                        <p className="text-muted-foreground">Avalanche subnets you've deployed</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">
                      {userStarSystems.length} System{userStarSystems.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userStarSystems.map((system) => (
                      <Card
                        key={system.id}
                        className="border-accent/10 hover:border-accent hover:shadow-glow-accent transition-all cursor-pointer group"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-3">
                            <Badge 
                              variant={system.status === 'active' ? 'default' : 'outline'}
                              className="text-sm capitalize"
                            >
                              {system.status}
                            </Badge>
                            {system.chain_id && (
                              <Badge variant="outline" className="text-xs font-mono">
                                #{system.chain_id}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-2xl">{system.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-xs text-muted-foreground truncate">
                            {system.subnet_id || "Deploying subnet..."}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Globe className="w-4 h-4 text-accent" />
                                <span className="text-xs text-muted-foreground">Planets</span>
                              </div>
                              <p className="text-xl font-bold">{system.planets?.length || 0}</p>
                            </div>
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Coins className="w-4 h-4 text-accent" />
                                <span className="text-xs text-muted-foreground">Treasury</span>
                              </div>
                              <p className="text-sm font-bold">
                                {system.treasury_balance?.AVAX || 0} AVAX
                              </p>
                            </div>
                          </div>
                          {system.rpc_url && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              <strong>RPC:</strong> {system.rpc_url.substring(0, 40)}...
                            </div>
                          )}
                          <Button variant="cosmic" className="w-full gap-2 group-hover:shadow-glow-accent transition-all">
                            Manage System <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* CELESTIAL FORGE TAB - Internal Universe Constructor */}
          <TabsContent value="forge" className="space-y-8">
            {/* Forge Header */}
            <Card className="glass p-6 border-2 border-primary/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/20 border-2 border-primary animate-pulse">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-bold">Celestial Forge</h2>
                    <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">
                      <Rocket className="h-5 h-5 mr-2 inline" />
                      Operational
                    </Badge>
                  </div>
                  <p className="text-lg text-muted-foreground mb-3">
                    Internal universe provisioning engine • Build star systems, deploy planets, bootstrap economies
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>• Create new Avalanche subnets</span>
                    <span>• Spawn master node planets</span>
                    <span>• Initialize NPC logic & resources</span>
                    <span>• Register into universe index</span>
                  </div>
                </div>
              </div>
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                <p className="text-sm">
                  <strong>You are the cloud.</strong> The Forge is your internal provisioning engine. 
                  When you forge a world, you allocate blockchain resources, deploy contracts, bootstrap economies, 
                  and drop living simulations into existence. No external dependencies.
                </p>
              </div>
              {!isConnected ? (
                <div className="text-center py-12">
                  <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-xl font-bold mb-2">Connect Wallet Required</h4>
                  <p className="text-muted-foreground mb-6">
                    Connect your wallet to access the Celestial Forge
                  </p>
                  <Button variant="cosmic" onClick={() => connect()}>
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Star System Spawner */}
                  <div className="border border-primary/30 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Globe className="h-6 w-6 text-primary" />
                          Spawn Star System
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Deploy a new Avalanche subnet with its own economy
                        </p>
                      </div>
                      <Badge variant="outline" className="text-primary">
                        {STAR_SYSTEM_COST.toLocaleString()} AVAX
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Star System Name</label>
                        <Input
                          placeholder="e.g., Nova Centauri"
                          value={starSystemName}
                          onChange={(e) => setStarSystemName(e.target.value)}
                          className="glass"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Tribute to Sarakt (%) • {tributePercent}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={tributePercent}
                          onChange={(e) => setTributePercent(Number(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Treasury contribution to Sarakt Star System
                        </p>
                      </div>
                      <Button
                        variant="cosmic"
                        className="w-full"
                        disabled={forgeLoading || !starSystemName || starSystemName.length < 3}
                        onClick={async () => {
                          try {
                            await spawnStarSystem(starSystemName, tributePercent);
                            setStarSystemName("");
                            setTributePercent(5);
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                      >
                        {forgeLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Spawning...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Spawn Star System
                          </>
                        )}
                      </Button>
                      <div className="bg-primary/10 border border-primary/30 rounded p-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Note:</strong> Spawning a star system creates a new Avalanche subnet
                          tied to the primary network. Deployment takes 10-15 minutes. Your wallet balance: {parseFloat(balance).toFixed(2)} AVAX
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Planet Spawner */}
                  {userStarSystems.length > 0 && (
                    <div className="border border-accent/30 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Mountain className="h-6 w-6 text-accent" />
                            Spawn Planet
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Deploy a master node in your star system
                          </p>
                        </div>
                        <Badge variant="outline" className="text-accent">
                          {PLANET_COST.toLocaleString()} AVAX
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Star System</label>
                          <select
                            className="w-full glass p-2 rounded border border-muted"
                            value={selectedStarSystem}
                            onChange={(e) => setSelectedStarSystem(e.target.value)}
                          >
                            <option value="">Choose a star system...</option>
                            {userStarSystems.map((sys) => (
                              <option key={sys.id} value={sys.id}>
                                {sys.name} ({sys.planets?.length || 0} planets)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Planet Name</label>
                          <Input
                            placeholder="e.g., Terra Nova"
                            value={planetName}
                            onChange={(e) => setPlanetName(e.target.value)}
                            className="glass"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Planet Type</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["habitable", "resource", "research", "military"] as const).map((type) => (
                              <Button
                                key={type}
                                variant={planetType === type ? "default" : "outline"}
                                className="capitalize"
                                onClick={() => setPlanetType(type)}
                              >
                                {type}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="cosmic"
                          className="w-full"
                          disabled={forgeLoading || !planetName || !selectedStarSystem}
                          onClick={async () => {
                            try {
                              await spawnPlanet(selectedStarSystem, planetName, planetType);
                              setPlanetName("");
                              setSelectedStarSystem("");
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                        >
                          {forgeLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Spawning...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-4 w-4 mr-2" />
                              Spawn Planet
                            </>
                          )}
                        </Button>
                        <div className="bg-accent/10 border border-accent/30 rounded p-3">
                          <p className="text-xs text-muted-foreground">
                            <strong>Note:</strong> Spawning a planet deploys a master node validator
                            in your star system's subnet. Synchronization takes 5-10 minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forge Success Summary */}
                  {userStarSystems.length > 0 && (
                    <Card className="bg-primary/10 border-primary/30 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <h4 className="text-xl font-bold">Forged Creations</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Star Systems</p>
                          <p className="text-3xl font-bold text-primary">{userStarSystems.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Planets</p>
                          <p className="text-3xl font-bold text-primary">
                            {userStarSystems.reduce((sum, sys) => sum + (sys.planets?.length || 0), 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Active Subnets</p>
                          <p className="text-3xl font-bold text-primary">
                            {userStarSystems.filter(sys => sys.status === 'active').length}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        View all your creations in the <strong>Star Map</strong> tab
                      </p>
                    </Card>
                  )}

                  {userStarSystems.length === 0 && (
                    <Card className="bg-muted/30 border-muted p-8 text-center">
                      <Rocket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="text-xl font-bold mb-2">Ready to Forge</h4>
                      <p className="text-muted-foreground mb-4">
                        You haven't created any star systems yet. Spawn your first universe above!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cost: {STAR_SYSTEM_COST.toLocaleString()} AVAX for subnet deployment
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
