import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { loadMergedOwnedPlots } from "@/lib/chain-land-holdings";
import { supabase } from "@/integrations/supabase/client";
import {
  canSubmitPermitApplication,
  formatPermitPlotLocation,
  isPermitExistsError,
  listMyPermits,
  permitStatusLabel,
  rejectedPermitMessage,
  submitPermitApplication,
  type PermitApplication,
} from "@/lib/permits";
import { labelForPermitType, PERMIT_TYPE_SELECT_OPTIONS, type PermitType } from "@/lib/permit-types";
import { BasicResidentialPlotEligibilityPanel } from "@/components/onboarding/BasicResidentialEligibilityBanner";

type OwnedPlotOption = {
  id: number;
  label: string;
};

export default function ApplyForPermit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlotId = Number(searchParams.get("plotId"));
  const { address, isConnected } = useWallet();
  const [plots, setPlots] = useState<OwnedPlotOption[]>([]);
  const [permits, setPermits] = useState<PermitApplication[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [requestedType, setRequestedType] = useState<PermitType | "">("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationNotes, setLocationNotes] = useState("");
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refreshPermits = useCallback(async () => {
    try {
      const rows = await listMyPermits();
      setPermits(rows);
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingPlots(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const wallet = address?.toLowerCase();
        if (!wallet) {
          setPlots([]);
          return;
        }
        const owned = await loadMergedOwnedPlots(wallet, email);
        const options = owned.map((p) => ({
          id: Number(p.id),
          label: `Plot #${p.id} (${p.coord_x}, ${p.coord_y})`,
        }));
        setPlots(options);
        if (options.length === 1) {
          setSelectedPlotId(options[0].id);
        } else if (Number.isFinite(preselectedPlotId) && options.some((p) => p.id === preselectedPlotId)) {
          setSelectedPlotId(preselectedPlotId);
        }
      } finally {
        setLoadingPlots(false);
      }
    };
    void load();
    void refreshPermits();
  }, [address, refreshPermits, preselectedPlotId]);

  const selectedPlotPermit = useMemo(
    () => (selectedPlotId != null ? permits.find((p) => p.plot_id === selectedPlotId) : undefined),
    [permits, selectedPlotId]
  );

  const previewLocation = useMemo(() => {
    if (selectedPlotPermit?.plot) {
      return formatPermitPlotLocation(selectedPlotPermit.plot);
    }
    if (selectedPlotId != null) {
      const opt = plots.find((p) => p.id === selectedPlotId);
      return opt?.label ?? `Plot #${selectedPlotId}`;
    }
    return null;
  }, [plots, selectedPlotId, selectedPlotPermit]);

  const canSubmit = canSubmitPermitApplication({
    plotId: selectedPlotId,
    locationConfirmedInUi: locationConfirmed,
  });

  const handleSubmit = async () => {
    if (selectedPlotId == null || !canSubmit) {
      toast.error("Confirm the plot location before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await submitPermitApplication({
        plotId: selectedPlotId,
        requestedType: requestedType || null,
        locationConfirmedInUi: locationConfirmed,
        locationNotes: locationNotes.trim() || undefined,
      });
      toast.success("Permit application submitted.");
      setLocationConfirmed(false);
      setLocationNotes("");
      await refreshPermits();
    } catch (err: unknown) {
      if (isPermitExistsError(err)) {
        toast.error("Another participant already has an open permit for this plot.");
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to submit permit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      icon={FileCheck}
      title="Apply for permit"
      description="Confirm your plot location, then submit for Sarakt government review. Approval assigns a land-use type (residential, commercial, and others)."
    >
      <BasicResidentialPlotEligibilityPanel />

      {!isConnected && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wallet required</AlertTitle>
          <AlertDescription>Connect your wallet to load owned plots for this application.</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>New application</CardTitle>
            <CardDescription>Select a plot, review location details, and submit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingPlots ? (
              <p className="text-sm text-muted-foreground">Loading your plots…</p>
            ) : plots.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">You need at least one plot before applying.</p>
                <Button onClick={() => navigate("/plot-purchase")}>Buy a plot</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="plot-select">Plot</Label>
                  <Select
                    value={selectedPlotId != null ? String(selectedPlotId) : undefined}
                    onValueChange={(v) => {
                      setSelectedPlotId(Number(v));
                      setLocationConfirmed(false);
                      setLocationNotes("");
                    }}
                  >
                    <SelectTrigger id="plot-select">
                      <SelectValue placeholder="Choose a plot" />
                    </SelectTrigger>
                    <SelectContent>
                      {plots.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requested-type">Requested type (optional)</Label>
                  <Select
                    value={requestedType || "none"}
                    onValueChange={(v) => setRequestedType(v === "none" ? "" : (v as PermitType))}
                  >
                    <SelectTrigger id="requested-type">
                      <SelectValue placeholder="No preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No preference</SelectItem>
                      {PERMIT_TYPE_SELECT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {previewLocation && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      Plot location
                    </div>
                    <p className="text-sm text-muted-foreground">{previewLocation}</p>
                  </div>
                )}

                <div className="flex items-start gap-3 rounded-lg border border-primary/30 p-3">
                  <Checkbox
                    id="confirm-location"
                    checked={locationConfirmed}
                    onCheckedChange={(v) => setLocationConfirmed(v === true)}
                    disabled={selectedPlotId == null}
                  />
                  <Label htmlFor="confirm-location" className="text-sm leading-snug cursor-pointer">
                    I confirm this plot location is correct and matches the land I own.
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-notes">Location notes (optional)</Label>
                  <Textarea
                    id="location-notes"
                    placeholder="Landmarks, access paths, or other notes for reviewers"
                    value={locationNotes}
                    onChange={(e) => setLocationNotes(e.target.value)}
                    disabled={selectedPlotId == null}
                    rows={3}
                  />
                </div>

                <Button className="w-full" disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
                  {submitting ? "Submitting…" : "Submit permit application"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Your permits</CardTitle>
            <CardDescription>Pending, approved, and rejected applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              permits.map((permit) => (
                <div key={permit.id} className="rounded-lg border border-border/50 p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">Plot #{permit.plot_id}</span>
                    <Badge variant="outline">{permitStatusLabel(permit)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatPermitPlotLocation(permit.plot)}</p>
                  {!permit.location_confirmed && permit.status === "pending" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Location not confirmed — complete confirmation to proceed.
                    </p>
                  )}
                  {permit.requested_type && (
                    <p className="text-xs text-muted-foreground">
                      Requested: {labelForPermitType(permit.requested_type)}
                    </p>
                  )}
                  {permit.status === "approved" && permit.assigned_type && (
                    <p className="text-xs text-success">
                      Assigned type: {labelForPermitType(permit.assigned_type)}
                    </p>
                  )}
                  {permit.status === "rejected" && (
                    <p className="text-xs text-destructive">{rejectedPermitMessage(permit.rejection_reason)}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
