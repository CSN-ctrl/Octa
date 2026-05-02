import { motion } from 'framer-motion';
import { Users, Bitcoin, Building2, Target, MapPin } from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useILOStats } from '@/hooks/useILOStats';

const StatsSection = () => {
  const { stats: iloStats } = useILOStats();
  
  // Calculate BTC eligible (example: 1 BTC entry per €1000 raised)
  const btcEligible = Math.floor(iloStats.totalRaisedEUR / 1000);
  
  // Calculate total land bought (each plot costs 110 USDC)
  const totalLandBought = Math.floor(iloStats.totalRaisedUSDC / 110);

const stats = [
  {
    icon: Users,
      value: iloStats.spotsTaken,
    label: 'Pioneers',
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'violet-500/20',
    },
    {
      icon: MapPin,
      value: totalLandBought,
      label: 'Total Land Bought',
      gradient: 'from-emerald-400 to-green-600',
      bgGlow: 'emerald-500/20',
  },
  {
    icon: Bitcoin,
      value: btcEligible,
      label: 'BTC Entries',
      gradient: 'from-amber-400 to-orange-500',
      bgGlow: 'amber-500/20',
  },
  {
    icon: Target,
      value: iloStats.spotsRemaining,
    label: 'Spots Left',
      gradient: 'from-blue-400 to-cyan-500',
      bgGlow: 'blue-500/20',
  },
];

  return (
    <section className="relative py-20 px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-full">
                {/* Glow effect on hover */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500`} />
                
                <div className="relative bg-card/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/10 h-full transition-all duration-300 group-hover:border-white/20 group-hover:translate-y-[-2px]">
                  {/* Icon with gradient background */}
                  <div className={`w-14 h-14 mx-auto mb-5 rounded-xl bg-gradient-to-br ${stat.gradient} p-[1px]`}>
                    <div className="w-full h-full rounded-xl bg-background/80 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                  
                  {/* Value */}
                  <div className={`text-3xl md:text-4xl font-bold mb-2 text-center bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                <AnimatedCounter target={stat.value} duration={2} />
                  </div>
                  
                  {/* Label */}
                  <p className="text-sm text-muted-foreground text-center font-medium">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
