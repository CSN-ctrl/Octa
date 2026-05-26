import { motion } from 'framer-motion';
import { Bitcoin, Building2, Check, Sparkles } from 'lucide-react';

const PrizesSection = () => {
  return (
    <section className="relative py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title mb-4">Genesis Participation Incentives</h2>
          <p className="text-lg text-muted-foreground">
            Early participants receive campaign incentives on top of platform access
          </p>
        </motion.div>

        {/* Prize Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* BTC Prize */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8 relative overflow-hidden"
            style={{ boxShadow: '0 0 30px hsl(45 100% 51% / 0.15)' }}
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-gold/20 to-transparent" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(45 100% 51% / 0.15)' }}>
                  <Bitcoin className="w-8 h-8 text-gold" />
                </div>
                <span className="badge-gold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Grand Prize
                </span>
              </div>

              <h3 className="text-3xl font-bold text-gold mb-2">1 BTC</h3>
              <p className="text-muted-foreground mb-6">
                Campaign draw for eligible Genesis participants
              </p>

              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Requirements</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Purchase at least 1 land plot</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Comment 3 times on Twitter, TikTok, Instagram</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Share all 3 social channels</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Eligibility:</span> All 10,000 participants eligible
                </p>
              </div>
            </div>
          </motion.div>

          {/* Income Structure Prize */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8 relative overflow-hidden"
            style={{ boxShadow: '0 0 30px hsl(142 76% 45% / 0.15)' }}
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-success/20 to-transparent" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(142 76% 45% / 0.15)' }}>
                  <Building2 className="w-8 h-8 text-success" />
                </div>
                <span className="badge-success">
                  <Check className="w-3 h-3 mr-1" />
                  Guaranteed
                </span>
              </div>

              <h3 className="text-3xl font-bold text-success mb-2">Income Structure</h3>
              <p className="text-muted-foreground mb-6">
                Included for the first 5,000 participants
              </p>

              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Value: <span className="text-foreground">150 EUR</span> (~293 xBGL)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Automatic for participants #1-5,000</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Generates passive income in-game</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Limitation:</span> Limited to first 5,000 pioneers
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PrizesSection;
