import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, Sparkles, Loader2 } from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';
import heroBackground from '@/assets/hero-background.jpg';
import { useILOStats } from '@/hooks/useILOStats';

const PioneersHeroSection = () => {
  const navigate = useNavigate();
  const { stats, loading } = useILOStats();
  
  const totalSpots = stats.totalSpots;
  const joined = stats.spotsTaken;
  const spotsLeft = stats.spotsRemaining;
  const progress = stats.progressPercentage;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
      {/* Hero background image */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay for readability - more transparent for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
      {/* Purple glow at top */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-70" />
      
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="badge-primary mb-8 inline-flex items-center gap-2"
        >
          <Zap className="w-3 h-3" />
          Genesis Phase • Limited to {totalSpots.toLocaleString()} Pioneers
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-2 text-gradient-cosmic"
        >
          CHAOS STAR
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-foreground"
        >
          UNIVERSE
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl text-muted-foreground mb-12"
        >
          Own digital land. Build your empire. <span className="text-gold font-semibold">Win 1 BTC.</span>
        </motion.p>

        {/* Live Stats - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6 mb-8"
        >
          {/* Live Joined Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent via-primary to-accent rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-500" />
            <div className="relative bg-background/90 backdrop-blur-xl px-8 py-5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-success animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-success animate-ping opacity-75" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Live Now</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-accent">
                    <AnimatedCounter target={joined} duration={2} />
                  </span>
                  <span className="text-muted-foreground">joined</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Spots Left Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-500" />
            <div className="relative bg-background/90 backdrop-blur-xl px-8 py-5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Remaining</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    <AnimatedCounter target={spotsLeft} duration={2} />
                  </span>
                  <span className="text-muted-foreground">spots</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar - Enhanced */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Progress
            </span>
            <span className="text-accent font-bold">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary relative"
              style={{ boxShadow: '0 0 20px hsl(var(--accent) / 0.5)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <button 
            onClick={() => navigate('/deposit')}
            className="btn-primary-glow text-lg animate-pulse-glow"
          >
            Join Genesis Phase
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default PioneersHeroSection;
