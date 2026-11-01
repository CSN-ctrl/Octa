/**
 * Shared helpers for Vercel serverless `/api/*` routes (Octa Investment Group Sarakt/Octa).
 */

export function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    ""
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function assertSupabaseConfig(): void {
  if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
    throw new Error(
      "Missing Supabase configuration for API routes (SUPABASE_URL and SUPABASE_ANON_KEY or VITE_* equivalents)."
    );
  }
}
