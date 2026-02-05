import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { ArrowRight } from "lucide-react";

export default function DocsGettingStarted() {
  const steps = [
    {
      step: 1,
      title: "Connect Your Wallet",
      description: "Use MetaMask, Core Wallet, Coinbase Wallet, or Brave Wallet to connect to ChaosStar Network (Chain ID: 8088)"
    },
    {
      step: 2,
      title: "Register Digital ID",
      description: "Create your identity on the platform. Choose personal, corporate, or organization ID. Link your wallet to your identity."
    },
    {
      step: 3,
      title: "Choose Your Path",
      description: "If you want to be a Landowner: Purchase plots (Phase 1: 10,000 participants limit). Each participant can buy multiple plots. Price: 100 xBGL per plot in Phase 1. If you want to be a Worker: Browse job listings, apply for jobs, get hired and start working, rent housing from landowners."
    },
    {
      step: 4,
      title: "Start Earning",
      description: "As a Landowner: Build or buy structures on your plots, list structures for rent, earn rental income. As a Worker: Work at businesses, earn wages, pay rent from wages, save earnings to buy plots later."
    },
    {
      step: 5,
      title: "Expand and Grow",
      description: "Buy more plots (landowners), build more structures, create businesses, hire workers, scale your operations."
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
      description="Follow these steps to begin your journey on ChaosStar"
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
