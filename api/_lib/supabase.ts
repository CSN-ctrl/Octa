import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseConfig, getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  assertSupabaseConfig();
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
