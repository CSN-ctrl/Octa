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
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'blue-500',
  },
  {
    icon: MapPin,
    title: HOW_IT_WORKS_COPY.steps.buyPlot.title,
    description: HOW_IT_WORKS_COPY.steps.buyPlot.body,
    step: 2,
    gradient: 'from-purple-500 to-pink-500',
    glow: 'purple-500',
  },
  {
    icon: Hammer,
    title: HOW_IT_WORKS_COPY.steps.applyPermit.title,
    description: HOW_IT_WORKS_COPY.steps.applyPermit.body,
    step: 3,
    gradient: 'from-amber-500 to-orange-500',
    glow: 'amber-500',
  },
];

const PioneersHowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {HOW_IT_WORKS_COPY.badge}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{HOW_IT_WORKS_COPY.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{HOW_IT_WORKS_COPY.intro}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px">
            <div className="absolute left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative group"
            >
              <div className="relative h-full">
                <div className={`absolute -inset-1 bg-gradient-to-r ${step.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`} />
                
                <div className="relative bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 h-full transition-all duration-300 group-hover:border-white/20 group-hover:translate-y-[-4px]">
                  <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center font-bold text-white shadow-lg`}>
                    {step.step}
                  </div>
                  
                  <div className={`w-16 h-16 mx-auto mb-6 mt-4 rounded-2xl bg-gradient-to-br ${step.gradient} p-[1px]`}>
                    <div className="w-full h-full rounded-2xl bg-background/90 flex items-center justify-center">
                      <step.icon className="w-7 h-7 text-foreground" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-center">{step.title}</h3>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PioneersHowItWorksSection;
