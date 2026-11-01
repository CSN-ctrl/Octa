import { PageShell } from "@/components/PageShell";
import { Briefcase } from "lucide-react";
import { ExpatPathGate, ExpatPathLockNotice } from "@/components/expat/ExpatPathLockNotice";
import { ExpatTemporaryUnitsPanel } from "@/components/expat/ExpatTemporaryUnitsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpatPath() {
  return (
    <PageShell
      icon={Briefcase}
      title="Worker / Expat path"
      description="Work, rent, and participate in Sarakt without land ownership once the path is open."
    >
      <ExpatPathLockNotice className="mb-6" />
      <ExpatPathGate
        fallback={null}
      >
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Expat path is open</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Temporary government living and work units are available to rent while the citizen economy scales.
              Job flows will connect here as Phase 1+ features ship.
            </p>
          </CardContent>
        </Card>
        <ExpatTemporaryUnitsPanel />
      </ExpatPathGate>
    </PageShell>
  );
}
