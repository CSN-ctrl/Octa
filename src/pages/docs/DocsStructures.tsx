import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Hammer, Leaf, Dna, Mountain, Scale } from "lucide-react";

export default function DocsStructures() {
  return (
    <DocsLayout
      title="World Structure"
      description="Each Sarakt world is defined by four core components: resources, dominant species, environment, and ruleset."
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Hammer className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">World Blueprint</CardTitle>
              <CardDescription>
                Canonical structure model from the Sarakt specification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Resources
            </h4>
            <p className="text-sm text-muted-foreground">
              Resources are unique to each world and cannot be replicated elsewhere. They are the base layer of
              economic activity and determine strategic trade relevance.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 ml-2">
              <li>Raw materials</li>
              <li>Biological compounds</li>
              <li>Advanced synthetic elements</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Dna className="h-4 w-4 text-primary" />
              Dominant Species (Race)
            </h4>
            <p className="text-sm text-muted-foreground">
              Each world develops a primary intelligent species that shapes behavior patterns, productivity profile,
              and social organization.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 ml-2">
              <li>Learning speed</li>
              <li>Productivity</li>
              <li>Loyalty tendencies</li>
              <li>Adaptability</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Mountain className="h-4 w-4 text-primary" />
              Environment
            </h4>
            <p className="text-sm text-muted-foreground">
              Climate, terrain, and habitability conditions determine where resources appear and how infrastructure
              must be built to sustain growth.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 ml-2">
              <li>Directly affects resource generation</li>
              <li>Influences population growth rates</li>
              <li>Changes infrastructure requirements</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-white/[0.06]">
            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Ruleset
            </h4>
            <p className="text-sm text-muted-foreground">
              Rules are defined at higher ownership tiers and govern how economic activity and development behave.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 ml-2">
              <li>Economic policy configuration</li>
              <li>Resource flow constraints</li>
              <li>Development and governance limits</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
