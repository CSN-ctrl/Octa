import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { ArrowRight } from "lucide-react";

export default function DocsGettingStarted() {
  const steps = [
    {
      step: 1,
      title: "Connect Your Wallet",
      description: "Use MetaMask, Core Wallet, Coinbase Wallet, or Brave Wallet. Your wallet connects directly to the platform."
    },
    {
      step: 2,
      title: "Register Digital ID",
      description: "Digital ID will be introduced in a later phase. Initial access and participation in Phase 1 do not require Digital ID."
    },
    {
      step: 3,
      title: "Choose Your Path",
      description: "If you want to be a Landowner: Purchase plots in Phase 1 (10,000 participants). Each participant can buy multiple plots. Price: 100 EUR equivalent in xBGL per plot (1 EUR = 1.955833 xBGL), paid in USDC. If you want to be a Worker: Browse job listings, apply for jobs, get hired, and rent housing from landowners."
    },
    {
      step: 4,
      title: "Start Earning",
      description: "As a Landowner: Build or buy structures on your plots, list structures for rent, earn rental income when citizens need homes. As a Worker: Work at businesses powered by citizen demand, earn wages, pay rent from wages, save earnings to buy plots later."
    },
    {
      step: 5,
      title: "Expand and Grow",
      description: "Buy more plots (landowners), build more structures, create businesses, hire workers, scale your operations—scale where population and spending are strongest."
    },
    {
      step: 6,
      title: "Advanced Options",
      description: "Consider city ownership (sovereignty), consider planet ownership (complete control), consider star system ownership (ultimate sovereignty), create your own rules and economy."
    }
  ];

  return (
    <DocsLayout 
      title="Getting Started" 
      description="Start your journey on ChaosStar—then grow where citizens need what you sell or rent."
    >
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
