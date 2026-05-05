import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Briefcase } from "lucide-react";

export default function DocsJobs() {
  return (
    <DocsLayout
      title="AI Population System"
      description="NPC populations are dynamic participants that learn, adapt, and shape economic outcomes."
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">AI Population Dynamics</CardTitle>
              <CardDescription>
                Behavior model and loyalty mechanics in Sarakt
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            NPCs are not static background entities. They spawn without predefined personalities, then learn and adapt
            over time based on environment quality and owner decisions.
          </p>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Core Mechanics</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>NPCs seek employment opportunities.</li>
              <li>Skills improve through continuous work.</li>
              <li>Loyalty patterns form toward owners and systems.</li>
              <li>Local conditions directly affect behavior stability.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Loyalty Model</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>High loyalty improves long-term retention.</li>
              <li>Maximum loyalty integrates populations into owner influence networks.</li>
              <li>Poor management can trigger instability and inefficiency.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Behavioral Outcomes</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Efficient economies under strong management conditions.</li>
              <li>Instability under weak governance and poor incentives.</li>
              <li>Emergent social structures over time.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
