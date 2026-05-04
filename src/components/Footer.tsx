import { Link } from "react-router-dom";
import { 
  Shield, 
  Clock, 
  Mail, 
  HelpCircle, 
  BookOpen,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Star,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { Cosmic3dShell } from "@/components/cosmic-3d-shell";
import { ChaosStarLogo3DLink } from "@/components/chaos-star-logo-3d-link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const tiktokNotePath =
    "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z";

  /** All inline SVGs — avoids stray Lucide identifiers and matches official brand hex values. */
  const socialLinks: { name: string; href: string; svg: React.ReactNode }[] = [
    {
      name: "X",
      href: "https://x.com/OIG_CSN",
      svg: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {/* x.com: inverse logo on dark UI = white (#FFFFFF); on light UI brand uses black (#000000). */}
          <path
            fill="#FFFFFF"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      ),
    },
    {
      name: "Reddit",
      href: "https://reddit.com",
      svg: (
        <svg className="w-4 h-4 overflow-visible" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <g transform="translate(12 12) scale(1.1) translate(-12 -12)">
            <path
              fill="#FF4500"
              d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.963-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
            />
          </g>
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://instagram.com",
      svg: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <linearGradient id="footer-social-ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F58529" />
              <stop offset="35%" stopColor="#DD2A7B" />
              <stop offset="65%" stopColor="#8134AF" />
              <stop offset="100%" stopColor="#515BD4" />
            </linearGradient>
          </defs>
          <path
            fill="url(#footer-social-ig-gradient)"
            d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.135.03zm0 3.678c-3.924 0-7.107 3.183-7.107 7.107s3.183 7.107 7.107 7.107 7.107-3.183 7.107-7.107-3.183-7.107-7.107-7.107zm0 11.713c-2.549 0-4.616-2.065-4.616-4.606s2.067-4.606 4.616-4.606 4.606 2.065 4.606 4.606-2.067 4.606-4.606 4.606zm7.132-11.967c0 .919-.745 1.664-1.664 1.664-.919 0-1.664-.745-1.664-1.664 0-.919.745-1.664 1.664-1.664.919 0 1.664.745 1.664 1.664z"
          />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "https://tiktok.com",
      svg: (
        <svg className="w-4 h-4 overflow-visible" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          {/* TikTok brand palette: #69C9D0 (Sea Serpent), #EE1D52 (red), #FFFFFF, #010101 */}
          <path fill="#69C9D0" d={tiktokNotePath} transform="translate(-1.15 -1.15)" />
          <path fill="#EE1D52" d={tiktokNotePath} transform="translate(1.15 1.15)" />
          <path fill="#FFFFFF" d={tiktokNotePath} />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Sparkles },
    { to: "/invest", label: "Invest", icon: Star },
    { to: "/deposit", label: "Deposit", icon: Zap },
    { to: "/universe", label: "Universe", icon: Star },
  ];

  const resources = [
    { to: "/support", label: "Support", icon: HelpCircle },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
    { to: "/how-it-works", label: "How It Works", icon: BookOpen },
    { to: "/lore", label: "Lore", icon: BookOpen },
    { href: "mailto:support@sarakt.com", label: "Contact", icon: Mail },
  ];

  const legalLinks = [
    { to: "/terms", label: "Terms of Service" },
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/cookies", label: "Cookie Policy" },
    { to: "/compliance", label: "Compliance" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/[0.06]">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(hsl(260_22%_100%/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(260_22%_100%/0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] bg-primary/[0.06] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/[0.05] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Brand Section - Centered Above Columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 pb-10 border-b border-white/[0.06]"
          >
            {/* Brand logo + socials share the same 3D tilt / lift interaction */}
            <Cosmic3dShell className="flex w-full flex-col items-center gap-5 mb-6">
              <ChaosStarLogo3DLink variant="footer" />
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed tracking-wide text-center">
                Build your empire in the Chaos Star Universe. Invest in virtual assets and grow your portfolio across galaxies.
              </p>
              <div className="parent">
              {socialLinks.map((social, index) => (
                  <motion.div
                  key={social.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.35 }}
                    className="flex"
                  >
                    <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                      className={`child child-${index + 1} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                  aria-label={social.name}
                >
                      <span className={`button btn-${index + 1}`}>
                        <span className="footer-social-icon scale-125" aria-hidden>
                          {social.svg}
                        </span>
                      </span>
                    </a>
                  </motion.div>
              ))}
            </div>
            </Cosmic3dShell>
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
              <h3 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary opacity-90" />
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
              <h3 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-primary opacity-90" />
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
              <h3 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary opacity-90" />
                Legal
              </h3>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary group-hover:scale-150 transition-all shrink-0" />
                      <span className="flex-1 font-medium">{link.label}</span>
                    </Link>
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
            className="pt-8 border-t border-white/[0.06]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  © {currentYear} <span className="font-medium text-foreground">Chaos Star Universe</span>. All rights reserved.
                </p>
        </div>
        
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/95">Secure</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/[0.08] border border-sky-500/20">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-sky-400/95">24/7 Support</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
