import type { ApiRequest, ApiResponse } from "../../../types";
import { requireBearerToken } from "../../../auth";
import { badRequest, mapRpcError, methodNotAllowed, readJsonBody, unauthorized } from "../../../http";
import { createUserSupabaseClient } from "../../../supabase";

export async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const token = requireBearerToken(req);
  if (!token) {
    unauthorized(res);
    return;
  }

  const applicationId = req.query?.id;
  const id = Array.isArray(applicationId) ? applicationId[0] : applicationId;
  if (!id || typeof id !== "string") {
    badRequest(res, "application id is required in path");
    return;
  }

  const body = readJsonBody<{
    plot_id?: number;
    coord_x?: number;
    coord_y?: number;
    location_notes?: Record<string, unknown>;
  }>(req);

  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.rpc("confirm_plot_permit_location", {
    p_application_id: id,
    p_plot_id: body.plot_id ?? null,
    p_coord_x: body.coord_x ?? null,
    p_coord_y: body.coord_y ?? null,
    p_location_notes: body.location_notes ?? null,
  });

  if (error) {
    mapRpcError(res, error);
    return;
  }

  const payload = data as { success?: boolean; error?: string };
  if (payload?.success === false) {
    if (payload.error === "not_found") {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (payload.error === "not_pending") {
      res.status(409).json({ error: "not_pending" });
      return;
    }
  }

  res.status(200).json(data);
}
