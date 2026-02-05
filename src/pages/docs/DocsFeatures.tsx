import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Globe, Network, Users, TrendingUp } from "lucide-react";

export default function DocsFeatures() {
  return (
    <DocsLayout 
      title="Key Features" 
      description="What makes ChaosStar unique"
    >
      <Card className="glass-card border-primary/30">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Realistic Economy</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Mirrors real-world economics with supply and demand, market-driven prices, and a circular economy
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Multiple Paths</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Landowner path, worker path, business owner path, supporting roles, and sovereignty options
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Player-Driven</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Real users have priority, player decisions matter, community-driven, your choices shape the world
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Progression</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Start as worker, become landowner. Start small, grow big. Multiple income streams. Build your empire
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
