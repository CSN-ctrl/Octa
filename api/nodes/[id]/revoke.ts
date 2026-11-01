import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed, requireBearerToken, unauthorized } from "../_lib/http";
import { jsonError, jsonSuccess } from "../_lib/node-http";
import {
  isNetworkGovernanceReviewer,
  resolveNodeOrPendingAuth,
  resolveSupabaseUser,
} from "../_lib/node-auth";
import { revokeNode } from "../_lib/node-join-flow";

export default async function handler(req: ApiRequest, res: ApiResponse) {
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

  const body = readJsonBody<{ reason?: string }>(req);
  const reason = body.reason?.trim() || "revoked_by_owner";

  const nodeAuth = await resolveNodeOrPendingAuth({ headers: req.headers, nodeId });
  if (nodeAuth?.kind === "node") {
    const result = await revokeNode(nodeId, reason);
    if (!result.ok) {
      jsonError(res, 404, result.error ?? "not_found");
      return;
    }
    jsonSuccess(res, 200, { revoked: true });
    return;
  }

  const token = requireBearerToken(req);
  if (!token) {
    unauthorized(res, "Node credential or Supabase bearer required");
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  if (!supabaseUser) {
    jsonError(res, 401, "unauthorized");
    return;
  }

  const admin = await import("../_lib/supabase-admin").then((m) => m.createServiceSupabaseClient());
  const { data: node } = await admin.from("nodes").select("owner_user_id").eq("id", nodeId).maybeSingle();
  if (!node) {
    jsonError(res, 404, "node_not_found");
    return;
  }

  const reviewer = await isNetworkGovernanceReviewer(supabaseUser.accessToken);
  if (node.owner_user_id !== supabaseUser.userId && !reviewer) {
    jsonError(res, 403, "forbidden");
    return;
  }

  const result = await revokeNode(nodeId, reason);
  if (!result.ok) {
    jsonError(res, 404, result.error ?? "not_found");
    return;
  }

  jsonSuccess(res, 200, { revoked: true });
}
