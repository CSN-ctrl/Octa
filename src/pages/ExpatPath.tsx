import { PageShell } from "@/components/PageShell";
import { Briefcase } from "lucide-react";
import { ExpatPathGate, ExpatPathLockNotice } from "@/components/expat/ExpatPathLockNotice";
import { ExpatTemporaryUnitsPanel } from "@/components/expat/ExpatTemporaryUnitsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPAT_LOCKED_COPY, EXPAT_OPEN_COPY } from "@/lib/genesis-product-copy";

export default function ExpatPath() {
  return (
    <PageShell
      icon={Briefcase}
      title={EXPAT_LOCKED_COPY.title}
      description={EXPAT_LOCKED_COPY.banner}
    >
      <ExpatPathLockNotice className="mb-6" />
      <ExpatPathGate fallback={null}>
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{EXPAT_OPEN_COPY.banner}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{EXPAT_OPEN_COPY.banner}</p>
          </CardContent>
        </Card>
        <ExpatTemporaryUnitsPanel />
      </ExpatPathGate>
    </PageShell>
  );
}
