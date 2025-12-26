import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Building2, MapPin, Users, Coins, TrendingUp, Settings, Edit, 
  Eye, Loader2, Globe, Network, Home, Factory, ShoppingBag,
  Plus, RefreshCw, Save, X
} from "lucide-react";
import { useCities, useCityActions } from "@/hooks/useChaosstar";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";

export default function CityPage() {
  const { address } = useWallet();
  const { cities, loading: citiesLoading, refresh: refreshCities } = useCities();
  const { createCity, updateEconomy, loading: cityActionsLoading } = useCityActions();
  
  const [activeTab, setActiveTab] = useState<"overview" | "octavia" | "zythera">("overview");
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [viewingCity, setViewingCity] = useState<any | null>(null);
  const [economyForm, setEconomyForm] = useState({
    tax_rate: 5,
    resource_allocation: {
      agriculture: 25,
      industry: 25,
      commerce: 25,
      research: 25,
    },
  });

  // Default cities data
  const defaultCities = [
    {
      id: "octavia-capital",
      name: "Octavia Capital City",
      planet: "Sarakt Prime",
      location: { x: 0, y: 0 },
      population: 0,
      tax_rate: 5,
      treasury: "0",
      description: "The grand capital city of Octavia, heart of the Sarakt Prime planet. Home to the Treasury Tower, vertical architecture, and the central xBGL economy hub.",
      features: ["Treasury Tower", "Vertical Architecture", "Sapphire Sea Access", "Underground Mines"],
      resource_allocation: {
        agriculture: 20,
        industry: 30,
        commerce: 35,
        research: 15,
      },
      status: "active",
    },
    {
      id: "zarathis-capital",
      name: "Zarathis",
      planet: "Zythera",
      location: { x: 0, y: 0 },
      population: 0,
      tax_rate: 5,
      treasury: "0",
      description: "The notorious black market capital of Zythera. A lawless frontier city where ShadowCoin flows freely and nanofiber tech deals are made in the shadows.",
      features: ["Black Market", "Nanofiber Web", "Bioluminescent Flora", "Chaos Energy"],
      resource_allocation: {
        agriculture: 10,
        industry: 20,
        commerce: 50,
        research: 20,
      },
      status: "active",
    },
  ];

  // Merge default cities with fetched cities
  const allCities = [...defaultCities, ...(cities || [])].filter((city, index, self) =>
    index === self.findIndex(c => c.id === city.id || c.name === city.name)
  );

  useEffect(() => {
    refreshCities();
  }, [refreshCities]);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Cities
          </h1>
          <p className="text-muted-foreground">
            Manage and explore cities across the universe
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "octavia" | "zythera")} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="octavia">Octavia Capital</TabsTrigger>
            <TabsTrigger value="zythera">Zarathis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allCities.map((city) => (
                <Card key={city.id} className="glass hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {city.name}
                        </CardTitle>
                        <CardDescription>
                          {city.planet} • Location: ({city.location?.x || 0}, {city.location?.y || 0})
                        </CardDescription>
                      </div>
                      <Badge variant={city.status === "active" ? "default" : "outline"} className="capitalize">
                        {city.status || "active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Population</div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{city.population?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Tax Rate</div>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{city.tax_rate || 5}%</span>
                        </div>
                      </div>
                    </div>

                    {city.features && city.features.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Features</div>
                        <div className="flex flex-wrap gap-2">
                          {city.features.map((feature: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setViewingCity(city);
                          if (city.name === "Octavia Capital City") {
                            setActiveTab("octavia");
                          } else if (city.name === "Zarathis") {
                            setActiveTab("zythera");
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingCity(city);
                          setEconomyForm({
                            tax_rate: city.tax_rate || 5,
                            resource_allocation: city.resource_allocation || {
                              agriculture: 25,
                              industry: 25,
                              commerce: 25,
                              research: 25,
                            },
                          });
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Statistics */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  City Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Total Cities</div>
                    <div className="text-2xl font-bold">{allCities.length}</div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Total Population</div>
                    <div className="text-2xl font-bold">
                      {allCities.reduce((sum, c) => sum + (c.population || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Average Tax Rate</div>
                    <div className="text-2xl font-bold">
                      {allCities.length > 0 
                        ? Math.round(allCities.reduce((sum, c) => sum + (c.tax_rate || 5), 0) / allCities.length)
                        : 0}%
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Active Cities</div>
                    <div className="text-2xl font-bold">
                      {allCities.filter(c => c.status === "active").length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Octavia Capital City Tab */}
          <TabsContent value="octavia" className="space-y-6">
            {(() => {
              const city = allCities.find(c => c.name === "Octavia Capital City") || defaultCities[0];
              return (
                <CityManagementView 
                  city={city}
                  onEdit={() => {
                    setEditingCity(city);
                    setEconomyForm({
                      tax_rate: city.tax_rate || 5,
                      resource_allocation: city.resource_allocation || {
                        agriculture: 20,
                        industry: 30,
                        commerce: 35,
                        research: 15,
                      },
                    });
                  }}
                />
              );
            })()}
          </TabsContent>

          {/* Zarathis Tab */}
          <TabsContent value="zythera" className="space-y-6">
            {(() => {
              const city = allCities.find(c => c.name === "Zarathis") || defaultCities[1];
              return (
                <CityManagementView 
                  city={city}
                  onEdit={() => {
                    setEditingCity(city);
                    setEconomyForm({
                      tax_rate: city.tax_rate || 5,
                      resource_allocation: city.resource_allocation || {
                        agriculture: 10,
                        industry: 20,
                        commerce: 50,
                        research: 20,
                      },
                    });
                  }}
                />
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Edit City Economy Dialog */}
        <Dialog open={!!editingCity} onOpenChange={(open) => !open && setEditingCity(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage City Economy</DialogTitle>
              <DialogDescription>
                Configure tax rates and resource allocation for {editingCity?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={economyForm.tax_rate}
                  onChange={(e) => setEconomyForm({ ...economyForm, tax_rate: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Tax rate applied to all transactions in the city (0-100%)</p>
              </div>

              <div className="space-y-3">
                <Label>Resource Allocation (%)</Label>
                <div className="space-y-3">
                  {Object.entries(economyForm.resource_allocation).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key}</span>
                        <span>{value}%</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          const current = economyForm.resource_allocation;
                          setEconomyForm({
                            ...economyForm,
                            resource_allocation: {
                              ...current,
                              [key]: newValue,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {Object.values(economyForm.resource_allocation).reduce((a, b) => a + b, 0)}%
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCity(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingCity) return;
                  try {
                    await updateEconomy(
                      editingCity.name,
                      address || "0x0000000000000000000000000000000000000000",
                      economyForm.tax_rate
                    );
                    toast.success(`Economy updated for ${editingCity.name}`);
                    setEditingCity(null);
                    refreshCities();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to update economy");
                  }
                }}
                disabled={cityActionsLoading}
              >
                {cityActionsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// City Management View Component
function CityManagementView({ city, onEdit }: { city: any; onEdit: () => void }) {
  return (
    <>
      <Card className="glass border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {city.name}
              </CardTitle>
              <CardDescription className="text-base">
                {city.description}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* City Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Planet</div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {city.planet}
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Population</div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                {city.population?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Tax Rate</div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <Coins className="h-4 w-4" />
                {city.tax_rate || 5}%
              </div>
            </div>
          </div>

          {/* Features */}
          {city.features && city.features.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">City Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {city.features.map((feature: string, idx: number) => (
                  <Card key={idx} className="border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2">
                      {feature.includes("Tower") || feature.includes("Architecture") ? (
                        <Home className="h-4 w-4 text-primary" />
                      ) : feature.includes("Market") || feature.includes("Commerce") ? (
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      ) : feature.includes("Mine") || feature.includes("Industry") ? (
                        <Factory className="h-4 w-4 text-primary" />
                      ) : (
                        <Network className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Resource Allocation */}
          {city.resource_allocation && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">Resource Allocation</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(city.resource_allocation).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1 capitalize">{key}</div>
                    <div className="text-2xl font-bold">{value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm">
                Coordinates: ({city.location?.x || 0}, {city.location?.y || 0})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

