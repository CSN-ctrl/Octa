import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import heroImage from '/assets/hero-space.jpg';

export function Hero() {
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
