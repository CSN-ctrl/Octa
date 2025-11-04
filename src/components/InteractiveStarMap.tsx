// components/InteractiveStarMap.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Globe, Rocket, Zap, Users, Sparkles, DollarSign, Loader2 } from "lucide-react";
import { useCelestialForge } from "@/hooks/useCelestialForge";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";

export default function InteractiveStarMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  const { userStarSystems, spawnStarSystem, STAR_SYSTEM_COST, loading } = useCelestialForge();
  const { address, isConnected } = useWallet();

  // Drag & Zoom (same as before)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0, startY = 0;

    const onDown = (e: any) => {
      setIsDragging(true);
      startX = ("touches" in e ? e.touches[0].clientX : e.clientX) - pan.x;
      startY = ("touches" in e ? e.touches[0].clientY : e.clientY) - pan.y;
    };
    const onMove = (e: any) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setPan({ x: clientX - startX, y: clientY - startY });
    };
    const onUp = () => setIsDragging(false);

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, pan]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 4));
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden cursor-grab active:cursor-grabbing" onWheel={handleWheel}>
      {/* Nebula & Stars */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        {[...Array(120)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 6}s` }}
          />
        ))}
      </div>

      {/* Galaxy */}
      <motion.div className="absolute inset-0" style={{ scale: zoom, x: pan.x, y: pan.y }}>
        {userStarSystems.map((sys, i) => {
          const x = 150 + (i % 8) * 280 + Math.random() * 80;
          const y = 150 + Math.floor(i / 8) * 280 + Math.random() * 80;

          return (
            <motion.button
              key={sys.id}
              className="absolute group"
              style={{ left: x, top: y }}
              onClick={() => setSelectedSystem(sys)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-xl animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 shadow-2xl border-4 border-white/30 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Spawn Button */}
        <motion.button
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group"
          whileHover={{ scale: 1.2 }}
          onClick={() => {
            const name = prompt("Name your star system:");
            if (name) spawnStarSystem(name, 5);
          }}
        >
          <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-dashed border-white/50 backdrop-blur flex items-center justify-center hover:border-primary hover:bg-white/20 transition-all">
            <Rocket className="w-10 h-10 text-white group-hover:text-primary" />
          </div>
        </motion.button>
      </motion.div>

      {/* HUD */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <Button size="sm" variant="glass" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</Button>
        <Button size="sm" variant="glass" onClick={() => setZoom(z => z * 1.3)}>+</Button>
        <Button size="sm" variant="glass" onClick={() => setZoom(z => z * 0.7)}>-</Button>
      </div>

      {/* Trading Panel */}
      <AnimatePresence>
        {selectedSystem && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 right-8 glass p-6 rounded-2xl border border-primary/30 max-w-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
                {selectedSystem.name}
              </h3>
              <Button size="icon" variant="ghost" onClick={() => setSelectedSystem(null)}>×</Button>
            </div>

            {/* Commented out - Trading functionality not yet implemented */}
            {/*
            {selectedSystem.forSale ? (
              <div className="space-y-4">
                <Badge className="w-full justify-center text-lg py-3 bg-yellow-500 text-black">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Listed: {selectedSystem.price} AVAX
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
                <div>
                  <Label htmlFor="price">List for Sale (AVAX)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.5"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="glass mt-2"
                  />
                </div>
                <Button
                  className="w-full"
                  variant="cosmic"
                  disabled={isListing || !price || parseFloat(price) <= 0}
                  onClick={handleListForSale}
                >
                  {isListing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Listing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      List for Sale
                    </>
                  )}
                </Button>
              </div>
            )}
            */}

            <div className="space-y-4">
              <div>
                <Label>Planets</Label>
                <p className="text-2xl font-bold">{selectedSystem.planets?.length || 0}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-3" onClick={() => setSelectedSystem(null)}>
              Enter System
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
