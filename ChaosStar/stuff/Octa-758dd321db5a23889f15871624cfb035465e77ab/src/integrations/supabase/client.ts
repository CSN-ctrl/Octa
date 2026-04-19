import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import {
  assertSupabaseUrlAndKeyAgree,
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/config/connections";

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = getSupabaseAnonKey();

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example)."
  );
}

assertSupabaseUrlAndKeyAgree(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

let supabaseInstance: SupabaseClient<Database> | null = null;

function createSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Realtime-js uses `new transport(url)` when `options.transport` is set. A string such as
  // "websocket" throws "this.transport is not a constructor". Always pass the native
  // WebSocket constructor in the browser so connect() never receives an invalid transport.
  const wsCtor =
    typeof globalThis !== "undefined" && typeof globalThis.WebSocket === "function"
      ? globalThis.WebSocket
      : undefined;

  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "chaosstar-supabase-auth",
      // Parse #access_token=…&type=recovery (and similar) on load so recovery links work.
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    realtime: {
      ...(wsCtor ? { transport: wsCtor } : {}),
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
    },
    global: {
      headers: {
        "x-client-info": "chaosstar-web",
      },
    },
  });

  return supabaseInstance;
}

export const supabase = createSupabaseClient();
