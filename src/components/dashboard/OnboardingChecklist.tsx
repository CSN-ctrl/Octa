import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Rocket, X } from "lucide-react";
import { goldenPathStepFromState, type GoldenPathStep } from "@/lib/golden-path";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import { cn } from "@/lib/utils";
import { listMyPermits } from "@/lib/permits";

const DISMISS_KEY = "octa_phase1_onboarding_dismissed";

type StepDef = {
  id: GoldenPathStep | "certificate" | "permit";
  title: string;
  description: string;
  href: string;
  done: boolean;
};

export function isOnboardingChecklistDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissOnboardingChecklist(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}

type OnboardingChecklistProps = {
  walletConnected: boolean;
  xbglBalance: number;
  plotCount: number;
  onDismiss?: () => void;
};

export function OnboardingChecklist({
  walletConnected,
  xbglBalance,
  plotCount,
  onDismiss,
}: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [permitSubmitted, setPermitSubmitted] = useState(false);

  useEffect(() => {
    if (plotCount <= 0) {
      setPermitSubmitted(false);
      return;
    }
    let cancelled = false;
    listMyPermits()
      .then((rows) => {
        if (!cancelled) setPermitSubmitted(rows.length > 0);
      })
      .catch(() => {
        if (!cancelled) setPermitSubmitted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [plotCount]);

  const activeStep = goldenPathStepFromState({
    walletConnected,
    xbglBalance,
    plotCount,
  });

  const steps: StepDef[] = useMemo(() => {
    const plotPrice = getPlotPriceInXBGL();
    const hasFunds = xbglBalance >= plotPrice;
    return [
      {
        id: "wallet",
        title: "Connect wallet on Fuji",
        description: "Link MetaMask or Core on Avalanche Fuji testnet.",
        href: "/deposit",
        done: walletConnected,
      },
      {
        id: "deposit",
        title: "Deposit AVAX → xBGL",
        description: `Fund your account (~${plotPrice.toFixed(2)} xBGL per plot).`,
        href: "/deposit",
        done: hasFunds,
      },
      {
        id: "plot",
        title: "Buy your first plot",
        description: "Claim land in Sarakt Genesis Phase 1.",
        href: "/plot-purchase",
        done: plotCount > 0,
      },
      {
        id: "permit",
        title: "Apply for permit",
        description: "Confirm plot location and submit for land-use approval.",
        href: "/apply-permit",
        done: permitSubmitted,
      },
      {
        id: "certificate",
        title: "View land certificate",
        description: "Open your title certificate after purchase.",
        href: "/land-title",
        done: plotCount > 0,
      },
    ];
  }, [walletConnected, xbglBalance, plotCount, permitSubmitted]);

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  const nextStep = steps.find((s) => !s.done) ?? steps[0];

  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-primary" />
              Phase 1 — Get started
            </CardTitle>
            <CardDescription>
              {completedCount} of {steps.length} complete. Your next step: {nextStep.title}.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Dismiss onboarding checklist"
            onClick={() => {
              dismissOnboardingChecklist();
              onDismiss?.();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {steps.map((step) => {
            const isActive = step.id === activeStep || (!step.done && step.id === nextStep.id);
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                  step.done
                    ? "border-green-500/30 bg-green-500/5"
                    : isActive
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/50"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-muted-foreground text-xs">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <Button className="w-full sm:w-auto" onClick={() => navigate(nextStep.href)}>
          Continue — {nextStep.title}
        </Button>
      </CardContent>
    </Card>
  );
}
