import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

export function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

export function createServiceSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for server-side node operations.",
    );
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
