import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Hammer } from "lucide-react";

export default function DocsStructures() {
  return (
    <DocsLayout 
      title="Building Structures" 
      description="Why you need structures and how to get them"
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Hammer className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">Building Structures - The Realistic Way</CardTitle>
              <CardDescription>
                Why you need structures and how to get them
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">Why You Need Structures</h4>
            <p className="text-sm text-muted-foreground">
              Empty plots cannot generate rental income. You need at least a basic structure 
              (caravan, detachable house, etc.) to rent out. Structures are required to profit from your land.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Option A: Buy Pre-Built Structure</h4>
            <p className="text-sm text-muted-foreground">
              Browse structure marketplace, buy ready-made structures (caravan, detachable house, etc.), 
              have them delivered to your plot, start renting immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Option B: Build with Materials and Builder</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Buy materials from marketplace (wood, stone, metal, fabric)</li>
              <li>Hire a builder from builder marketplace</li>
              <li>Builder uses your materials to construct structure</li>
              <li>Pay builder labor fees</li>
              <li>Structure completed on your plot</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Option C: Build Yourself</h4>
            <p className="text-sm text-muted-foreground">
              Buy materials yourself, use construction tools to build, no builder fees but requires time and skill.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
