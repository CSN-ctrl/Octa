import type { ApiRequest, ApiResponse } from "../_lib/types";
import { methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess, noStore, serializeNodePublic } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import {
  isNetworkGovernanceReviewer,
  resolveNodeOrPendingAuth,
  resolveSupabaseUser,
} from "../_lib/node-auth";
import { rateLimitStatusPoll } from "../_lib/node-rate-limit";
import { nextHeartbeatPayload } from "../_lib/node-heartbeat-config";
import { respondNodeRevoked } from "../_lib/node-revoked";
import type { NodeRow } from "../_lib/node-http";
import { nodeRouteOpportunisticZt } from "../_lib/node-route-zt";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);

  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const idParam = req.query?.id;
  const nodeId = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!nodeId || typeof nodeId !== "string") {
    jsonError(res, 400, "bad_request", "node id is required in path");
    return;
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const { data: node, error } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (error || !node) {
    jsonError(res, 404, "node_not_found");
    return;
  }

  await nodeRouteOpportunisticZt(nodeId);

  const tokenAuth = await resolveNodeOrPendingAuth({ headers: req.headers, nodeId });
  if (tokenAuth) {
    const rateKey = `${nodeId}:${tokenAuth.kind}`;
    if (!rateLimitStatusPoll(rateKey)) {
      jsonError(res, 429, "rate_limited", "Status polling too frequent");
      return;
    }
    if (tokenAuth.node.status === "revoked" || node.status === "revoked") {
      respondNodeRevoked(jsonError, res, node as NodeRow);
      return;
    }
    jsonSuccess(res, 200, {
      node: serializeNodePublic(node),
      ...nextHeartbeatPayload(node.platform),
    });
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  if (supabaseUser) {
    const owned = node.owner_user_id === supabaseUser.userId;
    const reviewer = owned ? false : await isNetworkGovernanceReviewer(supabaseUser.accessToken);
    if (owned || reviewer) {
      if (!rateLimitStatusPoll(`${nodeId}:user:${supabaseUser.userId}`)) {
        jsonError(res, 429, "rate_limited", "Status polling too frequent");
        return;
      }
      jsonSuccess(res, 200, {
        node: serializeNodePublic(node),
        ...nextHeartbeatPayload(node.platform),
      });
      return;
    }
  }

  jsonError(
    res,
    401,
    "unauthorized",
    "Use Authorization: Pending <token>, Node <credential>, or Bearer <supabase_access_token> (owner/reviewer)",
  );
}
