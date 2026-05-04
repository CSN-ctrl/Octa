import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Shield, Rocket, Globe, Landmark } from "lucide-react";

export default function DocsSovereignty() {
  return (
    <DocsLayout 
      title="Sovereignty" 
      description="For advanced players who want control - hierarchical governance system"
    >
      <div className="space-y-6">
        {/* Hierarchy Explanation */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Governance Hierarchy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sovereignty follows a hierarchical structure: <strong>Star System → Planet → City</strong>. 
              Each level must obey the rules of the level above it.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Rocket className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Star System</span> - Sets rules for all planets within it
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Planet</span> - Must obey star system rules, sets rules for all cities on the planet
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Landmark className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">City</span> - Must obey planet rules (which inherit star system rules), sets local city rules
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Sovereignty Works */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">How Sovereignty Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sovereignty is hierarchical and focuses on economic rules and taxes. When you own a city, you set local economic rules 
              and taxes but must follow planet economic rules. When you own a planet, you set planet economic rules and taxes but must 
              follow star system economic rules. When you own a star system, you set the highest level economic rules and taxes that 
              all lower levels must follow.
            </p>
            <div className="p-3 rounded bg-background/50 border border-primary/10">
              <h5 className="font-semibold text-sm mb-2">Example Hierarchy (Economic Rules & Taxes):</h5>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div><strong>Star System Owner:</strong> Sets system-wide tax: 3% on all transactions</div>
                <div><strong>Planet Owner:</strong> Must follow system rule, adds "System tax 3%, plus planet tax: 5% on all transactions"</div>
                <div><strong>City Owner:</strong> Must follow both rules, adds "System tax 3%, planet tax 5%, plus city tax: 2% on property sales"</div>
                <div className="mt-2 text-primary font-semibold">Each level adds economic rules and taxes within the constraints of higher levels</div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-2">Who This Is For:</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>Advanced players seeking control within hierarchical structure</li>
                <li>Community leaders and organizers</li>
                <li>Those who want to create their own world within system constraints</li>
                <li>Groups or organizations</li>
                <li>Those with significant resources</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DocsLayout>
  );
}
