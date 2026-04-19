import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Globe } from "lucide-react";

export default function DocsSovereigntyPlanet() {
  return (
    <DocsLayout 
      title="Planet Ownership" 
      description="Control all cities and set planet-wide rules"
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Globe className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">Planet Ownership</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Buy an entire planet and gain sovereignty over it. Set planet-wide economic rules that all cities must follow, 
            control all cities on the planet, establish planet government, create planet economy, set planet-wide taxes 
            (transaction taxes, income taxes, etc.), set minimum wage and economic policies, and control resource allocation 
            across the entire planet.
          </p>
          <div className="p-3 rounded bg-background/50 border border-primary/10">
            <p className="text-xs font-semibold text-primary mb-1">Important:</p>
            <p className="text-xs text-muted-foreground">
              Planet economic rules and taxes must comply with star system rules. If the star system sets minimum wage, 
              tax rates, or economic restrictions, your planet must follow them. You can add additional planet taxes 
              and economic rules within the constraints set by the star system owner. All cities on your planet must 
              follow your planet's economic rules and taxes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>✓ Set planet-wide rules (cities must follow)</div>
            <div>✓ Control all cities on planet</div>
            <div>✓ Establish planet government</div>
            <div>✓ Create planet economy</div>
            <div>✓ Set immigration policies</div>
            <div>✓ Control planet resources</div>
          </div>
          <div className="p-3 rounded bg-background/50 border border-primary/10 mt-3">
            <p className="text-xs font-semibold text-primary mb-1">Treasury Payment:</p>
            <p className="text-xs text-muted-foreground">
              Planet treasury must pay 20% of planet revenue to the star system treasury.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
