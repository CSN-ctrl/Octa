import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Landmark } from "lucide-react";

export default function DocsSovereigntyCity() {
  return (
    <DocsLayout 
      title="City Ownership" 
      description="Set local rules and control city governance"
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Landmark className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">City Ownership</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Buy an entire city and gain sovereignty over it. Set your own local economic rules and regulations, 
            control city governance, manage city economy, set local taxes and fees (property taxes, sales taxes, etc.), 
            control building regulations within the city, and establish your own economic policies.
          </p>
          <div className="p-3 rounded bg-background/50 border border-primary/10">
            <p className="text-xs font-semibold text-primary mb-1">Important:</p>
            <p className="text-xs text-muted-foreground">
              City economic rules and taxes must comply with planet rules. If the planet sets minimum wage requirements, 
              tax rates, or economic restrictions, your city must follow them. You can add additional city taxes 
              and economic rules within the constraints set by the planet owner.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>✓ Set local city rules</div>
            <div>✓ Control city governance</div>
            <div>✓ Manage city economy</div>
            <div>✓ Create local laws</div>
            <div>✓ Set local taxes</div>
            <div>✓ Control building within city</div>
          </div>
          <div className="p-3 rounded bg-background/50 border border-primary/10 mt-3">
            <p className="text-xs font-semibold text-primary mb-1">Treasury Payment:</p>
            <p className="text-xs text-muted-foreground">
              City treasury must pay 20% of city revenue to the planet treasury.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
