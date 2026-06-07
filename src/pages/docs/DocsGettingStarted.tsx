import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";

export default function DocsGettingStarted() {
  const plotPriceXbgl = getPlotPriceInXBGL().toFixed(2);

  const steps = [
    {
      step: 1,
      title: "Create account & connect wallet",
      description:
        "Sign up with email and connect MetaMask, Core Wallet, or another EVM wallet. Phase 1 uses Avalanche Fuji testnet (chain 43113) — not mainnet.",
    },
    {
      step: 2,
      title: "Get test AVAX & deposit",
      description:
        "Use the official Avalanche faucet for test AVAX, then deposit on the Deposit page. AVAX is converted to in-game xBGL via the on-chain treasury contract.",
    },
    {
      step: 3,
      title: "Buy your first plot",
      description: `Open Plot Purchase and pay in xBGL. Phase 1 price is 100 EUR equivalent (~${plotPriceXbgl} xBGL per plot). Ownership is recorded on-chain on Fuji.`,
    },
    {
      step: 4,
      title: "View your land certificate",
      description:
        "After purchase, open your land title certificate from the dashboard. This is your proof of Genesis plot ownership for Phase 1.",
    },
    {
      step: 5,
      title: "Grow on your land (later phases)",
      description:
        "Structures, rental income, businesses, and worker economies unlock in later phases. Phase 1 focuses on land acquisition and activation.",
    },
    {
      step: 6,
      title: "Advanced sovereignty (future)",
      description:
        "City, planet, and star-system ownership are long-term goals — not required for Phase 1 onboarding.",
    },
  ];

  return (
    <DocsLayout
      title="Getting Started"
      description="Phase 1 on Avalanche Fuji: connect wallet, deposit test AVAX, buy a Genesis plot, view your certificate."
    >
      <Card className="glass-card border-primary/30 mb-6">
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Testnet only.</strong> Phase 1 runs on Avalanche Fuji.
            AVAX and xBGL have no real-world value. Need gas?{" "}
            <a
              href="https://faucet.avax.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Get test AVAX from the faucet
            </a>
            .
          </p>
          <p>
            Ready to start?{" "}
            <Link to="/deposit" className="text-primary underline-offset-4 hover:underline">
              Go to Deposit
            </Link>{" "}
            or{" "}
            <Link to="/plot-purchase" className="text-primary underline-offset-4 hover:underline">
              Plot Purchase
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/30">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {steps.map((item, index) => (
              <div key={item.step}>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-5 w-5 text-primary rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
