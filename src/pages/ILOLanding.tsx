import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Gift,
  Trophy,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lock,
  Unlock,
  Building2,
  Coins,
  Star,
  Zap,
  Shield,
  Globe,
  Twitter,
  Instagram,
  Music,
  Share2,
  MessageSquare,
  Loader2,
  Rocket,
  Crown,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PLOT_PRICE_EUR, PLOT_PRICE_XBGL, EUR_TO_XBGL } from "@/lib/ilo-service";

// Price conversion: 1 EUR = 1.955833 xBGL (initial price, not pegged)

export default function ILOLanding() {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const [iloStatus, setILOStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadILOData();
    // Refresh every 30 seconds
    const interval = setInterval(loadILOData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadILOData = async () => {
    setLoading(true);
    try {
      // Load ILO status
      const { data: phase } = await (supabase as any)
        .from("ilo_phases")
        .select("*")
        .eq("phase_name", "genesis")
        .single();

      // Load stats
      const { data: genesisStats } = await (supabase as any)
        .from("genesis_stats")
        .select("*")
        .single();

      // Load participant count
      const { count: participants } = await (supabase as any)
        .from("ilo_participants")
        .select("*", { count: "exact", head: true });

      setILOStatus({
        isOpen: phase?.phase_status === 'active',
        plotsRemaining: Math.max(0, (phase?.max_participants || 10000) - (participants || 0)),
        totalPlots: phase?.max_participants || 10000,
        secondaryMarketActive: phase?.secondary_market_active || false,
      });

      setStats({
        totalParticipants: participants || 0,
        eligibleForBTC: genesisStats?.eligible_for_btc || 0,
        structuresDistributed: genesisStats?.structures_distributed || 0,
        btcWinnerSelected: genesisStats?.btc_winner_selected || false,
      });
    } catch (error) {
      console.error("Failed to load ILO data:", error);
      // Set defaults if tables don't exist yet
      setILOStatus({
        isOpen: true,
        plotsRemaining: 10000,
        totalPlots: 10000,
        secondaryMarketActive: false,
      });
      setStats({
        totalParticipants: 0,
        eligibleForBTC: 0,
        structuresDistributed: 0,
        btcWinnerSelected: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (!isConnected) {
      navigate("/login");
    } else {
      navigate("/dashboard?tab=purchase-plots");
    }
  };

  const progress = iloStatus
    ? ((iloStatus.totalPlots - iloStatus.plotsRemaining) / iloStatus.totalPlots) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
        </div>

        <div className="relative container mx-auto px-4 py-20 text-center z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Badge */}
            <div className="flex justify-center">
              <Badge className="bg-gradient-cosmic text-white border-primary/50 text-lg px-6 py-2 h-auto">
                <Sparkles className="w-5 h-5 mr-2" />
                Initial Land Offering
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-cosmic bg-clip-text text-transparent">
              </span>
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground/90">
              Genesis Phase
            </h2>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join the first 10,000 pioneers and secure your place in the Chaos Star Universe.
              <br />
              <span className="text-primary font-semibold">Win 1 BTC</span> or receive a{" "}
              <span className="text-primary font-semibold">complimentary income structure</span>.
            </p>

            {/* Progress Bar */}
            {iloStatus && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Genesis Phase Progress</span>
                  <span className="font-semibold">
                    {iloStatus.totalPlots - iloStatus.plotsRemaining} / {iloStatus.totalPlots}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                  {iloStatus.plotsRemaining > 0 ? (
                    <>
                      <span className="text-primary">{iloStatus.plotsRemaining.toLocaleString()}</span>
                      <span className="text-muted-foreground">plots remaining</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Genesis Phase Complete</span>
                  )}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-gradient-cosmic hover:opacity-90 shadow-glow-primary"
                onClick={handleGetStarted}
                disabled={!iloStatus?.isOpen && !iloStatus?.secondaryMarketActive}
              >
                {iloStatus?.isOpen ? (
                  <>
                    <Rocket className="h-5 w-5 mr-2" />
                    Join Genesis Phase
                  </>
                ) : iloStatus?.secondaryMarketActive ? (
                  <>
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Go to Secondary Market
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Phase Closed
                  </>
                )}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              {iloStatus?.isOpen && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto"
                  onClick={() => navigate("/ilo")}
                >
                  View Full Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold">{stats.totalParticipants.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Participants</div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold">{stats.eligibleForBTC.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">BTC Eligible</div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold">{stats.structuresDistributed.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Structures Given</div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold">
                  {stats.btcWinnerSelected ? "✓" : "—"}
                </div>
                <div className="text-sm text-muted-foreground">BTC Winner</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* What is ILO Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">What is the ILO?</h2>
            <p className="text-xl text-muted-foreground">
              The Initial Land Offering (ILO) is the Genesis Phase of land distribution in the Chaos Star Universe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/30">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Genesis Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The first 10,000 land plots are available at the exclusive Genesis price of {PLOT_PRICE_EUR} EUR equivalent (paid in USDC, displayed as ~{PLOT_PRICE_XBGL.toFixed(2)} xBGL).
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Limited Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Once 10,000 plots are sold, the ILO closes and the secondary market opens for peer-to-peer trading.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Early Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Genesis Phase participants receive early access to Phase 2 and exclusive benefits.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Prizes Section */}
      <div className="container mx-auto px-4 py-16 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl my-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Genesis Phase Prizes</h2>
            <p className="text-xl text-muted-foreground">
              Complete all requirements for a chance to win incredible prizes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 1 BTC Prize */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-primary/20">
                    <Trophy className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl">1 BTC Prize</CardTitle>
                    <CardDescription className="text-lg">
                      Random selection from eligible participants
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Purchase at least 1 land plot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Comment 3 times (3+ hours apart) on Twitter, TikTok, Instagram</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Share all 3 channels</span>
                  </div>
                </div>
                <Badge variant="default" className="w-full justify-center py-2">
                  All Genesis Phase Participants Eligible
                </Badge>
              </CardContent>
            </Card>

            {/* Income Structure Prize */}
            <Card className="border-accent/50 bg-gradient-to-br from-accent/10 to-accent/5">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-accent/20">
                    <Building2 className="h-10 w-10 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl">Income Structure</CardTitle>
                    <CardDescription className="text-lg">
                      Complimentary for first 5,000 participants
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>Value: 150 EUR equivalent (~{(150 * EUR_TO_XBGL).toFixed(2)} xBGL)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>Automatic for participants #1-5,000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span>Basic income generating structure</span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-full justify-center py-2">
                  First 5,000 Participants Only
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple steps to join the Genesis Phase
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Purchase Your First Plot</h3>
                    <p className="text-muted-foreground">
                      Buy at least 1 land plot for {PLOT_PRICE_EUR} EUR equivalent (paid in USDC, displayed as ~{PLOT_PRICE_XBGL.toFixed(2)} xBGL) to become a Genesis Phase participant.
                      You'll receive a unique participation number (1-10,000).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Complete Social Media Tasks</h3>
                    <p className="text-muted-foreground mb-3">
                      To be eligible for the 1 BTC prize, complete these tasks:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { name: 'Twitter', icon: Twitter },
                        { name: 'TikTok', icon: Music },
                        { name: 'Instagram', icon: Instagram },
                      ].map(({ name, icon: Icon }) => (
                        <div key={name} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <Icon className="h-4 w-4" />
                            {name}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>3 comments (3+ hrs apart)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              <span>Share channel</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Win Prizes & Get Early Access</h3>
                    <p className="text-muted-foreground">
                      Once you complete all requirements, you're eligible for the 1 BTC random draw.
                      All Genesis Phase participants receive early access to Phase 2 when it launches.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Phase Transition Info */}
      <div className="container mx-auto px-4 py-16">
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
          <CardContent className="p-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">What Happens After Genesis Phase?</h2>
              </div>
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">ILO Closes</div>
                    <p className="text-sm text-muted-foreground">
                      Once 10,000 plots are sold, the Initial Land Offering closes permanently.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Secondary Market Opens</div>
                    <p className="text-sm text-muted-foreground">
                      Participants can now buy and sell plots to each other on the secondary market.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Early Access to Phase 2</div>
                    <p className="text-sm text-muted-foreground">
                      All Genesis Phase participants receive exclusive early access when Phase 2 launches.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16">
        <Card className="border-primary/50 bg-gradient-cosmic">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Join Genesis Phase?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Secure your place among the first 10,000 pioneers and unlock exclusive benefits
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-background text-foreground hover:bg-background/90"
              onClick={handleGetStarted}
              disabled={!iloStatus?.isOpen && !iloStatus?.secondaryMarketActive}
            >
              {iloStatus?.isOpen ? (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Start Your Journey
                </>
              ) : iloStatus?.secondaryMarketActive ? (
                <>
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Explore Secondary Market
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Phase Closed
                </>
              )}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

