const PROD_ORIGIN = "https://www.sarakt.com";

export function getAppOrigin(): string {
  if (typeof window === "undefined") return PROD_ORIGIN;

  const { hostname, origin } = window.location;

  // Keep localhost/dev environments working without forcing production URL.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }

  return PROD_ORIGIN;
}

/**
 * URL passed to `resetPasswordForEmail({ redirectTo })`. Must match an entry in
 * Supabase → Authentication → URL Configuration → Redirect URLs
 * (e.g. https://www.sarakt.com/reset-password).
 * Uses getAppOrigin() so recovery emails always use the canonical production host
 * (https://www.sarakt.com) when not on localhost; local dev still uses the current origin.
 */
export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}/reset-password`;
}

/**
 * `signUp({ options: { emailRedirectTo } })` — must be listed under Supabase Auth → Redirect URLs
 * (e.g. https://www.sarakt.com/email-verified).
 * Uses getAppOrigin() like password reset so confirmation links use https://www.sarakt.com in production;
 * localhost still uses the dev origin.
 */
export function getEmailConfirmationRedirectUrl(): string {
  return `${getAppOrigin()}/email-verified`;
}

/** Same-origin API base for Vercel `/api/*` routes (relative in browser). */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getAppOrigin();
}

