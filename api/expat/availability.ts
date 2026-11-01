import type { ApiRequest, ApiResponse } from "../_lib/types";
import { methodNotAllowed } from "../_lib/http";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfig, getSupabaseAnonKey, getSupabaseUrl } from "../_lib/env";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    assertSupabaseConfig();
  } catch (e) {
    res.status(500).json({ error: "misconfigured", message: (e as Error).message });
    return;
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("get_expat_availability");
  if (error) {
    res.status(500).json({ error: "internal_error", message: error.message });
    return;
  }

  res.status(200).json(data);
}
