import type { ApiRequest, ApiResponse } from "../_lib/types";
import { methodNotAllowed, requireBearerToken, unauthorized } from "../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../_lib/node-http";
import { isNetworkGovernanceReviewer, resolveSupabaseUser } from "../_lib/node-auth";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import { zeroTierAlertFromNode, type ZeroTierAlertFields } from "../_lib/node-zt-pending";
import type { NodeRow } from "../_lib/node-http";

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

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const { data: rows, error } = await admin
    .from("node_join_requests")
    .select("id, status, reason, wallet_address, created_at, node_id, nodes(*)")
    .in("status", ["pending", "pending_authorization"])
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    jsonError(res, 500, "internal_error", error.message);
    return;
  }

  const queue = (rows ?? []).map((row) => {
    const node = (row as { nodes: NodeRow | null }).nodes;
    const zerotier_alert: ZeroTierAlertFields | null = node ? zeroTierAlertFromNode(node) : null;
    const alertActive =
      zerotier_alert &&
      (zerotier_alert.deauth_pending ||
        zerotier_alert.authorize_pending ||
        Boolean(zerotier_alert.last_deauth_error) ||
        Boolean(zerotier_alert.last_authorize_error));

    return {
      join_request_id: row.id,
      status: row.status,
      reason: row.reason,
      wallet_address: row.wallet_address,
      created_at: row.created_at,
      node: node ? serializeNodePublic(node) : null,
      zerotier_alert,
      zerotier_alert_active: Boolean(alertActive),
    };
  });

  jsonSuccess(res, 200, { queue });
}
