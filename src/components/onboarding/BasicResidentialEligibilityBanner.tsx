import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { basicResidentialPlotStatusMessage } from "@/lib/genesis-product-copy";
import {
  basicResidentialClaimErrorMessage,
  claimBasicResidentialPlot,
  plotNeedsResidentialPermit,
  type BasicResidentialPlotEligibility,
} from "@/lib/basic-residential-eligibility";
import { useBasicResidentialEligibility } from "@/hooks/useBasicResidentialEligibility";

function statusBadge(row: BasicResidentialPlotEligibility) {
  if (row.claimed) {
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        Claimed
      </Badge>
    );
  }
  if (row.eligible) {
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        Eligible
      </Badge>
    );
  }
  if (row.approved_residential_permit) {
    return <Badge variant="secondary">Permit approved</Badge>;
  }
  return (
    <Badge variant="outline" className="border-amber-500/40 text-amber-600">
      Permit required
    </Badge>
  );
}

export function BasicResidentialPlotEligibilityPanel() {
  const { eligibility, loading, refresh } = useBasicResidentialEligibility();
  const [claimingPlotId, setClaimingPlotId] = useState<number | null>(null);

  if (loading) {
    return (
      <Card className="border-primary/20 mb-6">
        <CardContent className="py-4 text-sm text-muted-foreground">Loading plot eligibility…</CardContent>
      </Card>
    );
  }

  if (!eligibility?.plots.length) {
    return null;
  }

  const handleClaim = async (plotId: number) => {
    setClaimingPlotId(plotId);
    try {
      await claimBasicResidentialPlot(plotId);
      toast.success("Basic residential unit claimed.");
      await refresh();
    } catch (err: unknown) {
      toast.error(basicResidentialClaimErrorMessage(err));
    } finally {
      setClaimingPlotId(null);
    }
  };

  return (
    <Card className="border-success/30 bg-success/5 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-5 w-5 text-success" />
          Basic residential unit (per plot)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {eligibility.plots.map((row) => (
          <div
            key={row.plot_id}
            className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <span className="text-sm font-medium">Plot #{row.plot_id}</span>
              {statusBadge(row)}
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              {row.claimed || row.eligible ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              ) : plotNeedsResidentialPermit(row, eligibility.cap) ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              {basicResidentialPlotStatusMessage(row, eligibility.cap)}
            </p>
            {row.claimed ? (
              <p className="text-xs text-success font-medium">Claimed</p>
            ) : row.eligible ? (
              <Button
                size="sm"
                className="w-full sm:w-auto"
                disabled={claimingPlotId === row.plot_id}
                onClick={() => void handleClaim(row.plot_id)}
              >
                {claimingPlotId === row.plot_id ? "Claiming…" : "Claim basic residential unit"}
              </Button>
            ) : null}
            {plotNeedsResidentialPermit(row, eligibility.cap) && (
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                <Link to={`/apply-permit?plotId=${row.plot_id}`}>Apply for residential permit</Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** @deprecated use BasicResidentialPlotEligibilityPanel */
export function BasicResidentialEligibilityBanner() {
  return <BasicResidentialPlotEligibilityPanel />;
}
