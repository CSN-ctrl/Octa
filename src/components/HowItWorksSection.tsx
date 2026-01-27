import { motion } from 'framer-motion';
import { Wallet, MapPin, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Deposit USDC',
    description: 'Convert USDC to xBGL through our secure deposit system',
    step: 1,
  },
  {
    icon: MapPin,
    title: 'Purchase Plot',
    description: 'Get your plot for 100 EUR (~196 xBGL)',
    step: 2,
  },
  {
    icon: Trophy,
    title: 'Win Prizes',
    description: 'Chance to win 1 BTC or receive income structure',
    step: 3,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title mb-4">Three Simple Steps</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of pioneers in the Chaos Star Universe
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}
              
              <div className="glass-card p-8 text-center relative z-10 h-full">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
