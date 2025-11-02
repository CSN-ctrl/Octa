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
  "nexus-depot": { name: "Nexus Depot", status: "Coming Soon", locked: true, tier: "Storage", color: "muted", description: "Future storage facility. Strategic reserves, cold storage, warehouse districts." },
  "nexus-colony": { name: "Nexus Colony", status: "Coming Soon", locked: true, tier: "Settlement", color: "muted", description: "Planned settlement. Agricultural domes, residential sectors, terraforming projects." }
};

export default function UnifiedUniverse() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const handlePlanetSelect = (planetId: string) => {
    const planet = planetsData[planetId];
    if (!planet.locked) setSelectedPlanet(planetId);
  };

  if (selectedPlanet) {
    const planet = planetsData[selectedPlanet];
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Button variant="glass" className="mb-8 gap-2" onClick={() => setSelectedPlanet(null)}>
            <ChevronLeft className="h-4 w-4" /> Back to Universe
          </Button>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-6xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">{planet.name}</h1>
                <Badge variant={planet.color === "primary" ? "default" : "destructive"} className="text-lg px-4 py-1">{planet.status}</Badge>
              </div>
              <p className="text-xl text-muted-foreground mb-6">{planet.description}</p>
              <div className="flex flex-wrap gap-2">{planet.features?.map((f, idx) => <Badge key={idx} variant="outline">{f}</Badge>)}</div>
            </div>

            <Card className="glass border-primary/20">
              <CardHeader><CardTitle className="text-2xl">Planet Stats</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Population</span>
                    <span className="font-bold">{planet.population}k</span>
                  </div>
                  <Progress value={planet.population} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Mapped</span>
                    <span className="font-bold">{planet.coverage}%</span>
                  </div>
                  <Progress value={planet.coverage} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Districts</span>
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

          {planet.districts?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold">Available Districts</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">{planet.districts.reduce((sum, d) => sum + d.plots, 0)} Total Plots</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planet.districts.map((d, idx) => {
                  const Icon = d.icon;
                  return (
                    <Card key={idx} className="glass border-primary/30 hover:border-primary hover:shadow-glow-accent transition-all group">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-colors"><Icon className="w-6 h-6 text-primary" /></div>
                          <Badge variant="outline">{d.type}</Badge>
                        </div>
                        <CardTitle className="text-xl">{d.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="glass p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Available</p>
                            <p className="text-xl font-bold">{d.plots}</p>
                          </div>
                          <div className="glass p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Price</p>
                            <p className="text-xl font-bold text-primary">{d.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2"><span className="text-sm text-muted-foreground">xBGL per plot</span></div>
                        <Button variant="cosmic" className="w-full gap-2 group-hover:shadow-glow-accent transition-all">View Plots <ArrowRight className="h-4 w-4" /></Button>
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
        <img src={heroImage} alt="Cosmic Space" className="absolute w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-gradient-cosmic text-white border-primary text-lg px-6 py-2"><Sparkles className="w-5 h-5 mr-2" /> Genesis Phase Active</Badge>
            <h1 className="font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent text-7xl">Chaos Star Universe</h1>
            <p className="text-2xl text-muted-foreground mb-8">From rebellion to renaissance. Explore lore, claim land, build empires.</p>
            <div className="flex gap-4 justify-center">
              <Badge variant="outline" className="text-lg px-6 py-3"><Users className="w-5 h-5 mr-2" /> 5,247 Citizens</Badge>
              <Badge variant="outline" className="text-lg px-6 py-3"><MapPin className="w-5 h-5 mr-2" /> 10,000 Plots</Badge>
              <Badge variant="outline" className="text-lg px-6 py-3"><Coins className="w-5 h-5 mr-2" /> 2 Currencies</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        <Tabs defaultValue="universe" className="mb-12">
          <TabsList className="grid w-full grid-cols-7 mb-8 h-auto p-1">
            <TabsTrigger value="universe" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">Universe</TabsTrigger>
            <TabsTrigger value="phases" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">Phases</TabsTrigger>
            <TabsTrigger value="worlds" className="data-[state=active]:bg-gradient-cosmic data-[state=active]:text-white">Planets</TabsTrigger>
          </TabsList>

          {/* Universe Stats */}
          <TabsContent value="universe" className="space-y-8">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="glass p-6 border-primary/20"><div className="flex items-center gap-2 text-xl font-bold mb-2"><Users className="w-5 h-5 text-primary" /> Population</div><p className="text-3xl font-bold">5,247</p><p className="text-sm text-muted-foreground">Active citizens</p></Card>
              <Card className="glass p-6 border-primary/20"><div className="flex items-center gap-2 text-xl font-bold mb-2"><MapPin className="w-5 h-5 text-primary" /> Plots</div><p className="text-3xl font-bold">10,000</p><p className="text-sm text-muted-foreground">Land units</p></Card>
              <Card className="glass p-6 border-primary/20"><div className="flex items-center gap-2 text-xl font-bold mb-2"><Coins className="w-5 h-5 text-primary" /> Currencies</div><p className="text-3xl font-bold">2</p><p className="text-sm text-muted-foreground">xBGL & SC</p></Card>
              <Card className="glass p-6 border-primary/20"><div className="flex items-center gap-2 text-xl font-bold mb-2"><Globe className="w-5 h-5 text-primary" /> Worlds</div><p className="text-3xl font-bold">6</p><p className="text-sm text-muted-foreground">Planets & hubs</p></Card>
            </div>
          </TabsContent>

          {/* Planet Explorer */}
          <TabsContent value="worlds" className="space-y-8">
            <h2 className="text-4xl font-bold mb-8">Explore the Planets</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(planetsData).map(([id, planet]) => (
                <Card key={id} onClick={() => handlePlanetSelect(id)} className={`glass border-primary/30 transition-all ${planet.locked ? "opacity-40 pointer-events-none" : "hover:border-primary hover:shadow-glow-accent cursor-pointer"}`}>
                  <CardHeader>
                    <CardTitle className="text-2xl flex justify-between items-center">{planet.name}{planet.locked && <Lock className="w-5 h-5 text-muted-foreground" />}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{planet.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Tier</span>
                      <Badge variant="outline">{planet.tier}</Badge>
                    </div>
                    {!planet.locked && <Button variant="cosmic" className="w-full mt-2 gap-2">View Planet <ArrowRight className="h-4 w-4" /></Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Phases */}
          <TabsContent value="phases">
            {/* Phase cards here (you can move your Phase 1 & 2 content here) */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
