import type { ApiRequest, ApiResponse } from "../../_lib/types";
import { readJsonBody, methodNotAllowed, requireBearerToken, unauthorized } from "../../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../../_lib/node-http";
import { isNetworkGovernanceReviewer, resolveSupabaseUser } from "../../_lib/node-auth";
import { approveJoinRequest, rejectJoinRequest } from "../../_lib/node-join-flow";
import { createServiceSupabaseClient } from "../../_lib/supabase-admin";

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

  const joinRequestId = req.query?.id;
  const id = Array.isArray(joinRequestId) ? joinRequestId[0] : joinRequestId;
  if (!id || typeof id !== "string") {
    jsonError(res, 400, "bad_request", "join request id is required in path");
    return;
  }

  const body = readJsonBody<{ action?: string; reason?: string }>(req);
  const action = body.action?.trim().toLowerCase();
  if (action !== "approve" && action !== "reject") {
    jsonError(res, 400, "bad_request", "action must be approve or reject");
    return;
  }

  if (action === "reject") {
    const reason = body.reason?.trim() || "rejected_by_reviewer";
    const rejected = await rejectJoinRequest(id, supabaseUser.userId, reason);
    if (!rejected.ok) {
      jsonError(res, 404, rejected.error ?? "not_found");
      return;
    }
    const admin = createServiceSupabaseClient();
    const { data: jr } = await admin.from("node_join_requests").select("node_id").eq("id", id).single();
    const { data: node } = jr
      ? await admin.from("nodes").select("*").eq("id", jr.node_id).single()
      : { data: null };
    jsonSuccess(res, 200, { node: node ? serializeNodePublic(node) : null });
    return;
  }

  const approved = await approveJoinRequest(id, supabaseUser.userId);
  if (!approved.ok) {
    if ("status" in approved && approved.status === "pending_authorization") {
      jsonSuccess(res, 200, {
        node: serializeNodePublic(approved.node),
        pending_authorization: true,
        error: approved.error,
      });
      return;
    }
    jsonError(res, 404, approved.error ?? "not_found");
    return;
  }

  jsonSuccess(res, 200, { node: serializeNodePublic(approved.node) });
}
