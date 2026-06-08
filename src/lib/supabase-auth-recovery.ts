import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const STALE_REFRESH_PATTERNS = [
  "refresh token not found",
  "invalid refresh token",
  "refresh token has been revoked",
];

/** Stale local session after deploy, logout elsewhere, or cleared server tokens. */
export function isStaleSupabaseRefreshError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return STALE_REFRESH_PATTERNS.some((pattern) => msg.includes(pattern));
}

export async function clearStaleSupabaseSession(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    logger.debug("Failed to clear stale Supabase session:", error);
  }
}

/** Clear invalid refresh tokens on startup; subscribe for sign-out events. */
export function initSupabaseAuthRecovery(): () => void {
  void supabase.auth.getSession().then(({ error }) => {
    if (error && isStaleSupabaseRefreshError(error)) {
      void clearStaleSupabaseSession();
    }
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" && !session) {
      logger.debug("Supabase session cleared");
    }
  });

  return () => subscription.unsubscribe();
}
