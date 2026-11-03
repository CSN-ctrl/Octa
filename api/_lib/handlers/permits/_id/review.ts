import type { ApiRequest, ApiResponse } from "../../../types";
import { requireBearerToken } from "../../../auth";
import { isPermitPlotType } from "../../../permit-types";
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
    action?: string;
    assigned_type?: string;
    rejection_reason?: string;
  }>(req);

  const action = body.action?.trim().toLowerCase();
  if (action !== "approve" && action !== "reject") {
    badRequest(res, "action must be approve or reject");
    return;
  }

  let assignedType: string | null = null;
  if (action === "approve") {
    if (!body.assigned_type || !isPermitPlotType(body.assigned_type)) {
      badRequest(res, "assigned_type is required for approve");
      return;
    }
    assignedType = body.assigned_type;
  }

  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.rpc("review_plot_permit_application", {
    p_application_id: id,
    p_action: action,
    p_assigned_type: assignedType,
    p_rejection_reason: body.rejection_reason ?? null,
  });

  if (error) {
    mapRpcError(res, error);
    return;
  }

  res.status(200).json(data);
}
