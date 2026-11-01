import { motion } from 'framer-motion';
import { Wallet, MapPin, Hammer } from 'lucide-react';
import { getDepositNetworkId } from '@/config/blockchain-profile';
import {
  getIloDepositStepDescription,
  getIloDepositStepTitle,
  HOW_IT_WORKS_COPY,
} from '@/lib/genesis-product-copy';

const depositNetworkId = getDepositNetworkId();

const steps = [
  {
    icon: Wallet,
    title: getIloDepositStepTitle(depositNetworkId),
    description: getIloDepositStepDescription(depositNetworkId),
    step: 1,
  },
  {
    icon: MapPin,
    title: HOW_IT_WORKS_COPY.steps.buyPlot.title,
    description: HOW_IT_WORKS_COPY.steps.buyPlot.body,
    step: 2,
  },
  {
    icon: Hammer,
    title: HOW_IT_WORKS_COPY.steps.applyPermit.title,
    description: HOW_IT_WORKS_COPY.steps.applyPermit.body,
    step: 3,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title mb-4">{HOW_IT_WORKS_COPY.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{HOW_IT_WORKS_COPY.intro}</p>
        </motion.div>

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
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}
              
              <div className="glass-card p-8 text-center relative z-10 h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
                
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
