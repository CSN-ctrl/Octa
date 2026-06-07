import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppPageShellProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  banner?: ReactNode;
};

/** Canonical page canvas — matches Deposit / Dashboard spacing. */
export function AppPageShell({
  children,
  className,
  innerClassName,
  banner,
}: AppPageShellProps) {
  return (
    <div className={cn("app-page-canvas", className)}>
      <div className={cn("app-page-inner", innerClassName)}>
        {banner}
        {children}
      </div>
    </div>
  );
}
