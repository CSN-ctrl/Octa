// app/universe/UnifiedUniverse.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Rocket, Zap, Users, Sparkles, DollarSign, Loader2, 
  Home, Factory, Hammer, Droplets, Mountain, Book, Shield,
  ChevronLeft, ArrowRight, Wallet, Network
} from "lucide-react";
import heroImage from "@/assets/hero-space.jpg";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useTreasury } from "@/hooks/useTreasury";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";

const planetsData = {
  "sarakt-prime": {
    name: "Sarakt Prime", status: "Habitable", population: 65, coverage: 42, tier: "Capital", color: "primary",
    description: "Cliff-carved capital overlooking the Sapphire Sea.",
    districts: [
      { name: "District A", plots: 423, price: 75, type: "Residential", icon: Home },
      { name: "Harbor District", plots: 145, price: 95, type: "Trading", icon: Droplets },
    ],
  },
  "zythera": {
    name: "Zythera", status: "Isolated", population: 12, coverage: 8, tier: "Frontier", color: "destructive",
    description: "Bioluminescent nanofiber ecosystem.",
    districts: [
      { name: "Research Outpost Alpha", plots: 89, price: 120, type: "Research", icon: Book },
    ],
  }
};

export default function UnifiedUniverse() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [starSystemName, setStarSystemName] = useState("");
  const [tributePercent, setTributePercent] = useState(5);

  const { plotsSold, totalPlots } = useLandPlots();
  const { address, isConnected, connect, balance } = useWallet();
  const {
    userStarSystems,
    STAR_SYSTEM_COST,
    PLANET_COST,
    spawnStarSystem,
    listStarSystemForSale,
    loading: forgeLoading
  } = useCelestialForge();

  // Drag & Zoom
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      const startX = e.clientX - pan.x;
      const startY = e.clientY - pan.y;
      const move = (e: MouseEvent) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - startX, y: e.clientY - startY });
      };
      const up = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [isDragging, pan]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 4));
  };

  const handleListForSale = async () => {
    if (!price || !selectedSystem) return;
    setIsListing(true);
    try {
      await listStarSystemForSale(selectedSystem.id, ethers.parseEther(price));
      toast.success(`${selectedSystem.name} listed!`);
      setPrice(""); setSelectedSystem(null);
    } catch { toast.error("Failed"); }
    setIsListing(false);
  };

  if (selectedPlanet) {
    const planet = planetsData[selectedPlanet as keyof typeof planetsData];
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4 py-12">
          <Button variant="glass" onClick={() => setSelectedPlanet(null)}>
            <ChevronLeft /> Back
          </Button>
          <h1 className="text-6xl font-bold my-8 bg-gradient-cosmic bg-clip-text text-transparent">
            {planet.name}
          </h1>
          {selectedPlanet === "sarakt-prime" && (
            <div className="mt-12">
              <h2 className="text-4xl font-bold mb-8">Development Phases</h2>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-3xl">Phase 1: Tribal Stage</CardTitle>
                  <Badge>{totalPlots.toLocaleString()} Plots • {plotsSold} Sold</Badge>
                </CardHeader>
                <CardContent>
                  <p>10,000 plots. Build or lose them in one Octavian year.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background to-background/80">
      {/* Hero */}
      <div className="relative h-96 overflow-hidden">
        <img src={heroImage} alt="Space" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div>
            <h1 className="text-7xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
              Chaos Star Universe
            </h1>
            <div className="flex gap-4 justify-center mt-6">
              <Badge variant="outline"><Users className="w-4 h-4 mr-1" /> {plotsSold} Citizens</Badge>
              <Badge variant="outline"><Globe className="w-4 h-4 mr-1" /> {totalPlots} Plots</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="universe">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="universe">
              <Globe className="w-4 h-4 mr-2" /> Universe
            </TabsTrigger>
            <TabsTrigger value="starmap">
              <Sparkles className="w-4 h-4 mr-2" /> Star Map
            </TabsTrigger>
          </TabsList>

          {/* UNIVERSE TAB */}
          <TabsContent value="universe" className="space-y-12">
            {/* Planets */}
            <div className="grid md:grid-cols-2 gap-8">
              {Object.entries(planetsData).map(([id, planet]) => (
                <Card key={id} className="glass cursor-pointer hover:border-primary transition-all"
                  onClick={() => setSelectedPlanet(id)}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="text-2xl">{planet.name}</CardTitle>
                      <Badge variant={planet.color === "primary" ? "default" : "destructive"}>
                        {planet.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{planet.description}</p>
                    <Button className="w-full mt-4" variant="cosmic">
                      Enter Planet <ArrowRight className="ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Celestial Forge */}
            <Card className="glass p-8 border-2 border-primary/30">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="text-primary" /> Celestial Forge
              </h3>
              {!isConnected ? (
                <Button onClick={connect} size="lg" variant="cosmic">
                  <Wallet className="mr-2" /> Connect Wallet
                </Button>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label>Star System Name</Label>
                    <Input value={starSystemName} onChange={e => setStarSystemName(e.target.value)} placeholder="Nova Prime" />
                  </div>
                  <Button
                    className="w-full"
                    disabled={forgeLoading || !starSystemName}
                    onClick={() => spawnStarSystem(starSystemName, tributePercent)}
                  >
                    {forgeLoading ? <Loader2 className="animate-spin" /> : <Rocket className="mr-2" />}
                    Spawn Star System ({STAR_SYSTEM_COST} AVAX)
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* STAR MAP TAB */}
          <TabsContent value="starmap">
            <div className="fixed inset-0 bg-black -z-10" onWheel={handleWheel}>
              {/* Nebula */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
              </div>
              {/* Stars */}
              {[...Array(100)].map((_, i) => (
                <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }}
                />
              ))}

              <motion.div style={{ scale: zoom, x: pan.x, y: pan.y, cursor: isDragging ? "grabbing" : "grab" }}>
                {/* Player Systems */}
                {userStarSystems.map((sys, i) => {
                  const x = 200 + (i % 7) * 300;
                  const y = 200 + Math.floor(i / 7) * 300;
                  return (
                    <motion.button
                      key={sys.id}
                      className="absolute group"
                      style={{ left: x, top: y }}
                      onClick={() => setSelectedSystem(sys)}
                      whileHover={{ scale: 1.4 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl animate-ping" />
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 shadow-2xl border-4 border-white/30 flex items-center justify-center">
                          {sys.forSale ? <DollarSign className="text-yellow-300" /> : <Globe className="text-white" />}
                        </div>
                        {sys.forSale && (
                          <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">
                            {sys.price} AVAX
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Spawn New */}
                <motion.button
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  whileHover={{ scale: 1.3 }}
                  onClick={() => {
                    const name = prompt("Name your star system:");
                    if (name) spawnStarSystem(name, 5);
                  }}
                >
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/50 bg-white/10 flex items-center justify-center">
                    <Rocket className="w-10 h-10 text-white" />
                  </div>
                </motion.button>
              </motion.div>

              {/* HUD */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <Button size="sm" variant="glass" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                  Reset
                </Button>
              </div>

              {/* Trade Panel */}
              <AnimatePresence>
                {selectedSystem && (
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-8 right-8 glass p-6 rounded-2xl border border-primary/30 max-w-sm"
                  >
                    <h3 className="text-2xl font-bold mb-4">{selectedSystem.name}</h3>
                    {selectedSystem.forSale ? (
                      <Button className="w-full" variant="cosmic">Buy for {selectedSystem.price} AVAX</Button>
                    ) : (
                      <>
                        <Input
                          placeholder="Price in AVAX"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          className="mb-4"
                        />
                        <Button
                          className="w-full"
                          disabled={isListing || !price}
                          onClick={handleListForSale}
                        >
                          {isListing ? <Loader2 className="animate-spin" /> : "List for Sale"}
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" className="w-full mt-3" onClick={() => setSelectedSystem(null)}>
                      Close
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
