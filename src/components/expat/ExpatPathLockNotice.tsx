import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";
import { EXPAT_PATH_LOCKED_TITLE } from "@/lib/genesis-product-copy";
import { expatPathLockedBody } from "@/lib/expat-availability";
import { useExpatAvailability } from "@/hooks/useExpatAvailability";

type ExpatPathLockNoticeProps = {
  className?: string;
};

/** Blocks interaction contextually — render when locked; hide when expat_open. */
export function ExpatPathLockNotice({ className }: ExpatPathLockNoticeProps) {
  const { availability, loading, locked } = useExpatAvailability();

  if (loading || !availability || !locked) {
    return null;
  }

  const progress =
    availability.plots_total > 0
      ? Math.min(100, (availability.plots_sold / availability.plots_total) * 100)
      : 0;

  return (
    <Alert variant="destructive" className={className}>
      <Lock className="h-4 w-4" />
      <AlertTitle>{EXPAT_PATH_LOCKED_TITLE}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{expatPathLockedBody(availability)}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Genesis plot sales (informational)</span>
            <span>
              {availability.plots_sold.toLocaleString()} / {availability.plots_total.toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </AlertDescription>
    </Alert>
  );
}

type ExpatPathGateProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/** Renders children only when server reports expat_open. */
export function ExpatPathGate({ children, fallback }: ExpatPathGateProps) {
  const { availability, loading, locked } = useExpatAvailability();

  if (loading) {
    return null;
  }

  if (!availability || locked) {
    return (
      fallback ?? (
        <ExpatPathLockNotice />
      )
    );
  }

  return <>{children}</>;
}
