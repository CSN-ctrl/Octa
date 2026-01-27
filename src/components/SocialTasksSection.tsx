import { motion } from 'framer-motion';
import { Twitter, MessageCircle, Instagram, Check, ExternalLink } from 'lucide-react';

const socials = [
  {
    platform: 'X',
    handle: '@ChaosStarHQ',
    icon: Twitter,
    gradient: 'from-[#000000] to-[#1a1a1a]',
    tasks: ['Follow our account', '3 comments (3+ hrs apart)', 'Share our content'],
    url: 'https://x.com/ChaosStarHQ',
  },
  {
    platform: 'TikTok',
    handle: '@ChaosStarUniverse',
    icon: MessageCircle,
    gradient: 'from-[#ff0050] via-[#00f2ea] to-[#ff0050]',
    tasks: ['Follow our account', '3 comments (3+ hrs apart)', 'Share our content'],
    url: 'https://tiktok.com/@ChaosStarUniverse',
  },
  {
    platform: 'Instagram',
    handle: '@ChaosStarUniverse',
    icon: Instagram,
    gradient: 'from-[#f09433] via-[#dc2743] to-[#bc1888]',
    tasks: ['Follow our account', '3 comments (3+ hrs apart)', 'Share our content'],
    url: 'https://instagram.com/ChaosStarUniverse',
  },
];

const SocialTasksSection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            🎯 Qualify for 1 BTC
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Complete Social Tasks</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Engage with our community to qualify for the 1 BTC prize
          </p>
        </motion.div>

        {/* Social Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {socials.map((social, index) => (
            <motion.a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative block"
            >
              {/* Glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${social.gradient} rounded-2xl opacity-0 group-hover:opacity-50 blur-xl transition-all duration-500`} />
              
              <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden h-full transition-all duration-300 group-hover:border-white/20 group-hover:translate-y-[-4px]">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${social.gradient} p-6 relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <social.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{social.platform}</h3>
                      <p className="text-white/80 text-sm font-mono">{social.handle}</p>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-6 space-y-3">
                  {social.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-success/50 transition-colors">
                        <Check className="w-3 h-3 text-muted-foreground/50 group-hover:text-success/70 transition-colors" />
                      </div>
                      <span className="text-muted-foreground">{task}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${social.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <span className="text-white font-medium text-sm">Visit {social.platform}</span>
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialTasksSection;
