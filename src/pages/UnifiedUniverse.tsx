import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scroll, Skull, Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin, TrendingUp, Coins, Factory, Home, ArrowRight, ChevronLeft } from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";

const planetsData = {
  "sarakt-prime": {
    name: "Sarakt Prime",
    status: "Habitable",
    population: 65,
    coverage: 42,
    description: "Cliff-carved capital overlooking the Sapphire Sea. Vertical architecture, Treasury Tower, xBGL economy hub.",
    districts: ["District A", "District B", "District C", "District D", "Harbor District", "Mining Tunnels"]
  },
  "zythera": {
    name: "Zythera",
    status: "Isolated",
    population: 12,
    coverage: 8,
    description: "Bioluminescent nanofiber ecosystem. Black market research, ShadowCoin trades, chaotic frontier.",
    districts: ["Research Outpost Alpha", "Nanofiber Web Zone", "Underground Labs", "Black Market Hub"]
  },
  "nexus-hub": {
    name: "Nexus Hub",
    status: "Trading Center",
    population: 88,
    coverage: 91,
    description: "Primary commerce node. Multi-species marketplace, diplomatic quarters, high-frequency trading."
  },
  "nexus-port": {
    name: "Nexus Port",
    status: "Shipping Hub",
    population: 45,
    coverage: 52,
    description: "Logistics center. Cargo processing, ship maintenance, customs enforcement."
  },
  "nexus-depot": {
    name: "Nexus Depot",
    status: "Coming Soon",
    locked: true,
    description: "Future storage facility. Strategic reserves, cold storage, warehouse districts."
  },
  "nexus-colony": {
    name: "Nexus Colony",
    status: "Coming Soon",
    locked: true,
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

  const handleBackToUniverse = () => {
    setSelectedPlanet(null);
  };

  if (selectedPlanet) {
    const planet = planetsData[selectedPlanet];
    
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Button 
            variant="glass" 
            className="mb-8 gap-2"
            onClick={handleBackToUniverse}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Universe
          </Button>

          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-5xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                {planet.name}
              </h1>
              <Badge variant={planet.status === "Habitable" ? "default" : "destructive"}>
                {planet.status}
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground">{planet.description}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="glass p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Population</p>
                  <p className="text-3xl font-bold">{planet.population}k</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="glass p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Coverage</p>
                  <p className="text-3xl font-bold">{planet.coverage}%</p>
                </div>
                <MapPin className="h-8 w-8 text-accent" />
              </div>
            </Card>

            <Card className="glass p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Districts</p>
                  <p className="text-3xl font-bold">{planet.districts?.length || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-secondary" />
              </div>
            </Card>
          </div>

          {planet.districts && planet.districts.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Available Districts</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planet.districts.map((district, idx) => (
                  <Card key={idx} className="glass border-primary/30 hover:border-primary transition-all">
                    <CardHeader>
                      <CardTitle className="text-xl">{district}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="glass p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Available Plots</p>
                        <p className="text-2xl font-bold">{Math.floor(Math.random() * 500) + 100}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Starting Price</span>
                        <span className="text-lg font-bold text-primary">
                          {Math.floor(Math.random() * 50) + 50} xBGL
                        </span>
                      </div>
                      <Button variant="cosmic" className="w-full gap-2">
                        View Plots <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="relative h-[400px] overflow-hidden mb-16">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Cosmic Space" className="w-full h-full object-cover opacity-40"/>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl">
            <h1 className="text-7xl font-bold mb-6 bg-gradient-cosmic bg-clip-text text-transparent">
              Octavia Universe
            </h1>
            <p className="text-xl text-muted-foreground">
              From rebellion to renaissance. Explore lore, claim land, build empires.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        <Tabs defaultValue="universe" className="mb-12">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="universe">Universe</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="economy">Economy</TabsTrigger>
            <TabsTrigger value="ancient">Ancient Era</TabsTrigger>
            <TabsTrigger value="cataclysm">Cataclysm</TabsTrigger>
            <TabsTrigger value="modern">Modern Age</TabsTrigger>
            <TabsTrigger value="worlds">Planets</TabsTrigger>
          </TabsList>

          <TabsContent value="universe">
            <div className="space-y-8">
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <Globe className="w-8 h-8 text-primary" />
                      Sarakt System
                    </span>
                    <Badge className="bg-gradient-cosmic text-white">2 Planets</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground">Humanity's stronghold. Advanced infrastructure, vertical cities, hybrid companions.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {["sarakt-prime", "zythera"].map(id => {
                      const planet = planetsData[id];
                      return (
                        <Card key={id} className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer" onClick={() => handlePlanetSelect(id)}>
                          <CardHeader>
                            <CardTitle className="text-xl flex items-center justify-between">
                              {planet.name}
                              <Badge variant={planet.status === "Habitable" ? "default" : "destructive"}>
                                {planet.status}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">{planet.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-primary"/>
                                {planet.population}k
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-primary"/>
                                {planet.coverage}% mapped
                              </span>
                            </div>
                            <Button variant="cosmic" className="w-full gap-2 mt-4">
                              Select Planet <ArrowRight className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <Globe className="w-8 h-8 text-primary" />
                      Tanaria System
                    </span>
                    <Badge className="bg-gradient-cosmic text-white">4 Planets</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground">Strategic trading nexus. Multi-species commerce, diplomatic hub, logistics center.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {["nexus-hub", "nexus-port", "nexus-depot", "nexus-colony"].map(id => {
                      const planet = planetsData[id];
                      return (
                        <Card 
                          key={id} 
                          className={`border-primary/10 ${planet.locked ? 'opacity-60' : 'hover:border-primary/30 cursor-pointer'} transition-all`}
                          onClick={() => !planet.locked && handlePlanetSelect(id)}
                        >
                          <CardHeader>
                            <CardTitle className="text-xl flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                {planet.locked && <Lock className="w-4 h-4"/>}
                                {planet.name}
                              </span>
                              <Badge variant={planet.locked ? "outline" : "default"}>
                                {planet.status}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">{planet.description}</p>
                            {!planet.locked && (
                              <>
                                <div className="flex gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-primary"/>
                                    {planet.population}k
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-primary"/>
                                    {planet.coverage}% mapped
                                  </span>
                                </div>
                                <Button variant="cosmic" className="w-full gap-2 mt-4">
                                  Select Planet <ArrowRight className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phases">
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Home className="w-8 h-8 text-primary" />
                    Phase 1: Tribal Stage
                  </CardTitle>
                  <Badge className="w-fit">10,000 Plots</Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                    <h3 className="text-xl font-semibold text-foreground mb-3">Settlement Foundation</h3>
                    <p>10,000 plots minted for initial settlers and tribes. Each plot must be developed within one Octavian year or face consequences.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">NPC Economy Launch</h3>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><span className="font-semibold text-foreground">Hunting & Gathering</span>: NPCs forage resources from wilderness</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><span className="font-semibold text-foreground">Farming</span>: Agricultural plots produce food supplies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><span className="font-semibold text-foreground">Water Collection</span>: Infrastructure for clean water distribution</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Basic Infrastructure</h3>
                    <p>Huts, workshops, water systems, and sewage. Villages form along trade routes. Dual currency activates: <span className="text-primary font-semibold">xBGL</span> for land/treasury, <span className="text-primary font-semibold">Chaos</span> for wages/commerce.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-primary" />
                    Phase 2: Civilization Stage
                  </CardTitle>
                  <Badge className="w-fit bg-destructive">Unlocks at 100,000 Developed Plots</Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                    <h3 className="text-xl font-semibold text-foreground mb-3">Advanced Structures</h3>
                    <p>Detached houses, schools, universities, industrial complexes. Full-scale economy with wages, rents, and production loops.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Secondary Market Opens</h3>
                    <p>Property trading with refunds based on net value. Building improvements directly increase property worth and rental income tied to valuation.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Player Faction Control</h3>
                    <p>After owning and developing 100 plots, form a faction. Manage population within your loyalty sphere. NPCs choose allegiance based on trust and benefits.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="economy">
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Coins className="w-8 h-8 text-primary" />
                    Dual Currency Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                      <h3 className="text-xl font-semibold text-foreground mb-3">xBGL Token</h3>
                      <p className="mb-3">Sovereign currency for:</p>
                      <ul className="space-y-2">
                        <li>• Land purchases and sales</li>
                        <li>• Treasury operations</li>
                        <li>• Rent payments</li>
                        <li>• Major infrastructure</li>
                      </ul>
                    </div>

                    <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded">
                      <h3 className="text-xl font-semibold text-foreground mb-3">Chaos Token</h3>
                      <p className="mb-3">Commerce currency for:</p>
                      <ul className="space-y-2">
                        <li>• Worker wages</li>
                        <li>• Product sales</li>
                        <li>• Daily commerce</li>
                        <li>• Free-floating exchange rate</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-foreground mb-3">Treasury Flow</h3>
                    <p>City → Planet (10% tribute) → Star System (10% tribute)</p>
                    <div className="mt-4 space-y-2">
                      <p><span className="font-semibold text-foreground">Sarakt Treasury Reserves:</span></p>
                      <ul className="ml-6 space-y-1">
                        <li>• 30% BTC</li>
                        <li>• 20% Stablecoins (lending/liquidity)</li>
                        <li>• 50% Basket (ETH/XRP/AVAX/MATIC)</li>
                      </ul>
                      <p className="mt-3">Up to 30% of xBGL reserves fund Octavia infrastructure projects.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Factory className="w-8 h-8 text-primary" />
                    Business Loop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                    <h3 className="text-xl font-semibold text-foreground mb-3">Production Chain</h3>
                    <ol className="space-y-3">
                      <li><span className="text-primary font-bold">1.</span> Planet buys raw materials in <span className="font-semibold">xBGL</span></li>
                      <li><span className="text-primary font-bold">2.</span> Refineries convert to components</li>
                      <li><span className="text-primary font-bold">3.</span> Manufacturers produce finished goods</li>
                      <li><span className="text-primary font-bold">4.</span> Products sold in <span className="font-semibold">Chaos</span></li>
                      <li><span className="text-primary font-bold">5.</span> Workers earn Chaos wages</li>
                      <li><span className="text-primary font-bold">6.</span> Rent paid in xBGL</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Property Value Dynamics</h3>
                    <p>Building improvements increase net value. Rent is tied to property valuation. Better buildings = higher rents = more xBGL income for landowners.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    NPCs & Population
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">NPC System</h3>
                    <p>NPCs spawn dynamically, choose jobs based on opportunities, develop skills over time, and build loyalty to factions. Loyalty gates faction influence. Modular design ready for AI integration.</p>
                  </div>

                  <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                    <h3 className="text-xl font-semibold text-foreground mb-3">Job Paths</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-foreground">Tribal Era:</p>
                        <p className="text-sm">Hunting, Gathering, Farming, Water Collection</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Economic Era:</p>
                        <p className="text-sm">Workshops, Industry, Schools, Healthcare, Trade</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Special Paths:</p>
                        <p className="text-sm">Martial Arts Dens, Chaos Magick Temples, Invite-Only Black Market</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Player Control</h3>
                    <p>Unlocks after owning and developing <span className="text-primary font-semibold">100 plots</span>. Form a faction to manage population within your loyalty sphere. Compete for NPC allegiance through wages, benefits, and ideology.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ancient">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Skull className="w-8 h-8 text-destructive" />
                  The Abduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Dynasty Dulo's Legacy</h3>
                  <p>
                    Centuries ago, humans of the ancient <span className="text-primary font-semibold">Dynasty Dulo</span> lived 
                    peacefully on Earth until the night the sky burned red. Advanced alien beings descended upon their villages, 
                    forcibly extracting entire populations to serve as miners in distant star systems.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Mines of Sarakt</h3>
                  <p>
                    For generations, humans toiled in the underground mines of <span className="text-primary font-semibold">Sarakt Prime</span>, 
                    extracting rare crystalline ores that powered alien civilizations. The work was brutal, the conditions inhuman, 
                    and hope seemed a distant memory.
                  </p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded">
                  <h3 className="text-2xl font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    The Great Rebellion
                  </h3>
                  <p className="italic">
                    "They gave us tools to dig. We used them to fight."
                  </p>
                  <p className="mt-3">
                    Led by the warrior-philosopher <span className="text-primary font-semibold">Octavian</span>, 
                    humans organized a coordinated uprising across all mining colonies. Using stolen alien technology and 
                    guerrilla tactics, they overwhelmed their captors in a single night of fury. The rebellion succeeded—
                    but at tremendous cost. Of the millions who fought, only thousands survived.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Surviving Tribe</h3>
                  <p>
                    After the victory, the survivors—now a single unified tribe—claimed Sarakt Prime as their new home. 
                    They destroyed the alien infrastructure but kept the technology, determined never to be enslaved again. 
                    The tribe scattered across the planet's surface, forming small settlements and beginning the long process of rebuilding civilization.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cataclysm">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Mountain className="w-8 h-8 text-destructive" />
                  The Nanofiber Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Zythera's Transformation</h3>
                  <p>
                    Fifty years after the rebellion, a massive meteor struck the neighboring planet 
                    <span className="text-primary font-semibold"> Zythera</span>. The impact released unknown radiation 
                    that mutated the planet's flora into an interconnected web of <span className="text-primary font-semibold">nanofiber organisms</span>—
                    semi-sentient plants with crystalline nervous systems.
                  </p>
                </div>

                <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Web Awakens</h3>
                  <p>
                    The nanofiber web spread across Zythera's surface like a living neural network, consuming 
                    old forests and replacing them with bioluminescent structures. Explorers from Sarakt Prime 
                    discovered that the nanofibers could interface with technology—and with neural tissue.
                  </p>
                  <p className="mt-3 italic text-destructive">
                    "Some who ventured too deep into the web never returned. Those who did spoke of whispers 
                    in the static, voices calling from the roots."
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">The Second Invasion</h3>
                  <p>
                    One hundred years ago, the aliens returned. They came not for slaves, but for vengeance. 
                    Their warships descended upon Sarakt Prime and systematically destroyed every major city. 
                    Octavia's descendants, unprepared for orbital bombardment, watched helplessly as centuries of 
                    progress burned in nuclear fire.
                  </p>
                  <p className="mt-3">
                    The survivors retreated underground, back into the ancient mines their ancestors had once 
                    fought to escape. For decades, humanity lived in darkness
