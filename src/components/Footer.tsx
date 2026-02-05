import { Link } from "react-router-dom";
import { 
  Shield, 
  Clock, 
  Mail, 
  HelpCircle, 
  BookOpen,
  ExternalLink,
  Twitter,
  Instagram,
  Sparkles,
  ArrowRight,
  Star,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "X (Twitter)",
      href: "https://x.com",
      icon: Twitter,
      color: "hover:text-foreground hover:bg-primary/10 hover:border-primary/40",
    },
    {
      name: "Reddit",
      href: "https://reddit.com",
      icon: null,
      svg: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.963-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      color: "hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/40",
    },
    {
      name: "Instagram",
      href: "https://instagram.com",
      icon: Instagram,
      color: "hover:text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/40",
    },
    {
      name: "TikTok",
      href: "https://tiktok.com",
      icon: null,
      svg: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      color: "hover:text-foreground hover:bg-primary/10 hover:border-primary/40",
    },
  ];

  const quickLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Sparkles },
    { to: "/invest", label: "Invest", icon: Star },
    { to: "/deposit", label: "Deposit", icon: Zap },
    { to: "/affiliate", label: "Affiliate", icon: Sparkles },
    { to: "/universe", label: "Universe", icon: Star },
  ];

  const resources = [
    { href: "#support", label: "Support", icon: HelpCircle },
    { href: "#faq", label: "FAQ", icon: HelpCircle },
    { to: "/how-it-works", label: "How It Works", icon: BookOpen },
    { to: "/lore", label: "Lore", icon: BookOpen },
    { href: "mailto:support@chaosstaruniverse.com", label: "Contact", icon: Mail },
  ];

  const legalLinks = [
    { href: "#terms", label: "Terms of Service" },
    { href: "#privacy", label: "Privacy Policy" },
    { href: "#cookies", label: "Cookie Policy" },
    { href: "#compliance", label: "Compliance" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-muted/30 to-background/50" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      
      {/* Glow effects */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Brand Section - Centered Above Columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 pb-8 border-b border-border/30"
          >
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="flex items-center justify-center">
                <img 
                  src="/logo.jpg" 
                  alt="Chaos Star Universe Logo" 
                  className="h-16 w-16 rounded-lg select-none"
                />
              </div>
              <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                Build your empire in the Chaos Star Universe. Invest in virtual assets and grow your portfolio across galaxies.
              </p>
            </div>
            
            {/* Social Links - Centered */}
            <div className="flex justify-center gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-12 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground transition-all duration-300 ${social.color} group relative overflow-hidden`}
                  aria-label={social.name}
                >
                  <div className="absolute inset-0 bg-gradient-cosmic opacity-0 group-hover:opacity-10 transition-opacity" />
                  {social.icon ? (
                    <social.icon className="w-5 h-5 relative z-10" />
                  ) : (
                    <span className="relative z-10 scale-125">{social.svg}</span>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Main Footer Content - Multi Column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="font-bold mb-4 text-foreground text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Quick Links
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
                        <link.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="flex-1 font-medium">{link.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="font-bold mb-4 text-foreground text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Resources
              </h3>
              <ul className="space-y-2">
                {resources.map((resource) => {
                  const content = (
                    <span className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-1">
                      <div className="w-7 h-7 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
                        <resource.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="flex-1 font-medium">{resource.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </span>
                  );

                  return (
                    <li key={resource.label}>
                      {resource.to ? (
                        <Link to={resource.to}>{content}</Link>
                      ) : (
                        <a href={resource.href}>{content}</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Legal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="font-bold mb-4 text-foreground text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Legal
              </h3>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary group-hover:scale-150 transition-all shrink-0" />
                      <span className="flex-1 font-medium">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="pt-8 border-t border-border/30"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  © {currentYear} <span className="font-semibold text-foreground">Chaos Star Universe</span>. All rights reserved.
                </p>
        </div>
        
              <div className="flex items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-all group"
                >
                  <Shield className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-green-500">Secure Platform</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                >
                  <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-blue-500">24/7 Support</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
