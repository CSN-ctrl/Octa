import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Zap, Building2, Rocket } from "lucide-react";

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
              This is when the realistic economic system becomes fully operational with structures, rentals, jobs, and businesses.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="h-6 w-6 text-primary" />
              <h4 className="font-semibold text-lg">Advanced Phases (Future)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Automation becomes available, more complex economies, sovereignty options, inter-system trade, 
              advanced civilizations. The universe expands with new technologies and opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
