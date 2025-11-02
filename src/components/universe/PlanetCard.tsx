import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import type { Planet } from '@/types/universe';

export function PlanetCard({ planet, onSelect }: { planet: Planet; onSelect: (id: string) => void }) {
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
