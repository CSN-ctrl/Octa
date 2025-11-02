import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, MapPin, Building2, Globe } from 'lucide-react';
import type { Planet } from '@/types/universe';

export function PlanetStats({ planet }: { planet: Planet | null }) {
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
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
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
