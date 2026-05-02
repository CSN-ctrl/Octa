import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageShellProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  /** Default documents/marketing column width */
  maxWidthClass?: string;
  /** Center hero vs left-aligned (desktop) */
  headerAlign?: "center" | "start";
}

/**
 * Shared chrome for marketing, legal, and support pages — consistent with design tokens.
 */
export function PageShell({
  title,
  description,
  icon: Icon,
  children,
  maxWidthClass = "max-w-3xl",
  headerAlign = "center",
}: PageShellProps) {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-background via-background/[0.97] to-background">
      <div className={cn("mx-auto px-4 sm:px-6 py-10 sm:py-14", maxWidthClass)}>
        <header
          className={cn(
            "mb-10 space-y-4",
            headerAlign === "center" ? "text-center" : "text-left"
          )}
        >
          {Icon && (
            <div
              className={cn(
                "flex items-center gap-3",
                headerAlign === "center" ? "justify-center" : "justify-start"
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-background/80 shadow-[var(--glow-card)]">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          )}
          {!Icon && (
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {description && (
            <p
              className={cn(
                "text-base text-muted-foreground leading-relaxed max-w-2xl app-prose-lead",
                headerAlign === "center" && "mx-auto"
              )}
            >
              {description}
            </p>
          )}
        </header>
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
