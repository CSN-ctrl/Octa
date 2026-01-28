import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useILOStats } from '@/hooks/useILOStats';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const CTASection = () => {
  const navigate = useNavigate();
  const { stats } = useILOStats();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const joined = stats.spotsTaken;
  const spotsLeft = stats.spotsRemaining;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleStartClick = () => {
    if (isAuthenticated) {
      navigate('/deposit');
    } else {
      toast.info("Please register to get started");
      navigate('/register');
    }
  };

  return (
    <section className="relative py-24 px-4 bg-muted/30">
      {/* Background glow */}
      <div className="absolute inset-0 bg-hero-glow opacity-50 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-primary mb-8">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Genesis Phase is Live
          </div>

          {/* Heading */}
          <h2 className="section-title mb-6">
            Ready to Become a Pioneer?
          </h2>

          <p className="text-lg text-muted-foreground mb-10">
            Join <span className="text-foreground font-semibold"><AnimatedCounter target={joined} duration={1.5} /></span> others who've already secured their place in the Chaos Star Universe
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartClick}
              className="btn-primary-glow text-lg w-full sm:w-auto"
            >
              Start Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary-glow text-lg w-full sm:w-auto"
            >
              Learn More
            </motion.button>
          </div>

          {/* Remaining spots */}
          <p className="text-sm text-muted-foreground">
            Only <span className="text-accent font-semibold"><AnimatedCounter target={spotsLeft} duration={1.5} /></span> spots remaining
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
