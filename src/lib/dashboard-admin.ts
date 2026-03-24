import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Client-side mirror of `public.is_dashboard_admin()` (used when RPC is unavailable).
 * Keep in sync with Supabase migration defining that function.
 */
export function dashboardAdminFromUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (meta?.role === "admin" || meta?.treasury_role === "admin") return true;
  const email = user.email?.toLowerCase() ?? "";
  if (!email) return false;
  return (
    email === "admin@test.com" ||
    email === "test@test.com" ||
    email === "admin@example.com" ||
    email.includes("admin")
  );
}

/**
 * Whether the current session may use the admin dashboard (matches DB policy when RPC exists).
 */
export async function isDashboardAdmin(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data, error } = await supabase.rpc("is_dashboard_admin");
  if (!error && typeof data === "boolean") {
    return data;
  }

  return dashboardAdminFromUser(session.user);
}
