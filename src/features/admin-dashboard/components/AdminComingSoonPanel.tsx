import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

type FeatureItem = {
  title: string;
  description: string;
};

type AdminComingSoonPanelProps = {
  title: string;
  description: string;
  icon: ReactNode;
  refreshLabel?: string;
  features: FeatureItem[];
};

export function AdminComingSoonPanel({
  title,
  description,
  icon,
  refreshLabel = "Refresh",
  features,
}: AdminComingSoonPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-enhanced border-primary/20 shadow-glow-card card-hover">
        <CardHeader className="border-b border-primary/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-cosmic/20 border border-primary/30">{icon}</div>
                <CardTitle className="text-2xl font-bold gradient-text">{title}</CardTitle>
              </div>
              <CardDescription className="text-sm ml-12">{description}</CardDescription>
            </div>
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              {refreshLabel}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-12 pb-16">
          <div className="text-center">
            <div className="inline-flex p-6 rounded-2xl bg-gradient-cosmic/10 border border-primary/20 mb-6">{icon}</div>
            <h3 className="text-xl font-semibold mb-2 gradient-text">Coming Soon</h3>
            <p className="text-muted-foreground mb-6">Features will include:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              {features.map((feature) => (
                <div key={feature.title} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="font-medium mb-1">{feature.title}</div>
                  <div className="text-sm text-muted-foreground">{feature.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
