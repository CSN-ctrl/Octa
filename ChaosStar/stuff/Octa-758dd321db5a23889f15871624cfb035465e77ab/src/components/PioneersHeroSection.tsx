import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Sparkles } from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';
import heroBackground from '@/assets/ChatGPT Image Apr 27, 2026, 08_49_47 AM.png';
import { useILOStats } from '@/hooks/useILOStats';

const PioneersHeroSection = () => {
  const navigate = useNavigate();
  const { stats } = useILOStats();

  const handleJoinClick = () => {
    navigate('/deposit');
  };
  
  const totalSpots = stats.totalSpots;
  const joined = stats.spotsTaken;
  const spotsLeft = stats.spotsRemaining;
  const progress = stats.progressPercentage;

  return (
    <section className="relative min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
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
          INITIAL LAND
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-foreground"
        >
          OFFERING
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
            <span className="text-accent font-bold">
              <AnimatedCounter target={spotsLeft} duration={2} /> spots remaining
            </span>
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
            onClick={handleJoinClick}
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
