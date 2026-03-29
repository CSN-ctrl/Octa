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
 * Supabase → Authentication → URL Configuration → Redirect URLs (e.g. https://yourdomain.com/reset-password).
 * Uses the current browser origin so Vercel previews and alternate domains work; SSR/build falls back to getAppOrigin().
 */
export function getPasswordResetRedirectUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }
  return `${getAppOrigin()}/reset-password`;
}

/**
 * `signUp({ options: { emailRedirectTo } })` — must be listed under Supabase Auth → Redirect URLs
 * (e.g. https://www.sarakt.com/email-verified and https://sarakt.com/email-verified).
 * Uses the current browser origin so production (sarakt.com / www) and previews match the link in the email.
 */
export function getEmailConfirmationRedirectUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/email-verified`;
  }
  return `${getAppOrigin()}/email-verified`;
}

