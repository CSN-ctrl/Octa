import type { ApiRequest, ApiResponse } from "../_lib/types";
import { requireBearerToken } from "../_lib/auth";
import { PERMIT_PLOT_TYPES, isPermitPlotType, type PermitPlotType } from "../_lib/permit-types";
import { badRequest, mapRpcError, methodNotAllowed, readJsonBody, unauthorized } from "../_lib/http";
import { createUserSupabaseClient } from "../_lib/supabase";

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

  const body = readJsonBody<{ plot_id?: number; requested_type?: string }>(req);
  const plotId = body.plot_id;
  if (plotId === undefined || plotId === null || !Number.isFinite(Number(plotId))) {
    badRequest(res, "plot_id is required and must be a number");
    return;
  }

  let requestedType: PermitPlotType | null = null;
  if (body.requested_type !== undefined && body.requested_type !== null && body.requested_type !== "") {
    if (!isPermitPlotType(body.requested_type)) {
      badRequest(res, "requested_type is invalid", { allowed: PERMIT_PLOT_TYPES });
      return;
    }
    requestedType = body.requested_type;
  }

  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.rpc("create_plot_permit_application", {
    p_plot_id: Number(plotId),
    p_requested_type: requestedType,
  });

  if (error) {
    mapRpcError(res, error);
    return;
  }

  const payload = data as { success?: boolean; existing?: boolean; application?: unknown; error?: string };
  if (payload?.success === false && payload.error === "plot_not_found") {
    res.status(404).json({ error: "plot_not_found" });
    return;
  }

  const statusCode = payload?.existing ? 200 : 201;
  res.status(statusCode).json(payload);
}
