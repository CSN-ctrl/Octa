import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Skull, Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin, 
  Coins, Factory, Home, ArrowRight, ChevronLeft, Sparkles, Shield, 
  Flame, Droplets, Wind, TreePine, Hammer, Book
} from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";

const planetsData = {
  "sarakt-prime": {
    name: "Sarakt Prime",
    status: "Habitable",
    population: 65,
    coverage: 42,
    tier: "Capital",
    color: "primary",
    description: "Cliff-carved capital overlooking the Sapphire Sea. Vertical architecture, Treasury Tower, xBGL economy hub.",
    districts: [
      { name: "District A", plots: 423, price: 75, type: "Residential", icon: Home },
      { name: "District B", plots: 289, price: 68, type: "Commercial", icon: Factory },
      { name: "District C", plots: 356, price: 82, type: "Industrial", icon: Hammer },
      { name: "District D", plots: 198, price: 65, type: "Residential", icon: Home },
      { name: "Harbor District", plots: 145, price: 95, type: "Trading", icon: Droplets },
      { name: "Mining Tunnels", plots: 234, price: 55, type: "Resource", icon: Mountain }
    ],
    features: ["Treasury Tower", "Vertical Architecture", "Sapphire Sea Access", "Underground Mines"]
  },
  "zythera": {
    name: "Zythera",
    status: "Isolated",
    population: 12,
    coverage: 8,
    tier: "Frontier",
    color: "destructive",
    description: "Bioluminescent nanofiber ecosystem. Black market research, ShadowCoin trades, chaotic frontier.",
    districts: [
      { name: "Research Outpost Alpha", plots: 89, price: 120, type: "Research", icon: Book },
      { name: "Nanofiber Web Zone", plots: 156, price: 95, type: "Experimental", icon: Sparkles },
      { name: "Underground Labs", plots: 67, price: 140, type: "Science", icon: Zap },
      { name: "Black Market Hub", plots: 203, price: 110, type: "Trading", icon: Shield }
    ],
    features: ["Nanofiber Web", "Bioluminescent Flora", "Black Market", "Chaos Energy"]
  },
  "nexus-hub": {
    name: "Nexus Hub",
    status: "Trading Center",
    population: 88,
    coverage: 91,
    tier: "Commercial",
    color: "accent",
    description: "Primary commerce node. Multi-species marketplace, diplomatic quarters, high-frequency trading.",
    districts: [
      { name: "Central Market", plots: 512, price: 125, type: "Commercial", icon: Factory },
      { name: "Diplomatic Quarter", plots: 234, price: 150, type: "Governance", icon: Shield },
      { name: "Trade Docks", plots: 389, price: 110, type: "Trading", icon: Droplets }
    ],
    features: ["Multi-Species Hub", "Diplomatic Center", "High-Frequency Trading", "Transit Node"]
  },
  "nexus-port": {
    name: "Nexus Port",
    status: "Shipping Hub",
    population: 45,
    coverage: 52,
    tier: "Logistics",
    color: "secondary",
    description: "Logistics center. Cargo processing, ship maintenance, customs enforcement.",
    districts: [
      { name: "Cargo Terminal", plots: 445, price: 85, type: "Industrial", icon: Hammer },
      { name: "Ship Yards", plots: 267, price: 95, type: "Manufacturing", icon: Factory },
      { name: "Customs District", plots: 178, price: 75, type: "Governance", icon: Shield }
    ],
    features: ["Cargo Processing", "Ship Maintenance", "Customs Enforcement", "Warehouse Complex"]
  },
  "nexus-depot": {
    name: "Nexus Depot",
    status: "Coming Soon",
    locked: true,
    tier: "Storage",
    color: "muted",
    description: "Future storage facility. Strategic reserves, cold storage, warehouse districts."
  },
  "nexus-colony": {
    name: "Nexus Colony",
    status: "Coming Soon",
    locked: true,
    tier: "Settlement",
    color: "muted",
    description: "Planned settlement. Agricultural domes, residential sectors, terraforming projects."
  }
};

export default function UnifiedUniverse() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const handlePlanetSelect = (planetId: string) => {
    const planet = planetsData[planetId];
    if (!planet.locked) {
      setSelectedPlanet(planetId);
    }
  };

  if (selectedPlanet) {
    const planet = planetsData[selectedPlanet];
    
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Button 
            variant="glass" 
            className="mb-8 gap-2"
            onClick={() => setSelectedPlanet(null)}
          >
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
                    <Card key={idx} className="glass border-primary/30 hover:border-primary hover:shadow-glow-accent transition-all group">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="relative h-[500px] overflow-hidden mb-16">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Cosmic Space" className="w-full h-full object-cover opacity-40"/>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-gradient-cosmic text-white border-primary text-lg px-6 py-2">
              <Sparkles className="w-5 h-5 mr-2" />
              Genesis Phase Active
            </Badge>
            <h1 className="text-8xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
              Octavia Universe
            </h1>
            <p className="text-2xl text-muted-foreground mb-8">
              From rebellion to renaissance. Explore lore, claim land, build empires.
            </p>
            <div className="flex gap-4 justify-center">
              <Badge variant="outline" className="text-lg px-6 py-3">
                <Users className="w-5 h-5 mr-2" />
                5,247 Citizens
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-3">
                <MapPin className="w-5 h-5 mr-2" />
                10,000 Plots
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-3">
                <Coins className="w-5 h-5 mr-2" />
                2 Currencies
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        <Tabs defaultValue="universe" className="mb-12">
          <TabsList className="grid w-full grid-cols-7 mb-8 h-auto p-1">
            <TabsTrigger value="universe" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Universe
            </TabsTrigger>
            <TabsTrigger value="phases" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Phases
            </TabsTrigger>
            <TabsTrigger value="economy" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Economy
            </TabsTrigger>
            <TabsTrigger value="ancient" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Ancient Era
            </TabsTrigger>
            <TabsTrigger value="cataclysm" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Cataclysm
            </TabsTrigger>
            <TabsTrigger value="modern" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Modern Age
            </TabsTrigger>
            <TabsTrigger value="worlds" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">
              Planets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="universe" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Planets</p>
                      <p className="text-3xl font-bold">6</p>
                    </div>
                    <Globe className="w-10 h-10 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Systems</p>
                      <p className="text-3xl font-bold">2</p>
                    </div>
                    <Sparkles className="w-10 h-10 text-accent opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Districts</p>
                      <p className="text-3xl font-bold">13</p>
                    </div>
                    <Building2 className="w-10 h-10 text-secondary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Locked Worlds</p>
                      <p className="text-3xl font-bold">2</p>
                    </div>
                    <Lock className="w-10 h-10 text-muted-foreground opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sarakt System */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <Globe className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl mb-2">Sarakt System</CardTitle>
                      <p className="text-muted-foreground">Humanity's stronghold. Advanced infrastructure, vertical cities, hybrid companions.</p>
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
                                <Users className="w-4 h-4 text-primary"/>
                                <span className="text-xs text-muted-foreground">Population</span>
                              </div>
                              <p className="text-xl font-bold">{planet.population}k</p>
                            </div>
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-primary"/>
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

            {/* Tanaria System */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <Globe className="w-10 h-10 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl mb-2">Tanaria System</CardTitle>
                      <p className="text-muted-foreground">Strategic trading nexus. Multi-species commerce, diplomatic hub, logistics center.</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">4 Planets</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {["nexus-hub", "nexus-port", "nexus-depot", "nexus-colony"].map(id => {
                    const planet = planetsData[id];
                    return (
                      <Card 
                        key={id} 
                        className={`border-primary/10 ${planet.locked ? 'opacity-60' : 'hover:border-primary hover:shadow-glow-accent cursor-pointer'} transition-all group`}
                        onClick={() => !planet.locked && handlePlanetSelect(id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={planet.locked ? "outline" : "default"} className="text-sm">
                              {planet.status}
                            </Badge>
                            <Badge variant="outline" className="text-sm">{planet.tier}</Badge>
                          </div>
                          <CardTitle className="text-2xl flex items-center gap-2">
                            {planet.locked && <Lock className="w-5 h-5"/>}
                            {planet.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{planet.description}</p>
                          
                          {!planet.locked ? (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="glass p-3 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-primary"/>
                                    <span className="text-xs text-muted-foreground">Population</span>
                                  </div>
                                  <p className="text-xl font-bold">{planet.population}k</p>
                                </div>
                                <div className="glass p-3 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-primary"/>
                                    <span className="text-xs text-muted-foreground">Mapped</span>
                                  </div>
                                  <p className="text-xl font-bold">{planet.coverage}%</p>
                                </div>
                              </div>

                              <Button variant="cosmic" className="w-full gap-2 group-hover:shadow-glow-accent transition-all">
                                Select Planet <ArrowRight className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="glass p-4 rounded-lg text-center">
                              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Unlocks in Phase 2</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases">
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <Home className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl mb-2">Phase 1: Tribal Stage</CardTitle>
                      <Badge className="bg-gradient-cosmic text-white text-lg px-4 py-2">10,000 Plots • Active Now</Badge>
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
          </TabsContent>
                    <TabsContent value="universe" className="space-y-8">
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
          </TabsContent>
                              <TabsContent value="universe" className="space-y-8">
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
          </TabsContent>

          <TabsContent value="worlds" className="space-y-8">
            <h2 className="text-4xl font-bold mb-8">Explore the Planets</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(planetsData).map(([id, planet]) => (
                <Card
                  key={id}
                  onClick={() => handlePlanetSelect(id)}
                  className={`glass cursor-pointer border-primary/30 hover:border-primary hover:shadow-glow-accent transition-all ${
                    planet.locked ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl flex justify-between items-center">
                      {planet.name}
                      {planet.locked && <Lock className="w-5 h-5 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{planet.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Tier</span>
                      <Badge variant="outline">{planet.tier}</Badge>
                    </div>
                    {!planet.locked && (
                      <Button variant="cosmic" className="w-full mt-2 gap-2">
                        View Planet <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
  


