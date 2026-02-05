import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Rocket } from "lucide-react";

export default function DocsSovereigntyStarSystem() {
  return (
    <DocsLayout 
      title="Star System Ownership" 
      description="Ultimate sovereignty - control an entire star system"
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">Star System Ownership</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Buy an entire star system and gain ultimate sovereignty. Set system-wide economic rules that all planets must follow, 
            control multiple planets, create your own economic system, establish inter-planet trade policies, set system-wide 
            taxes and minimum wage, control system governance, and build your own economic empire across the star system.
          </p>
          <div className="p-3 rounded bg-background/50 border border-primary/10">
            <p className="text-xs font-semibold text-primary mb-1">Ultimate Control:</p>
            <p className="text-xs text-muted-foreground">
              As star system owner, you set the highest level economic rules and taxes. All planets in your system must follow 
              your economic rules (minimum wage, tax rates, trade policies, etc.), and all cities on those planets must follow 
              both your system rules and their planet's rules. You have the most control over the economic system but also the 
              most responsibility.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>✓ Set system-wide rules (planets must follow)</div>
            <div>✓ Control all planets in system</div>
            <div>✓ Create civilization</div>
            <div>✓ Inter-planet trade</div>
            <div>✓ System governance</div>
            <div>✓ Build empire</div>
          </div>
          <div className="p-3 rounded bg-background/50 border border-primary/10 mt-3">
            <p className="text-xs font-semibold text-primary mb-1">Treasury Payment:</p>
            <p className="text-xs text-muted-foreground">
              Star system treasury payment varies based on negotiations with the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
