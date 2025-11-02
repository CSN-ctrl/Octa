'use client';

import React, { useMemo, useReducer, useState, useContext, createContext, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin,
  Coins, Factory, Home, ArrowRight, ChevronLeft, Sparkles, Shield,
  Droplets, TreePine, Hammer, Book, X, Check, ShoppingCart, Wallet,
  Star, TrendingUp, Package, AlertCircle, Loader2
} from "lucide-react";
import heroImage from "/assets/hero-space.jpg";

// ----------------------------
// Types & Constants
// ----------------------------
type DistrictType = "Residential" | "Commercial" | "Industrial" | "Trading" | "Research" | "Science" | "Experimental" | "Governance" | "Manufacturing" | "Resource";

interface District {
  id: string;
  name: string;
  plots: number;
  price: number;
  type: DistrictType;
  icon: React.FC<any>;
}

interface Planet {
  id: string;
  name: string;
  status: string;
  population: number;
  coverage: number;
  tier: string;
  color: string;
  description: string;
  districts: District[];
  features: string[];
  locked?: boolean;
}

interface UniverseState {
  planets: Record<string, Planet>;
  selectedPlanetId: string | null;
  wallet: number;
}

type Action =
  | { type: "SELECT_PLANET"; payload: string }
  | { type: "CLOSE_PLANET" }
  | { type: "BUY_PLOT"; payload: { planetId: string; districtId: string; quantity: number } }
  | { type: "SET_WALLET"; payload: number };

// ----------------------------
// Context + Reducer
// ----------------------------
const UniverseContext = createContext<{
  state: UniverseState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const INITIAL_WALLET = 2500;

function universeReducer(state: UniverseState, action: Action): UniverseState {
  switch (action.type) {
    case "SELECT_PLANET":
      return { ...state, selectedPlanetId: action.payload };
    case "CLOSE_PLANET":
      return { ...state, selectedPlanetId: null };
    case "BU:BUY_PLOT": {
      const { planetId, districtId, quantity } = action.payload;
      if (planetId !== "sarakt-prime" || quantity <= 0) return state;

      const planet = state.planets[planetId];
      if (!planet) return state;

      let totalCost = 0;
      const newDistricts = planet.districts.map(d => {
        if (d.id !== districtId) return d;
        const district = { ...d };
        const available = district.plots;
        const buy = Math.min(quantity, available);
        totalCost += buy * district.price;
        district.plots = available - buy;
        return district;
      });

      if (totalCost > state.wallet) return state;

      const newPlanets = {
        ...state.planets,
        [planetId]: { ...planet, districts: newDistricts }
      };

      return {
        ...state,
        planets: newPlanets,
        wallet: state.wallet - totalCost
      };
    }
    case "SET_WALLET":
      return { ...state, wallet: action.payload };
    default:
      return state;
  }
}

function UniverseProvider({ children, initialPlanets }: { children: React.ReactNode; initialPlanets: Record<string, Planet> }) {
  const [state, dispatch] = useReducer(universeReducer, {
    planets: initialPlanets,
    selectedPlanetId: null,
    wallet: INITIAL_WALLET
  });

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>;
}

function useUniverse() {
  const ctx = useContext(UniverseContext);
  if (!ctx) throw new Error("useUniverse must be used within UniverseProvider");
  return ctx;
}

// ----------------------------
// Data
// ----------------------------
const DEFAULT_PLANETS: Record<string, Planet> = {
  "sarakt-prime": {
    id: "sarakt-prime",
    name: "Sarakt Prime",
    status: "Habitable",
    population: 65,
    coverage: 42,
    tier: "Capital",
    color: "primary",
    description: "Cliff-carved capital overlooking the Sapphire Sea. Vertical architecture, Treasury Tower, xBGL economy hub.",
    districts: [
      { id: "a", name: "District A", plots: 423, price: 75, type: "Residential", icon: Home },
      { id: "b", name: "District B", plots: 289, price: 68, type: "Commercial", icon: Factory },
      { id: "c", name: "District C", plots: 356, price: 82, type: "Industrial", icon: Hammer },
      { id: "d", name: "District D", plots: 198, price: 65, type: "Residential", icon: Home },
      { id: "harbor", name: "Harbor District", plots: 145, price: 95, type: "Trading", icon: Droplets },
      { id: "mining", name: "Mining Tunnels", plots: 234, price: 55, type: "Resource", icon: Mountain }
    ],
    features: ["Treasury Tower", "Vertical Architecture", "Sapphire Sea Access", "Underground Mines"]
  },
  "zythera": {
    id: "zythera",
    name: "Zythera",
    status: "Isolated",
    population: 12,
    coverage: 8,
    tier: "Frontier",
    color: "destructive",
    description: "Bioluminescent nanofiber ecosystem. Black market research, ShadowCoin trades, chaotic frontier.",
    districts: [
      { id: "r1", name: "Research Outpost Alpha", plots: 89, price: 120, type: "Research", icon: Book },
      { id: "web", name: "Nanofiber Web Zone", plots: 156, price: 95, type: "Experimental", icon: Sprout },
      { id: "labs", name: "Underground Labs", plots: 67, price: 140, type: "Science", icon: Zap },
      { id: "black", name: "Black Market Hub", plots: 203, price: 110, type: "Trading", icon: Shield }
    ],
    features: ["Nanofiber Web", "Bioluminescent Flora", "Black Market", "Chaos Energy"]
  },
  "nexus-hub": {
    id: "nexus-hub",
    name: "Nexus Hub",
    status: "Trading Center",
    population: 88,
    coverage: 91,
    tier: "Commercial",
    color: "accent",
    description: "Primary commerce node. Multi-species marketplace, diplomatic quarters, high-frequency trading.",
    districts: [
      { id: "cm", name: "Central Market", plots: 512, price: 125, type: "Commercial", icon: Factory },
      { id: "dq", name: "Diplomatic Quarter", plots: 234, price: 150, type: "Governance", icon: Shield },
      { id: "td", name: "Trade Docks", plots: 389, price: 110, type: "Trading", icon: Droplets }
    ],
    features: ["Multi-Species Hub", "Diplomatic Center", "High-Frequency Trading", "Transit Node"]
  },
  "nexus-port": {
    id: "nexus-port",
    name: "Nexus Port",
    status: "Shipping Hub",
    population: 45,
    coverage: 52,
    tier: "Logistics",
    color: "secondary",
    description: "Logistics center. Cargo processing, ship maintenance, customs enforcement.",
    districts: [
      { id: "ct", name: "Cargo Terminal", plots: 445, price: 85, type: "Industrial", icon: Hammer },
      { id: "sy", name: "Ship Yards", plots: 267, price: 95, type: "Manufacturing", icon: Factory },
      { id: "cd", name: "Customs District", plots: 178, price: 75, type: "Governance", icon: Shield }
    ],
    features: ["Cargo Processing", "Ship Maintenance", "Customs Enforcement", "Warehouse Complex"]
  },
  "nexus-depot": { id: "nexus-depot", name: "Nexus Depot", status: "Coming Soon", locked: true, tier: "Storage", color: "muted", description: "Future storage facility.", districts: [], features: [], population: 0, coverage: 0 },
  "nexus-colony": { id: "nexus-colony", name: "Nexus Colony", status: "Coming Soon", locked: true, tier: "Settlement", color: "muted", description: "Planned settlement.", districts: [], features: [], population: 0, coverage: 0 }
};

// ----------------------------
// UI Components
// ----------------------------
function SafeIcon({ Icon, ...props }: { Icon: React.FC<any>; [key: string]: any }) {
  return Icon ? <Icon {...props} /> : null;
}

function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{ x: Math.random() * window.innerWidth, y: -10 }}
          animate={{ y: window.innerHeight + 10 }}
          transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
          style={{ left: `${Math.random() * 100}%` }}
        />
      ))}
    </div>
  );
}

function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-[500px] rounded-3xl overflow-hidden mb-16 shadow-2xl"
    >
      <div className="absolute inset-0">
        <img src={heroImage} alt="Octavia Universe" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      <div className="relative h-full flex items-end pb-16 px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-lg px-8 py-3 inline-flex items-center gap-3 shadow-lg">
              <Sparkles className="w-6 h-6 animate-pulse" />
              Genesis Phase Active
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-7xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight"
          >
            Octavia Universe
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-white/80 max-w-2xl"
          >
            From rebellion to renaissance. Explore alien worlds, claim digital land, build empires in the first on-chain metaverse.
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
}

function QuickStats({ planets }: { planets: Record<string, Planet> }) {
  const stats = useMemo(() => {
    const totalPlanets = Object.keys(planets).length;
    const active = Object.values(planets).filter(p => !p.locked).length;
    const totalDistricts = Object.values(planets).reduce((acc, p) => acc + p.districts.length, 0);
    const totalPlots = Object.values(planets).reduce((acc, p) => acc + p.districts.reduce((a, d) => a + d.plots, 0), 0);

    return { totalPlanets, active, totalDistricts, totalPlots };
  }, [planets]);

  const statItems = [
    { label: "Total Planets", value: stats.totalPlanets, icon: Globe, color: "text-blue-400" },
    { label: "Active Worlds", value: stats.active, icon: Star, color: "text-yellow-400" },
    { label: "Total Districts", value: stats.totalDistricts, icon: Building2, color: "text-purple-400" },
    { label: "Available Plots", value: stats.totalPlots, icon: Package, color: "text-green-400" }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {statItems.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="glass border-white/10 backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">{stat.label}</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function PlanetCard({ planet, onSelect }: { planet: Planet; onSelect: (id: string) => void }) {
  const locked = planet.locked;

  return (
    <motion.div
      whileHover={!locked ? { y: -8, scale: 1.02 } : {}}
      whileTap={!locked ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className={`relative overflow-hidden glass backdrop-blur-xl border-white/10 cursor-pointer transition-all ${
          locked ? "opacity-50 grayscale" : "hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/30"
        }`}
        onClick={() => !locked && onSelect(planet.id)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 hover:opacity-100 transition-opacity" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl font-bold text-white">{planet.name}</CardTitle>
            {locked && <Lock className="w-5 h-5 text-white/50" />}
          </div>
          <Badge className={`text-sm ${locked ? "bg-white/10" : "bg-gradient-to-r from-purple-500 to-pink-500"} text-white border-0`}>
            {planet.tier}
          </Badge>
        </CardHeader>

        <CardContent className="relative space-y-3">
          <p className="text-sm text-white/70 line-clamp-2">{planet.description}</p>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Status</span>
            <Badge variant="outline" className="text-white/80 border-white/30">
              {planet.status}
            </Badge>
          </div>

          {!locked && (
            <Button
              variant="ghost"
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(planet.id);
              }}
            >
              Explore World <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PlanetStats({ planet }: { planet: Planet | null }) {
  const stats = planet ? [
    { label: "Population", value: `${planet.population}k`, icon: Users, progress: planet.population },
    { label: "Coverage", value: `${planet.coverage}%`, icon: MapPin, progress: planet.coverage },
    { label: "Districts", value: planet.districts.length, icon: Building2, progress: 0 }
  ] : [];

  return (
    <Card className="glass backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Planet Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60 flex items-center gap-2">
                <stat.icon className="w-4 h-4" />
                {stat.label}
              </span>
              <span className="font-bold text-white">{stat.value}</span>
            </div>
            {stat.progress > 0 && (
              <Progress value={stat.progress} className="h-2 bg-white/10">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${stat.progress}%` }} />
              </Progress>
            )}
          </motion.div>
        ))}

        {planet && (
          <>
            <Separator className="bg-white/10" />
            <div className="flex flex-wrap gap-2">
              {planet.features.map((f, i) => (
                <Badge key={i} variant="outline" className="text-white/70 border-white/20 text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DistrictCard({
  planetId,
  district,
  onBuy
}: {
  planetId: string;
  district: District;
  onBuy: (districtId: string, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const canBuy = planetId === "sarakt-prime" && district.plots > 0;
  const totalPrice = district.price * quantity;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass backdrop-blur-xl border-white/10 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <SafeIcon Icon={district.icon} className="w-6 h-6 text-purple-300" />
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs">
              {district.type}
            </Badge>
          </div>
          <CardTitle className="text-xl text-white">{district.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <p className="text-xs text-white/60 mb-1">Available Plots</p>
              <p className="text-2xl font-bold text-white">{district.plots}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
              <p className="text-xs text-white/60 mb-1">Price per Plot</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {district.price} xBGL
              </p>
            </div>
          </div>

          {canBuy ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-white border-white/20"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(district.plots, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center bg-white/10 border-white/20 text-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-white border-white/20"
                  onClick={() => setQuantity(Math.min(district.plots, quantity + 1))}
                  disabled={quantity >= district.plots}
                >
                  +
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Total Cost</span>
                <span className="font-bold text-lg text-white">{totalPrice} xBGL</span>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                onClick={() => onBuy(district.id, quantity)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy {quantity} Plot{quantity > 1 ? "s" : ""}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-white/50 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {planetId !== "sarakt-prime" ? "Sales not active yet" : "Sold out"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ----------------------------
// Main App
// ----------------------------
export default function UnifiedUniverse({ planets = DEFAULT_PLANETS }: { planets?: Record<string, Planet> }) {
  return (
    <UniverseProvider initialPlanets={planets}>
      <UnifiedUniverseInner />
    </UniverseProvider>
  );
}

function UnifiedUniverseInner() {
  const { state, dispatch } = useUniverse();
  const [buyDialog, setBuyDialog] = useState<{ open: boolean; district?: District; quantity: number; planet?: Planet }>({
    open: false,
    quantity: 1
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlanet = state.selectedPlanetId ? state.planets[state.selectedPlanetId] : null;
  const planetEntries = Object.entries(state.planets);

  const openPlanet = useCallback((id: string) => {
    dispatch({ type: "SELECT_PLANET", payload: id });
  }, [dispatch]);

  const closePlanet = useCallback(() => {
    dispatch({ type: "CLOSE_PLANET" });
  }, [dispatch]);

  const handleBuy = useCallback((districtId: string, qty: number) => {
    if (!selectedPlanet) return;
    const district = selectedPlanet.districts.find(d => d.id === districtId);
    if (!district) return;

    setBuyDialog({ open: true, district, quantity: qty, planet: selectedPlanet });
  }, [selectedPlanet]);

  const confirmPurchase = async () => {
    if (!buyDialog.district || !buyDialog.planet || !selectedPlanet) return;

    setIsProcessing(true);
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalCost = buyDialog.district.price * buyDialog.quantity;
    if (totalCost > state.wallet) {
      setIsProcessing(false);
      return;
    }

    dispatch({
      type: "BUY_PLOT",
      payload: {
        planetId: selectedPlanet.id,
        districtId: buyDialog.district.id,
        quantity: buyDialog.quantity
      }
    });

    setIsProcessing(false);
    setBuyDialog({ open: false, quantity: 1 });
  };

  return (
    <>
      <FloatingParticles />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white pt-20">
        <div className="container mx-auto px-4 pb-24 max-w-7xl">
          <Hero />
          <QuickStats planets={state.planets} />

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planetEntries.map(([id, planet]) => (
                  <PlanetCard key={id} planet={planet} onSelect={openPlanet} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {selectedPlanet && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {selectedPlanet.name}
                        </h2>
                        <p className="text-lg text-white/70 max-w-3xl">{selectedPlanet.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closePlanet}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {selectedPlanet.features.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Badge className="bg-white/10 text-white border-white/20 backdrop-blur">
                            {f}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedPlanet.districts.map(district => (
                        <DistrictCard
                          key={district.id}
                          planetId={selectedPlanet.id}
                          district={district}
                          onBuy={handleBuy}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedPlanet && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="bg-white/5 rounded-3xl p-12 backdrop-blur">
                    <Globe className="w-20 h-20 mx-auto mb-6 text-white/30" />
                    <p className="text-xl text-white/60">Select a planet to explore districts and claim land</p>
                    <p className="text-sm text-white/40 mt-2">Only Sarakt Prime is currently accepting land purchases</p>
                  </div>
                </motion.div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="sticky top-28">
                <PlanetStats planet={selectedPlanet || null} />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="glass backdrop-blur-xl border-white/10 mt-6">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        xBGL Wallet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/60">Available Balance</p>
                          <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {state.wallet.toLocaleString()}
                          </p>
                        </div>
                        <Coins className="w-10 h-10 text-yellow-400 opacity-70" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <Card className="glass backdrop-blur-xl border-white/10 mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Developer Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-white/60 space-y-2">
                    <p>• Only <code className="bg-white/10 px-2 py-1 rounded">sarakt-prime</code> sells plots</p>
                    <p>• Wallet updates on purchase</p>
                    <p>• Ready for blockchain integration</p>
                    <p>• Responsive & animated UI</p>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>

        <Dialog open={buyDialog.open} onOpenChange={(open) => !open && setBuyDialog({ ...buyDialog, open })}>
          <DialogContent className="glass backdrop-blur-2xl border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Confirm Land Purchase
              </DialogTitle>
            </DialogHeader>

            {buyDialog.district && buyDialog.planet && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <SafeIcon Icon={buyDialog.district.icon} className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <p className="font-semibold">{buyDialog.district.name}</p>
                      <p className="text-sm text-white/60">{buyDialog.planet.name}</p>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Quantity</span>
                      <span className="font-bold">{buyDialog.quantity} plot{buyDialog.quantity > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Price per plot</span>
                      <span className="font-bold">{buyDialog.district.price} xBGL</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-white/80">Total Cost</span>
                      <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {(buyDialog.district.price * buyDialog.quantity).toLocaleString()} xBGL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Wallet Balance</span>
                  <span className={state.wallet >= (buyDialog.district.price * buyDialog.quantity) ? "text-green-400" : "text-red-400"}>
                    {state.wallet.toLocaleString()} xBGL
                  </span>
                </div>

                <DialogFooter className="gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setBuyDialog({ ...buyDialog, open: false })}
                    className="text-white/70 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmPurchase}
                    disabled={isProcessing || state.wallet < (buyDialog.district.price * buyDialog.quantity)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Purchase
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
