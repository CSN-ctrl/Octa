import type { ApiRequest, ApiResponse } from "../_lib/types";
import { methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import { resolveNodeOrPendingAuth } from "../_lib/node-auth";
import { issueNodeCredential } from "../_lib/node-join-flow";
import { nextHeartbeatPayload } from "../_lib/node-heartbeat-config";
import { appendNodeEvent } from "../_lib/node-events";

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

  const pendingAuth = await resolveNodeOrPendingAuth({ headers: req.headers, nodeId });
  if (!pendingAuth || pendingAuth.kind !== "pending") {
    jsonError(res, 401, "unauthorized", "Authorization: Pending <pending_token> required");
    return;
  }

  if (pendingAuth.node.status !== "approved") {
    jsonError(res, 409, "not_ready", "Node is not approved yet");
    return;
  }

  if (pendingAuth.node.pending_token_consumed_at) {
    jsonError(res, 409, "pending_token_consumed");
    return;
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const token = await issueNodeCredential(nodeId);
  if (!token) {
    jsonError(res, 500, "internal_error", "Failed to issue node credential");
    return;
  }

  const now = new Date().toISOString();
  await admin
    .from("nodes")
    .update({
      pending_token_consumed_at: now,
      pending_token_hash: null,
      updated_at: now,
    })
    .eq("id", nodeId);

  await appendNodeEvent(nodeId, "credential_issued", { source: "pending_exchange" });

  jsonSuccess(res, 200, {
    node_credential: token,
    ...nextHeartbeatPayload(pendingAuth.node.platform),
  });
}
