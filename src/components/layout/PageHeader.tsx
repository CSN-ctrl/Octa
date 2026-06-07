import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  onBack,
  backLabel = "Back",
  action,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="shrink-0 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          )}
          <div className="min-w-0 flex-1">
            {badge && <div className="mb-2">{badge}</div>}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {description && (
              <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
