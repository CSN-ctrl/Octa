import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BASIC_UNIT_COPY, HOW_IT_WORKS_COPY, PRIZES_COPY } from "@/lib/genesis-product-copy";
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
      {PRIZES_COPY.basicUnit.badge}
    </Badge>
  );
}

function plotCopyBlock(row: BasicResidentialPlotEligibility, cap: number) {
  if (row.claimed) {
    return { title: BASIC_UNIT_COPY.claimed.title, body: BASIC_UNIT_COPY.claimed.body };
  }
  if (row.eligible) {
    return { title: BASIC_UNIT_COPY.claimable.title, body: BASIC_UNIT_COPY.claimable.body };
  }
  if (row.sale_rank > cap || plotNeedsResidentialPermit(row, cap)) {
    return { title: `Plot #${row.plot_id}`, body: BASIC_UNIT_COPY.notEligible.body };
  }
  return {
    title: `Plot #${row.plot_id}`,
    body: `Plot #${row.plot_id} — eligibility pending sale rank from the server.`,
  };
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
      toast.success(BASIC_UNIT_COPY.claimed.title);
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
          {PRIZES_COPY.basicUnit.title} (per plot)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {eligibility.plots.map((row) => {
          const copy = plotCopyBlock(row, eligibility.cap);
          return (
            <div
              key={row.plot_id}
              className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <span className="text-sm font-medium">Plot #{row.plot_id}</span>
                {statusBadge(row)}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-start gap-2">
                  {row.claimed || row.eligible ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : plotNeedsResidentialPermit(row, eligibility.cap) ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  {copy.title}
                </p>
                <p className="text-xs text-muted-foreground">{copy.body}</p>
              </div>
              {row.claimed ? null : row.eligible ? (
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={claimingPlotId === row.plot_id}
                  onClick={() => void handleClaim(row.plot_id)}
                >
                  {claimingPlotId === row.plot_id ? "Claiming…" : BASIC_UNIT_COPY.claimable.cta}
                </Button>
              ) : null}
              {plotNeedsResidentialPermit(row, eligibility.cap) && (
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                  <Link to={`/apply-permit?plotId=${row.plot_id}`}>
                    {HOW_IT_WORKS_COPY.steps.applyPermit.title}
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** @deprecated use BasicResidentialPlotEligibilityPanel */
export function BasicResidentialEligibilityBanner() {
  return <BasicResidentialPlotEligibilityPanel />;
}
