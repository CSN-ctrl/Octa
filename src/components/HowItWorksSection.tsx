import { motion } from 'framer-motion';
import { Wallet, MapPin, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Activate Your Account',
    description: 'Deposit USDC and convert to xBGL to unlock participation across the Sarakt economy',
    step: 1,
  },
  {
    icon: MapPin,
    title: 'Secure Your First Asset',
    description: 'Acquire land and choose your path: operate property, join the workforce, or launch production',
    step: 2,
  },
  {
    icon: Trophy,
    title: 'Scale Into Governance',
    description: 'Expand from local operations to city, planet, and solar-system coordination as the world evolves',
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
          <h2 className="section-title mb-4">How Sarakt Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sarakt is the Genesis world of Chaos Star Universe - a World-as-a-Service platform where ownership, AI
            populations, and interdependent economies work together.
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
