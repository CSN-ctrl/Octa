import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Orbit as PlanetIcon, Sparkles, ShoppingCart, Coins, TrendingUp, Sprout, 
  Search, Filter, ArrowUpDown, Loader2, Globe, Network, Cpu
} from "lucide-react";
import { useRealPlanetStats } from "@/hooks/useRealPlanetStats";
import { listPlanets } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";

export default function PlanetPage() {
  const { address, isConnected, signer } = useWallet();
  const { planets: realPlanetsData, loading: realPlanetsLoading } = useRealPlanetStats();
  const [planets, setPlanets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "created">("name");
  const [activeTab, setActiveTab] = useState<"market" | "planets">("market");
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Fetch planets from API
  useEffect(() => {
    const fetchPlanets = async () => {
      setLoading(true);
      try {
        const result = await listPlanets();
        if (result?.planets && Array.isArray(result.planets)) {
          setPlanets(result.planets);
        } else {
          setPlanets([]);
        }
      } catch (error: any) {
        console.debug("Could not fetch planets:", error);
        setPlanets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanets();
  }, []);

  // Mock market data for planet cores
  const planetCores = [
    {
      id: "core-1",
      name: "Terra Core",
      description: "Habitable planet core optimized for life and growth",
      price: 2000,
      currency: "AVAX",
      features: ["High Habitability", "Rich Resources", "Stable Climate"],
      planetType: "habitable",
      status: "available",
      created: new Date().toISOString(),
    },
    {
      id: "core-2",
      name: "Mining Core",
      description: "Resource extraction planet core with enhanced mining capabilities",
      price: 2500,
      currency: "AVAX",
      features: ["High Yield Mining", "Resource Rich", "Industrial"],
      planetType: "resource",
      status: "available",
      created: new Date().toISOString(),
    },
    {
      id: "core-3",
      name: "Research Core",
      description: "Scientific planet core with advanced research facilities",
      price: 3000,
      currency: "AVAX",
      features: ["Research Labs", "Tech Boost", "Innovation"],
      planetType: "research",
      status: "available",
      created: new Date().toISOString(),
    },
    {
      id: "core-4",
      name: "Fortress Core",
      description: "Military-grade planet core with defensive capabilities",
      price: 3500,
      currency: "AVAX",
      features: ["Defense Systems", "Strategic", "Secure"],
      planetType: "military",
      status: "available",
      created: new Date().toISOString(),
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <PlanetIcon className="h-8 w-8" />
            Planets
          </h1>
          <p className="text-muted-foreground">
            Discover and explore planets across the universe
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "market" | "planets")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="market" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Planet Core Market
            </TabsTrigger>
            <TabsTrigger value="planets" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              My Planets
            </TabsTrigger>
          </TabsList>

          {/* Planet Core Market Tab */}
          <TabsContent value="market" className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-primary" />
                      Planet Core Market
                    </CardTitle>
                    <CardDescription>
                      Purchase pre-configured planet cores to quickly deploy new validator nodes
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {planetCores.length} Cores Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search planet cores..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "name" | "price" | "created")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="price">Sort by Price</option>
                      <option value="created">Sort by Date</option>
                    </select>
                  </div>
                  <Button variant="outline" className="w-full">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </div>

                {/* Planet Cores Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {planetCores
                    .filter(core => 
                      !searchQuery || 
                      core.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      core.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      if (sortBy === "name") return a.name.localeCompare(b.name);
                      if (sortBy === "price") return a.price - b.price;
                      return new Date(a.created).getTime() - new Date(b.created).getTime();
                    })
                    .map((core) => (
                      <Card key={core.id} className="glass hover:border-primary/50 transition-all">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1 flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-primary" />
                                {core.name}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {core.description}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">
                              {core.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Planet Type */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Planet Type</Label>
                            <Badge variant="secondary" className="capitalize">
                              {core.planetType}
                            </Badge>
                          </div>

                          {/* Features */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Features</Label>
                            <div className="flex flex-wrap gap-2">
                              {core.features.map((feature, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <Label className="text-xs text-muted-foreground">Price</Label>
                              <div className="flex items-center gap-1">
                                <Coins className="h-4 w-4 text-yellow-500" />
                                <span className="text-lg font-bold">{core.price.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">{core.currency}</span>
                              </div>
                            </div>
                            <Button
                              onClick={async () => {
                                if (!isConnected || !address || !signer) {
                                  toast.error("Please connect your wallet first");
                                  return;
                                }
                                
                                setPurchasing(core.id);
                                try {
                                  // TODO: Replace with actual contract call when planet core contract is deployed
                                  // For now, simulate purchase
                                  await new Promise(resolve => setTimeout(resolve, 1500));
                                  toast.success(`Successfully purchased ${core.name} core!`);
                                  // Refresh planet list
                                  const result = await listPlanets();
                                  if (result?.planets) {
                                    setPlanets(result.planets);
                                  }
                                } catch (error: any) {
                                  console.error("Purchase failed:", error);
                                  toast.error(`Failed to purchase ${core.name}: ${error.message || "Unknown error"}`);
                                } finally {
                                  setPurchasing(null);
                                }
                              }}
                              disabled={purchasing === core.id || !isConnected}
                              className="bg-gradient-cosmic"
                            >
                              {purchasing === core.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Purchasing...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Purchase Core
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Empty State */}
                {planetCores.filter(core => 
                  !searchQuery || 
                  core.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <Card className="glass border-dashed">
                    <CardContent className="p-12 text-center">
                      <Cpu className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No planet cores found matching your search</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Market Info */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Total Cores</div>
                    <div className="text-2xl font-bold">{planetCores.length}</div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Average Price</div>
                    <div className="text-2xl font-bold">
                      {(planetCores.reduce((sum, c) => sum + c.price, 0) / planetCores.length).toLocaleString()} AVAX
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                    <div className="text-2xl font-bold">
                      {planetCores.reduce((sum, c) => sum + c.price, 0).toLocaleString()} AVAX
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>About Planet Cores:</strong> Cores are pre-configured templates for creating new planets (validator nodes). 
                    Each core includes optimized settings, planet type, and features. After purchase, you can deploy the core as a new planet 
                    within a star system through the Celestial Forge. Planets pay 10% tribute to their star system.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Planets Tab */}
          <TabsContent value="planets" className="space-y-6">
            {loading ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading planets...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {!Array.isArray(planets) || planets.length === 0 ? (
                  <Card className="glass border-dashed col-span-full">
                    <CardContent className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30">
                          <PlanetIcon className="h-12 w-12 text-primary/50" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">No Planets Found</h3>
                          <p className="text-muted-foreground mb-4">
                            Purchase a core from the Planet Core Market or create a custom planet
                          </p>
                          <Button
                            onClick={() => setActiveTab("market")}
                            variant="outline"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Browse Market
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  planets.map((planet: any) => (
                    <Card key={planet.id} className="glass hover:border-primary/50 transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PlanetIcon className="h-5 w-5 text-primary" />
                          {planet.name || "Unnamed Planet"}
                        </CardTitle>
                        <CardDescription>
                          {planet.star_system_id ? `Star System: ${planet.star_system_id.slice(0, 8)}...` : "No star system"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Type</span>
                          <Badge variant="outline" className="capitalize">
                            {planet.planet_type || "habitable"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={planet.status === "active" ? "default" : "outline"} className="capitalize">
                            {planet.status || "deploying"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Node Type</span>
                          <span className="font-semibold capitalize">{planet.node_type || "master"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

