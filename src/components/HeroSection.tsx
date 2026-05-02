import { motion } from 'framer-motion';
import { ChevronDown, Zap, Users } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import heroBackground from '@/assets/hero-background.jpg';

const HeroSection = () => {
  const totalSpots = 10000;
  const joined = 3847;
  const spotsLeft = totalSpots - joined;
  const progress = (joined / totalSpots) * 100;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Hero background image */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      {/* Purple glow at top */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      
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
          Genesis Phase • Limited to 10,000 Pioneers
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.08] mb-8 text-balance"
        >
          <span className="text-gradient-cosmic">CHAOS STAR UNIVERSE</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed text-balance font-medium"
        >
          Own digital land. Build your empire. <span className="text-gold font-semibold">Win 1 BTC.</span>
        </motion.p>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 mb-8"
        >
          <div className="glass-card px-6 py-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">Live</span>
            <span className="stat-value text-2xl text-accent">
              <AnimatedCounter target={joined} duration={2} />
            </span>
            <span className="text-muted-foreground">joined</span>
          </div>
          
          <div className="glass-card px-6 py-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <span className="stat-value text-2xl text-primary">
              <AnimatedCounter target={spotsLeft} duration={2} />
            </span>
            <span className="text-muted-foreground">spots left</span>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-accent font-semibold">{progress.toFixed(1)}% Complete</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-cosmic"
              style={{ boxShadow: 'var(--shadow-primary)' }}
            />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <button className="btn-primary-glow text-lg animate-pulse-glow">
            Join Genesis Phase
          </button>
          <p className="text-sm text-muted-foreground">
            Starting at <span className="text-foreground font-medium">100 EUR</span> (~196 xBGL) per plot
          </p>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.a
        href="#how-it-works"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <span className="text-sm">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default HeroSection;
