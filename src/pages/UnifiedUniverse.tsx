import { useState, useEffect, useRef } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);

  const { plotsSold, totalPlots } = useLandPlots();
  const { address, isConnected, connect, balance } = useWallet();
  const {
    userStarSystems,
    STAR_SYSTEM_COST,
    spawnStarSystem,
    listStarSystemForSale,
    loading: forgeLoading
  } = useCelestialForge();

  // DRAG & ZOOM
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0, startY = 0;
    const onDown = (e: MouseEvent | TouchEvent) => {
      setIsDragging(true);
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      startX = clientX - pan.x;
      startY = clientY - pan.y;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setPan({ x: clientX - startX, y: clientY - startY });
    };
    const onUp = () => setIsDragging(false);

    el.addEventListener("mousedown", onDown as any);
    el.addEventListener("touchstart", onDown as any);
    window.addEventListener("mousemove", onMove as any);
    window.addEventListener("touchmove", onMove as any);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("mousedown", onDown as any);
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp);
    };
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
          <Button variant="ghost" size="sm" onClick={() => setSelectedPlanet(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-6xl font-bold my-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {planet.name}
          </h1>
          {selectedPlanet === "sarakt-prime" && (
            <Card className="glass p-8">
              <CardHeader>
                <CardTitle className="text-3xl">Phase 1: Tribal Stage</CardTitle>
                <Badge variant="outline">{totalPlots.toLocaleString()} Plots • {plotsSold} Sold</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-lg">Build or lose your plots in one Octavian year.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background to-background/80">
      {/* HERO */}
      <div className="relative h-96 overflow-hidden">
        <img src={heroImage} alt="Space" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Chaos Star Universe
            </h1>
            <div className="flex gap-6 justify-center mt-8">
              <Badge variant="outline" className="text-lg px-6 py-3">
                <Users className="w-5 h-5 mr-2" /> {plotsSold} Citizens
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-3">
                <Globe className="w-5 h-5 mr-2" /> {totalPlots} Plots
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="universe" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 bg-glass/50 backdrop-blur">
            <TabsTrigger value="universe" className="text-lg">
              <Globe className="w-5 h-5 mr-2" /> Universe
            </TabsTrigger>
            <TabsTrigger value="starmap" className="text-lg">
              <Sparkles className="w-5 h-5 mr-2" /> Star Map
            </TabsTrigger>
          </TabsList>

          {/* UNIVERSE TAB */}
          <TabsContent value="universe" className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              {Object.entries(planetsData).map(([id, planet]) => (
                <Card key={id} className="glass cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => setSelectedPlanet(id)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-2xl">{planet.name}</CardTitle>
                      <Badge variant={planet.color === "primary" ? "default" : "destructive"}>
                        {planet.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">{planet.description}</p>
                    <Button className="w-full" variant="cosmic">
                      Enter Planet <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FORGE */}
            <Card className="glass p-8 border-2 border-primary/30">
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="text-primary" /> Celestial Forge
              </h3>
              {!isConnected ? (
                <Button onClick={connect} size="lg" variant="cosmic" className="w-full">
                  <Wallet className="mr-2" /> Connect Wallet to Forge
                </Button>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label>Star System Name</Label>
                    <Input
                      value={starSystemName}
                      onChange={e => setStarSystemName(e.target.value)}
                      placeholder="e.g., Nova Prime"
                      className="mt-2"
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={forgeLoading || !starSystemName}
                    onClick={() => spawnStarSystem(starSystemName, tributePercent)}
                  >
                    {forgeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Rocket className="w-5 h-5 mr-2" />
                    )}
                    Spawn Star System ({STAR_SYSTEM_COST} AVAX)
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* STAR MAP TAB */}
          <TabsContent value="starmap">
            <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden" onWheel={handleWheel}>
              {/* Nebula */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
              </div>

              {/* Twinkling Stars */}
              {[...Array(120)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 6}s`,
                  }}
                />
              ))}

              {/* Galaxy */}
              <motion.div
                className="absolute inset-0"
                style={{
                  scale: zoom,
                  x: pan.x,
                  y: pan.y,
                  cursor: isDragging ? "grabbing" : "grab",
                }}
              >
                {/* Player Systems */}
                {userStarSystems.map((sys, i) => {
                  const x = 200 + (i % 7) * 300 + Math.random() * 50;
                  const y = 200 + Math.floor(i / 7) * 300 + Math.random() * 50;
                  return (
                    <motion.button
                      key={sys.id}
                      className="absolute group"
                      style={{ left: x, top: y }}
                      onClick={() => setSelectedSystem(sys)}
                      whileHover={{ scale: 1.4 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl animate-ping" />
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 shadow-2xl border-4 border-white/30 flex items-center justify-center">
                          {sys.forSale ? (
                            <DollarSign className="w-8 h-8 text-yellow-300 animate-pulse" />
                          ) : (
                            <Globe className="w-8 h-8 text-white" />
                          )}
                        </div>
                        {sys.forSale && (
                          <Badge className="absolute -top-3 -right-3 bg-yellow-500 text-black text-xs font-bold">
                            {sys.price || "?"} AVAX
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Spawn New */}
                <motion.button
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group"
                  whileHover={{ scale: 1.3 }}
                  onClick={() => {
                    const name = prompt("Name your star system:");
                    if (name) spawnStarSystem(name, 5);
                  }}
                >
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/50 bg-white/10 backdrop-blur flex items-center justify-center hover:border-primary transition-all">
                    <Rocket className="w-10 h-10 text-white group-hover:text-primary" />
                  </div>
                  <p className="text-white text-xs mt-3 opacity-0 group-hover:opacity-100">
                    Click to Spawn
                  </p>
                </motion.button>
              </motion.div>

              {/* HUD */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                <Button size="sm" variant="glass" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                  Reset View
                </Button>
              </div>

              {/* Trade Panel */}
              <AnimatePresence>
                {selectedSystem && (
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-8 right-8 glass p-6 rounded-2xl border border-primary/30 max-w-sm z-20"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                        {selectedSystem.name}
                      </h3>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedSystem(null)}>
                        ×
                      </Button>
                    </div>

                    {selectedSystem.forSale ? (
                      <div className="space-y-4">
                        <Badge className="w-full justify-center py-3 text-lg bg-yellow-500 text-black">
                          <DollarSign className="w-5 h-5 mr-2" />
                          Listed: {selectedSystem.price || "?"} AVAX
                        </Badge>
                        <Button className="w-full" variant="cosmic">
                          Buy Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Planets</Label>
                          <p className="text-2xl font-bold">{selectedSystem.planets?.length || 0}</p>
                        </div>
                        <Label htmlFor="price">List Price (AVAX)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.42"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          className="glass"
                        />
                        <Button
                          className="w-full"
                          disabled={isListing || !price}
                          onClick={handleListForSale}
                        >
                          {isListing ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <DollarSign className="w-5 h-5 mr-2" />
                          )}
                          List for Sale
                        </Button>
                      </div>
                    )}
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
