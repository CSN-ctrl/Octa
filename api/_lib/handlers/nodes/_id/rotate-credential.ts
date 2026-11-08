import type { ApiRequest, ApiResponse } from "../../../types";
import { methodNotAllowed, requireBearerToken, unauthorized } from "../../../http";
import { jsonError, jsonSuccess } from "../../../node-http";
import {
  isNetworkGovernanceReviewer,
  resolveNodeOrPendingAuth,
  resolveSupabaseUser,
} from "../../../node-auth";
import { issueNodeCredential } from "../../../node-join-flow";
import { nextHeartbeatPayload } from "../../../node-heartbeat-config";
import { createServiceSupabaseClient } from "../../../supabase-admin";
import { verifyDeviceKeyHeaders } from "../../../node-device-key";
import { appendNodeEvent } from "../../../node-events";

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

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const { data: node } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (!node) {
    jsonError(res, 404, "node_not_found");
    return;
  }

  const nodeAuth = await resolveNodeOrPendingAuth({ headers: req.headers, nodeId });
  if (nodeAuth?.kind === "node") {
    if (node.status === "suspended") {
      jsonError(res, 403, "node_suspended");
      return;
    }
    if (node.status !== "approved") {
      jsonError(res, 403, "forbidden");
      return;
    }
    const deviceCheck = verifyDeviceKeyHeaders(
      req,
      nodeId,
      node.device_key_address,
      node.device_key_address ? "required" : "optional",
    );
    if (!deviceCheck.ok) {
      jsonError(res, 401, deviceCheck.error, "Device key signature required when device is registered");
      return;
    }
    const token = await issueNodeCredential(nodeId);
    if (!token) {
      jsonError(res, 500, "internal_error");
      return;
    }
    await appendNodeEvent(nodeId, "credential_rotated", { auth: "node_credential" });
    jsonSuccess(res, 200, {
      node_credential: token,
      ...nextHeartbeatPayload(node.platform),
    });
    return;
  }

  const bearer = requireBearerToken(req);
  if (!bearer) {
    unauthorized(res);
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  if (!supabaseUser) {
    jsonError(res, 401, "unauthorized");
    return;
  }

  const reviewer = await isNetworkGovernanceReviewer(supabaseUser.accessToken);
  if (node.owner_user_id !== supabaseUser.userId && !reviewer) {
    jsonError(res, 403, "forbidden");
    return;
  }

  if (node.status === "suspended") {
    jsonError(res, 403, "node_suspended");
    return;
  }

  if (node.status !== "approved") {
    jsonError(res, 403, "forbidden");
    return;
  }

  const token = await issueNodeCredential(nodeId);
  if (!token) {
    jsonError(res, 500, "internal_error");
    return;
  }

  jsonSuccess(res, 200, {
    node_credential: token,
    ...nextHeartbeatPayload(node.platform),
  });
}
