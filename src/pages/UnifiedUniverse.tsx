import React, { useMemo, useReducer, useState, useContext, createContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout, Building2, Zap, Mountain, Globe, Lock, Users, MapPin,
  Coins, Factory, Home, ArrowRight, ChevronLeft, Sparkles, Shield,
  Droplets, TreePine, Hammer, Book, X, Check
} from "lucide-react";
import heroImage from "/assets/hero-space.jpg";

// ----------------------------
// Data (default) - single source of truth
// ----------------------------
const DEFAULT_PLANETS = {
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
  "nexus-depot": { id: "nexus-depot", name: "Nexus Depot", status: "Coming Soon", locked: true, tier: "Storage", color: "muted", description: "Future storage facility.", districts: [], features: [] },
  "nexus-colony": { id: "nexus-colony", name: "Nexus Colony", status: "Coming Soon", locked: true, tier: "Settlement", color: "muted", description: "Planned settlement.", districts: [], features: [] }
};

// ----------------------------
// Context + Reducer (lightweight state management)
// ----------------------------
const UniverseContext = createContext(null);

function universeReducer(state, action) {
  switch (action.type) {
    case "SELECT_PLANET":
      return { ...state, selectedPlanetId: action.payload };
    case "CLOSE_PLANET":
      return { ...state, selectedPlanetId: null };
    case "BUY_PLOT": {
      const { planetId, districtId, quantity = 1 } = action.payload;
      // only sarakt-prime sells for now
      if (planetId !== "sarakt-prime") return state;

      const planets = { ...state.planets };
      const planet = { ...planets[planetId] };
      planet.districts = planet.districts.map(d => {
        if (d.id !== districtId) return d;
        const available = typeof d.plots === "number" ? d.plots : 0;
        const bought = Math.min(quantity, available);
        return { ...d, plots: available - bought };
      });
      planets[planetId] = planet;
      return { ...state, planets };
    }
    default:
      return state;
  }
}

function UniverseProvider({ children, initial = DEFAULT_PLANETS }) {
  const initialState = { planets: initial, selectedPlanetId: null };
  const [state, dispatch] = React.useReducer(universeReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>;
}

function useUniverse() {
  const ctx = useContext(UniverseContext);
  if (!ctx) throw new Error("useUniverse must be used within UniverseProvider");
  return ctx;
}

// ----------------------------
// UI Primitives (no world-ending side effects)
// ----------------------------
function SafeIcon({ Icon, className = "w-6 h-6" }) {
  if (!Icon || typeof Icon !== "function") return null;
  return <Icon className={className} />;
}

function Modal({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            className="relative w-full max-w-2xl bg-card rounded-2xl p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ----------------------------
// Components
// ----------------------------
function Hero() {
  return (
    <div className="relative h-[420px] overflow-hidden mb-12">
      <img src={heroImage} alt="Cosmic" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-3xl">
          <Badge className="mb-6 bg-gradient-cosmic text-white border-primary text-lg px-6 py-2 inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Genesis Phase Active
          </Badge>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">Octavia Universe</h1>
          <p className="text-lg text-muted-foreground">From rebellion to renaissance. Explore lore, claim land, build empires.</p>
        </div>
      </div>
    </div>
  );
}

function QuickStats({ planets }) {
  const planetCount = Object.keys(planets).length;
  const totalDistricts = Object.values(planets).reduce((acc, p) => acc + (Array.isArray(p.districts) ? p.districts.length : 0), 0);
  const locked = Object.values(planets).filter(p => p.locked).length;

  return (
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      <Card className="glass border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Planets</p>
              <p className="text-3xl font-bold">{planetCount}</p>
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
              <p className="text-3xl font-bold">{totalDistricts}</p>
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
              <p className="text-3xl font-bold">{locked}</p>
            </div>
            <Lock className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanetCard({ planet, onSelect }) {
  const locked = Boolean(planet.locked);
  return (
    <Card
      className={`glass cursor-pointer border-primary/20 hover:border-primary hover:shadow-glow-accent transition-all ${locked ? "opacity-50 pointer-events-none" : ""}`} 
      onClick={() => !locked && onSelect(planet.id)}
      role="button"
      aria-disabled={locked}
    >
      <CardHeader>
        <CardTitle className="text-2xl flex justify-between items-center">
          {String(planet.name)}
          {locked && <Lock className="w-5 h-5 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{String(planet.description || '')}</p>
        <div className="flex items-center justify-between text-sm">
          <span>Tier</span>
          <Badge variant="outline">{String(planet.tier || '—')}</Badge>
        </div>
        {!locked && (
          <Button variant="cosmic" className="w-full mt-2 gap-2" onClick={() => onSelect(planet.id)}>
            View Planet <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PlanetStats({ planet }) {
  const safePopulation = typeof planet.population === "number" ? planet.population : 0;
  const safeCoverage = typeof planet.coverage === "number" ? planet.coverage : 0;
  const numDistricts = Array.isArray(planet.districts) ? planet.districts.length : 0;

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl">Planet Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Population</span>
            <span className="font-bold">{safePopulation}k</span>
          </div>
          <Progress value={Math.min(100, safePopulation)} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Mapped</span>
            <span className="font-bold">{safeCoverage}%</span>
          </div>
          <Progress value={Math.min(100, safeCoverage)} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Districts</span>
            <span className="font-bold">{numDistricts}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tier</span>
            <Badge className="bg-gradient-cosmic text-white">{String(planet.tier || "—")}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistrictCard({ planetId, district, onBuy }) {
  const Icon = district.icon;
  const plots = typeof district.plots === 'number' ? district.plots : 0;
  const price = typeof district.price === 'number' ? district.price : '—';

  const canBuy = planetId === 'sarakt-prime' && plots > 0;

  return (
    <Card className="glass border-primary/30 hover:border-primary hover:shadow-glow-accent transition-all group">
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-colors">
            <SafeIcon Icon={Icon} className="w-6 h-6 text-primary" />
          </div>
          <Badge variant="outline">{String(district.type || '—')}</Badge>
        </div>
        <CardTitle className="text-xl">{String(district.name || 'Unknown')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-xl font-bold">{plots}</p>
          </div>
          <div className="glass p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Price</p>
            <p className="text-xl font-bold text-primary">{price}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">xBGL per plot</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onBuy(district.id, 1)} disabled={!canBuy} aria-disabled={!canBuy}>
              Buy 1
            </Button>
            <Button variant="cosmic" onClick={() => onBuy(district.id, 5)} disabled={!canBuy} aria-disabled={!canBuy}>
              Buy 5
            </Button>
          </div>
        </div>

        {!canBuy && (
          <div className="text-sm text-muted-foreground">{planetId !== 'sarakt-prime' ? 'Only Sarakt sells plots currently.' : 'No plots available.'}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------
// Main App (UnifiedUniverse)
// ----------------------------
export default function UnifiedUniverse({ planets = DEFAULT_PLANETS }) {
  return (
    <UniverseProvider initial={planets}>
      <UnifiedUniverseInner />
    </UniverseProvider>
  );
}

function UnifiedUniverseInner() {
  const { state, dispatch } = useUniverse();
  const [buyModal, setBuyModal] = useState({ open: false, districtId: null, qty: 0 });
  const selectedPlanet = state.selectedPlanetId ? state.planets[state.selectedPlanetId] : null;

  const planetEntries = useMemo(() => Object.entries(state.planets), [state.planets]);

  const openPlanet = (id) => dispatch({ type: 'SELECT_PLANET', payload: id });
  const closePlanet = () => dispatch({ type: 'CLOSE_PLANET' });

  const handleBuyClick = (districtId, qty) => {
    setBuyModal({ open: true, districtId, qty });
  };

  const confirmBuy = () => {
    if (!selectedPlanet) return setBuyModal({ open: false, districtId: null, qty: 0 });
    dispatch({ type: 'BUY_PLOT', payload: { planetId: selectedPlanet.id, districtId: buyModal.districtId, quantity: buyModal.qty } });
    setBuyModal({ open: false, districtId: null, qty: 0 });
  };

  // helper to find district details from selectedPlanet
  const currentDistrict = selectedPlanet && selectedPlanet.districts.find(d => d.id === buyModal.districtId);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto px-4 pb-16 max-w-7xl">
        <Hero />

        <QuickStats planets={state.planets} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {planetEntries.map(([id, planet]) => (
                <PlanetCard key={id} planet={planet} onSelect={openPlanet} />
              ))}
            </div>

            {selectedPlanet ? (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-4xl font-bold">{selectedPlanet.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedPlanet.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-lg">{selectedPlanet.status}</Badge>
                    <Button variant="ghost" onClick={closePlanet}><X className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(Array.isArray(selectedPlanet.features) ? selectedPlanet.features : []).map((f, i) => (
                    <Badge key={i} variant="outline">{String(f)}</Badge>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(Array.isArray(selectedPlanet.districts) ? selectedPlanet.districts : []).map(d => (
                    <DistrictCard key={d.id} planetId={selectedPlanet.id} district={d} onBuy={(districtId, qty) => handleBuyClick(districtId, qty)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">Select a planet to view districts and buy plots. Only Sarakt Prime sells plots currently.</div>
            )}
          </div>

          <aside>
            <div className="sticky top-28 space-y-6">
              <div>
                <PlanetStats planet={selectedPlanet || { population: 0, coverage: 0, districts: [] }} />
              </div>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">Wallet (Simulated)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold">1200 xBGL</p>
                    </div>
                    <Coins className="w-8 h-8 text-primary opacity-60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Only Sarakt Prime (id: "sarakt-prime") can sell plots at the moment. Buying updates the in-memory state. Hook this to your backend or smart contract flow when ready.</p>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={buyModal.open} onClose={() => setBuyModal({ open: false, districtId: null, qty: 0 })}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Confirm Purchase</h3>
          <Button variant="ghost" onClick={() => setBuyModal({ open: false, districtId: null, qty: 0 })}><X className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">You are about to purchase <strong>{buyModal.qty}</strong> plot(s) from <strong>{selectedPlanet ? selectedPlanet.name : '—'}</strong>.</p>

          <div className="bg-muted/10 p-4 rounded-lg">
            <p className="text-sm">District: <strong>{currentDistrict ? currentDistrict.name : '—'}</strong></p>
            <p className="text-sm">Available: <strong>{currentDistrict ? currentDistrict.plots : '—'}</strong></p>
            <p className="text-sm">Price per plot: <strong>{currentDistrict ? currentDistrict.price : '—'} xBGL</strong></p>
            <p className="text-sm">Total: <strong>{currentDistrict ? (currentDistrict.price * buyModal.qty) : '—'} xBGL</strong></p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBuyModal({ open: false, districtId: null, qty: 0 })}>Cancel</Button>
            <Button variant="cosmic" onClick={confirmBuy}><Check className="w-4 h-4" /> Confirm Purchase</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
