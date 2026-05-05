import { Card, CardContent } from "@/components/ui/card";
import { DocsLayout } from "@/components/DocsLayout";

export default function DocsEconomy() {
  return (
    <DocsLayout
      title="Economic System"
      description="Sarakt's economy is built on scarcity, multi-stage production, and interplanetary dependency."
    >
      <Card className="glass-card border-primary/30">
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">Core Principles</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Resources are limited and world-specific.</li>
              <li>Production requires multiple transformation stages.</li>
              <li>No single world is fully self-sufficient.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Economic Flow</h4>
            <p className="text-sm text-muted-foreground">
              Land to resource extraction to refinement to production to trade to profit.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This pipeline is intentionally asymmetric: worlds depend on external inputs, creating durable trade
              relationships instead of isolated local loops.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Interplanetary Trade Dynamics</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Trade is required between planets.</li>
              <li>Logistics introduces cost, time, and risk.</li>
              <li>Route and supply coordination become strategic advantages.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">Currency Structure</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Universe reserve currency: <strong className="text-foreground font-medium">xBGL</strong></li>
              <li>Secondary tokens for specialized systems</li>
              <li>Optional private/shadow transaction layer</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  );
}
