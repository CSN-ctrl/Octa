import type { ApiRequest, ApiResponse } from "../../../types";
import { readJsonBody, methodNotAllowed, requireBearerToken, unauthorized } from "../../../http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../../../node-http";
import { isNetworkGovernanceReviewer, resolveSupabaseUser } from "../../../node-auth";
import { suspendNode } from "../../../node-join-flow";
import { createServiceSupabaseClient } from "../../../supabase-admin";
import { nodeRouteOpportunisticZt } from "../../../node-route-zt";

export async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const idParam = req.query?.id;
  const nodeId = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!nodeId || typeof nodeId !== "string") {
    jsonError(res, 400, "bad_request", "node id is required in path");
    return;
  }

  const token = requireBearerToken(req);
  if (!token) {
    unauthorized(res);
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  if (!supabaseUser) {
    jsonError(res, 401, "unauthorized");
    return;
  }

  const reviewer = await isNetworkGovernanceReviewer(supabaseUser.accessToken);
  if (!reviewer) {
    jsonError(res, 403, "forbidden");
    return;
  }

  const body = readJsonBody<{ reason?: string }>(req);
  const reason = body.reason?.trim() || "suspended_by_governance";

  const admin = createServiceSupabaseClient();
  const { data: node } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (!node) {
    jsonError(res, 404, "node_not_found");
    return;
  }

  await nodeRouteOpportunisticZt(nodeId);

  const result = await suspendNode(nodeId, reason);
  if (!result.ok) {
    if (result.error === "node_revoked") {
      jsonError(res, 409, "node_revoked", "Revoked nodes cannot be suspended");
      return;
    }
    jsonError(res, 404, result.error ?? "not_found");
    return;
  }

  jsonSuccess(res, 200, { node: serializeNodePublic(result.node!) });
}
