import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skull, Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin, Coins, Factory, Home, ArrowRight, ChevronLeft, Sparkles, Shield, Flame, Droplets, Wind, TreePine, Hammer, Book, Loader2, Network, Wallet, Rocket } from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useTreasury } from "@/hooks/useTreasury";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const { plotsSold, totalPlots, plotsRemaining, loading: plotsLoading } = useLandPlots();
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

  const handlePlanetSelect = (planetId: string) => {
    const planet = planetsData[planetId];
    if (!planet.locked) {
      setSelectedPlanet(planetId);
    }
  };

  // Fetch star systems on mount
  useEffect(() => {
    fetchStarSystems();
  }, [fetchStarSystems]);

  if (selectedPlanet) {
    const planet = planetsData[selectedPlanet];
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Button variant="glass" className="mb-8 gap-2" onClick={() => setSelectedPlanet(null)}>
            <ChevronLeft className="h-4 w-4" />
            Back to Universe
          </Button>
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
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
          {planet.districts && planet.districts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold">Available Districts</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {planet.districts.reduce((sum, d) => sum + d.plots, 0)} Total Plots
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planet.districts.map((district, idx) => {
                  const Icon = district.icon;
                  return (
                    <Card
                      key={idx}
                      className="glass border-primary/30 hover:border-primary hover:shadow-glow-accent transition-all group"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <Badge variant="outline">{district.type}</Badge>
                        </div>
                        <CardTitle className="text-xl">{district.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="glass p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Available</p>
                            <p className="text-xl font-bold">{district.plots}</p>
                          </div>
                          <div className="glass p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Price</p>
                            <p className="text-xl font-bold text-primary">{district.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-muted-foreground">xBGL per plot</span>
                        </div>
                        <Button variant="cosmic" className="w-full gap-2 group-hover:shadow-glow-accent transition-all">
                          View Plots <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        <Tabs defaultValue="starmap" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1">
            <TabsTrigger value="starmap" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white text-lg py-4">
              <Globe className="w-5 h-5 mr-2" />
              Star Map
            </TabsTrigger>
            <TabsTrigger value="forge" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white text-lg py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              Celestial Forge
            </TabsTrigger>
          </TabsList>

          {/* STAR MAP TAB - Universe-Level Navigation & Control */}
          <TabsContent value="starmap" className="space-y-8">
            {/* Star Map Header */}
            <Card className="glass border-2 border-primary/30 p-8 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-primary/20 border-2 border-primary">
                  <Globe className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-2">Galactic Dashboard</h2>
                  <p className="text-lg text-muted-foreground">
                    Multi-subnet admin panel • Navigate star systems, planets, and infrastructure
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>• Each star system = blockchain subnet</span>
                <span>• Each planet = node on subnet</span>
                <span>• Click to drill down into simulations</span>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
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
            {/* Sarakt System */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <Network className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl mb-2">Sarakt System</CardTitle>
                      <Badge variant="outline" className="text-xs">Primary Network • Bulgarian Subnet</Badge>
                      <p className="text-muted-foreground mt-2">Humanity's stronghold. Advanced infrastructure, vertical cities, hybrid companions.</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">2 Planets</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {["sarakt-prime", "zythera"].map(id => {
                    const planet = planetsData[id];
                    return (
                      <Card
                        key={id}
                        className="border-primary/10 hover:border-primary hover:shadow-glow-accent transition-all cursor-pointer group"
                        onClick={() => handlePlanetSelect(id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={planet.status === "Habitable" ? "default" : "destructive"} className="text-sm">
                              {planet.status}
                            </Badge>
                            <Badge variant="outline" className="text-sm">{planet.tier}</Badge>
                          </div>
                          <CardTitle className="text-2xl">{planet.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{planet.description}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground">Population</span>
                              </div>
                              <p className="text-xl font-bold">{planet.population}k</p>
                            </div>
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground">Mapped</span>
                              </div>
                              <p className="text-xl font-bold">{planet.coverage}%</p>
                            </div>
                          </div>
                          <Button variant="cosmic" className="w-full gap-2 group-hover:shadow-glow-accent transition-all">
                            Select Planet <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

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

            {/* All Star Systems Network Visualization - Could integrate InteractiveStarMap here */}
            {starSystems.length > 0 && (
              <Card className="glass p-6 border-primary/20">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Network className="w-6 h-6" />
                    Network Topology
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All star systems across the universe • {starSystems.length} active subnet{starSystems.length !== 1 ? 's' : ''}
                  </p>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-muted-foreground text-center py-8">
                    <p className="mb-2">Interactive 3D star map coming soon</p>
                    <p className="text-xs">View all subnets, planets, and infrastructure topology</p>
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
                  <Button variant="cosmic" onClick={connect}>
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
