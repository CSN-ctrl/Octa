import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  Users, 
  Shield, 
  TrendingUp, 
  Building2, 
  Factory, 
  Globe2, 
  Sparkles,
  ArrowRight,
  Lock,
  Unlock,
  UserCheck,
  Coins,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Invest = () => {
  const navigate = useNavigate();

  const assetTypes = [
    { icon: "🏠", name: "Land Plots" },
    { icon: "🏭", name: "Houses/Factories" },
    { icon: "🌆", name: "Cities" },
    { icon: "🪐", name: "Planets" },
    { icon: "⭐", name: "Star Systems" },
  ];

  const fundFeatures = [
    {
      icon: Lock,
      title: "20% Reserve Rule",
      description: "Minimum locked per asset for security",
      color: "text-yellow-500",
    },
    {
      icon: Unlock,
      title: "free funds",
      description: "Redeemable or use for more acquisitions",
      color: "text-green-500",
    },
    {
      icon: Shield,
      title: "Full Liquidation",
      description: "Required to exit completely",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="app-page-canvas relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Investment Portal
          </Badge>
          <h1 className="text-4xl md:text-6xl font-semibold mb-6">
            Your{" "}
            <span className="bg-gradient-cosmic bg-clip-text text-transparent text-4xl md:text-6xl font-semibold">
              Personal Fund
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All payments go into your personal USDC fund. Build your empire by acquiring assets across the Chaos Star Universe.
          </p>
        </motion.div>

        {/* Fund Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16"
        >
          {fundFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 p-4 bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl"
            >
              <div className={`p-2 rounded-lg bg-background/50 ${feature.color}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Asset Types Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {assetTypes.map((asset, index) => (
            <motion.div
              key={asset.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full"
            >
              <span className="text-xl">{asset.icon}</span>
              <span className="text-sm font-medium">{asset.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Self Management Option */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative h-full overflow-hidden border-2 border-border/50 bg-card hover:border-accent/50 transition-all duration-300 group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardContent className="p-8 relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-accent to-accent/80">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Self Deposit</h2>
                    <p className="text-muted-foreground">Self Management</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  Take full control of your investments. Deposit USDC directly and manage your own asset purchases.
                </p>

                <div className="space-y-3 mb-8 flex-grow">
                  <div className="flex items-start gap-3">
                    <Coins className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Direct USDC Deposit</p>
                      <p className="text-xs text-muted-foreground">Multi-network support (ETH, AVAX, Polygon...)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Full Control</p>
                      <p className="text-xs text-muted-foreground">You decide what and when to buy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Instant xBGL Credit</p>
                      <p className="text-xs text-muted-foreground">Automatic conversion at best rates</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/deposit")}
                  variant="outline"
                  className="w-full h-12 text-lg font-semibold border-2 hover:bg-accent/10 hover:border-accent transition-all mt-auto"
                >
                  Deposit USDC
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expert Management Option */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative h-full overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/50 transition-all duration-300 group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Recommended Badge */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              </div>

              <CardContent className="p-8 relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-cosmic">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Talk to Expert</h2>
                    <p className="text-muted-foreground">Managed Investment</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  Work with a dedicated consultant who manages your investments professionally. Let experts grow your portfolio.
                </p>

                <div className="space-y-3 mb-8 flex-grow">
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Personal Consultant</p>
                      <p className="text-xs text-muted-foreground">Dedicated expert managing your portfolio</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Professional Asset Management</p>
                      <p className="text-xs text-muted-foreground">Revenue share on managed assets</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Strategic Acquisitions</p>
                      <p className="text-xs text-muted-foreground">Expert guidance on high-value assets</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/apply-expert")}
                  className="w-full bg-gradient-cosmic hover:opacity-90 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-primary/30 transition-all mt-auto"
                >
                  Talk to Expert
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 max-w-2xl mx-auto"
        >
          <p className="text-sm text-muted-foreground">
            Both options build your Personal Fund. The 20% reserve rule applies to all asset acquisitions.
            <br />
            <span className="text-foreground font-medium">Your fund, your universe.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Invest;
