import type { ApiRequest, ApiResponse } from "../_lib/types";
import { requireBearerToken } from "../_lib/auth";
import { mapRpcError, methodNotAllowed, unauthorized } from "../_lib/http";
import { createUserSupabaseClient } from "../_lib/supabase";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const token = requireBearerToken(req);
  if (!token) {
    unauthorized(res);
    return;
  }

  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.rpc("list_my_plot_permit_applications");

  if (error) {
    mapRpcError(res, error);
    return;
  }

  res.status(200).json(data);
}
