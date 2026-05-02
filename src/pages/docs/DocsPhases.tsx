import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Zap, Building2, Factory, Cpu, Orbit } from "lucide-react";

export default function DocsPhases() {
  return (
    <DocsLayout 
      title="Phase Progression" 
      description="Current and future phases of development"
    >
      <Card className="glass-card border-primary/30">
        <CardContent className="pt-6 space-y-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-primary" />
              <h4 className="font-semibold text-lg">Phase 1: Tribal Stage (Current)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Buy plots, own land, foundation for future. Phase 1 is limited to 10,000 participants, 
              but each participant can purchase multiple plots. This is the initial land acquisition phase.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h4 className="font-semibold text-lg">Phase 2: Civilization Stage (Coming)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Build structures, rent out properties, work at businesses, create businesses, full economy active. 
              Detached housing, schools, universities, and civic systems—local wages, rents, and services scale with
              citizen demand. Industrial mass production is reserved for Phase 3.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Factory className="h-6 w-6 text-primary" />
              <h4 className="font-semibold text-lg">Phase 3: Industrial Stage (Future)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Industrial complexes, scaled manufacturing, logistics, and heavy infrastructure. Supply chains and bulk
              output meet population-wide demand—this is where citizen-driven consumption meets industrial throughput.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="h-6 w-6 text-primary" />
              <h4 className="font-semibold text-lg">Phase 4: Tech Stage (Future)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Automation and advanced systems layer onto the industrial base—more complex economies, deeper markets, and
              new tools for owners, workers, and sovereigns.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Orbit className="h-6 w-6 text-primary" />
              <h4 className="font-semibold text-lg">Phase 5: Cosmic Stage (Future)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Inter-system trade, expanded sovereignty, and cosmic-scale expansion—the universe opens with new
              technologies, distant markets, and long-horizon strategy.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
