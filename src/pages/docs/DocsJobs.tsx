import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";
import { Briefcase } from "lucide-react";

export default function DocsJobs() {
  return (
    <DocsLayout 
      title="Job System" 
      description="Jobs connect workers to businesses—and businesses exist because citizens create demand."
    >
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">The Job System</CardTitle>
              <CardDescription>
                How employment works in the economy
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-medium">Citizens fund payrolls.</strong> When populations rent, shop,
            and expand, businesses stay busy and keep hiring. Weak demand means fewer shifts and thinner wages.
          </p>
          <div>
            <h4 className="font-semibold mb-2 text-sm">How Jobs Work</h4>
            <p className="text-sm text-muted-foreground">
              Businesses post job listings, real users have priority over NPC workers, workers apply for jobs, 
              business owners hire workers, workers earn wages. That loop turns citizen demand into steady paychecks.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Why Businesses Need Workers</h4>
            <p className="text-sm text-muted-foreground">
              Early phases have no automation. All production is manual. Cannot produce without workers. 
              More workers = more production. This creates a strong job market with high demand for workers—especially
              in hubs where citizens spend the most.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Worker Advantages</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Real users always get priority over NPCs</li>
              <li>High demand for workers creates competitive wages</li>
              <li>Can choose between different jobs</li>
              <li>Job security - businesses need you</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
