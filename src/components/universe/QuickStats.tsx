import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Star, Building2, Package } from 'lucide-react';
import type { Planet } from '@/types/universe';

export function QuickStats({ planets }: { planets: Record<string, Planet> }) {
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
