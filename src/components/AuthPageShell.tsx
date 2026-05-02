import type { ReactNode } from "react";

/**
 * Centered auth flows (login, reset password) — matches product chrome and clears fixed nav.
 */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 pb-10 sm:pb-12 pt-28 sm:pt-32 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,hsl(262_72%_58%/0.1),transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md space-y-4 sm:space-y-6 min-w-0">{children}</div>
    </div>
  );
}
