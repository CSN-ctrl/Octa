import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Sparkles, ShoppingCart, Coins, TrendingUp, Sprout, 
  Plus, Search, Filter, ArrowUpDown, Loader2, Globe, Network
} from "lucide-react";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";

export default function StarSystemPage() {
  const { address, isConnected, signer } = useWallet();
  const { starSystems, loading } = useCelestialForge();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "created">("name");
  const [activeTab, setActiveTab] = useState<"market" | "systems">("market");
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Mock market data for star system seeds
  const marketSeeds = [
    {
      id: "seed-1",
      name: "Nebula Prime",
      description: "High-performance subnet with optimized consensus",
      price: 10000,
      currency: "AVAX",
      features: ["Fast TPS", "Low Fees", "Custom Token"],
      status: "available",
      created: new Date().toISOString(),
    },
    {
      id: "seed-2",
      name: "Quantum Nexus",
      description: "Advanced subnet with quantum-resistant cryptography",
      price: 15000,
      currency: "AVAX",
      features: ["Quantum Security", "Scalable", "Interoperable"],
      status: "available",
      created: new Date().toISOString(),
    },
    {
      id: "seed-3",
      name: "Stellar Forge",
      description: "Enterprise-grade subnet with governance features",
      price: 20000,
      currency: "AVAX",
      features: ["Governance", "Multi-chain", "Enterprise"],
      status: "available",
      created: new Date().toISOString(),
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <Star className="h-8 w-8" />
            Star Systems
          </h1>
          <p className="text-muted-foreground">
            Explore and manage star systems in the universe
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "market" | "systems")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="market" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Celestial Market
            </TabsTrigger>
            <TabsTrigger value="systems" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              My Star Systems
            </TabsTrigger>
          </TabsList>

          {/* Celestial Market Tab */}
          <TabsContent value="market" className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-primary" />
                      Celestial Market - Star System Seeds
                    </CardTitle>
                    <CardDescription>
                      Purchase pre-configured star system seeds to quickly deploy new subnets
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {marketSeeds.length} Seeds Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search star system seeds..."
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

                {/* Market Seeds Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketSeeds
                    .filter(seed => 
                      !searchQuery || 
                      seed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      seed.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      if (sortBy === "name") return a.name.localeCompare(b.name);
                      if (sortBy === "price") return a.price - b.price;
                      return new Date(a.created).getTime() - new Date(b.created).getTime();
                    })
                    .map((seed) => (
                      <Card key={seed.id} className="glass hover:border-primary/50 transition-all">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                {seed.name}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {seed.description}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">
                              {seed.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Features */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Features</Label>
                            <div className="flex flex-wrap gap-2">
                              {seed.features.map((feature, idx) => (
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
                                <span className="text-lg font-bold">{seed.price.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">{seed.currency}</span>
                              </div>
                            </div>
                            <Button
                              onClick={async () => {
                                if (!isConnected || !address || !signer) {
                                  toast.error("Please connect your wallet first");
                                  return;
                                }
                                
                                setPurchasing(seed.id);
                                try {
                                  // TODO: Replace with actual contract call when star system seed contract is deployed
                                  // For now, simulate purchase
                                  await new Promise(resolve => setTimeout(resolve, 1500));
                                  toast.success(`Successfully purchased ${seed.name} seed!`);
                                  // Refresh star systems list
                                  // Note: This would typically refresh from the contract/API
                                } catch (error: any) {
                                  console.error("Purchase failed:", error);
                                  toast.error(`Failed to purchase ${seed.name}: ${error.message || "Unknown error"}`);
                                } finally {
                                  setPurchasing(null);
                                }
                              }}
                              disabled={purchasing === seed.id || !isConnected}
                              className="bg-gradient-cosmic"
                            >
                              {purchasing === seed.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Purchasing...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Purchase Seed
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Empty State */}
                {marketSeeds.filter(seed => 
                  !searchQuery || 
                  seed.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <Card className="glass border-dashed">
                    <CardContent className="p-12 text-center">
                      <Sprout className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No star system seeds found matching your search</p>
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
                    <div className="text-xs text-muted-foreground mb-1">Total Seeds</div>
                    <div className="text-2xl font-bold">{marketSeeds.length}</div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Average Price</div>
                    <div className="text-2xl font-bold">
                      {(marketSeeds.reduce((sum, s) => sum + s.price, 0) / marketSeeds.length).toLocaleString()} AVAX
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                    <div className="text-2xl font-bold">
                      {marketSeeds.reduce((sum, s) => sum + s.price, 0).toLocaleString()} AVAX
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>About Star System Seeds:</strong> Seeds are pre-configured templates for creating new star systems (Avalanche subnets). 
                    Each seed includes optimized settings, features, and configurations. After purchase, you can deploy the seed as a new star system 
                    through the Celestial Forge.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Star Systems Tab */}
          <TabsContent value="systems" className="space-y-6">
            {loading ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading star systems...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {starSystems.length === 0 ? (
                  <Card className="glass border-dashed col-span-full">
                    <CardContent className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30">
                          <Star className="h-12 w-12 text-primary/50" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">No Star Systems Found</h3>
                          <p className="text-muted-foreground mb-4">
                            Purchase a seed from the Celestial Market or create a custom star system
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
                  starSystems.map((system: any) => (
                    <Card key={system.id} className="glass hover:border-primary/50 transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="h-5 w-5 text-primary" />
                          {system.name}
                        </CardTitle>
                        <CardDescription>
                          {system.subnet_id ? `Subnet: ${system.subnet_id.slice(0, 8)}...` : "No subnet configured"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={system.status === "active" ? "default" : "outline"} className="capitalize">
                            {system.status || "deploying"}
                          </Badge>
                        </div>
                        {system.tribute_percent !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tribute</span>
                            <span className="font-semibold">{system.tribute_percent}%</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Planets</span>
                          <span className="font-semibold">{system.planets?.length || 0}</span>
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

