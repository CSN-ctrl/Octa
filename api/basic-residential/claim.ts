import type { ApiRequest, ApiResponse } from "../../_lib/types";
import { requireBearerToken } from "../../_lib/auth";
import { badRequest, mapRpcError, methodNotAllowed, readJsonBody, unauthorized } from "../../_lib/http";
import { createUserSupabaseClient } from "../../_lib/supabase";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const token = requireBearerToken(req);
  if (!token) {
    unauthorized(res);
    return;
  }

  const body = readJsonBody<{ plot_id?: number }>(req);
  if (body.plot_id === undefined || !Number.isFinite(Number(body.plot_id))) {
    badRequest(res, "plot_id is required");
    return;
  }

  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.rpc("claim_basic_residential_unit", {
    p_plot_id: Number(body.plot_id),
  });

  if (error) {
    mapRpcError(res, error);
    return;
  }

  res.status(200).json(data);
}
