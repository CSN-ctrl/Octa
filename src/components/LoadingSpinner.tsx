import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 min-h-[min(50vh,280px)] py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 p-3 shadow-[var(--glow-primary)]">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}


