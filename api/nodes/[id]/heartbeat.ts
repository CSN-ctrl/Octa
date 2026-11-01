import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import { resolveNodeOrPendingAuth } from "../_lib/node-auth";
import { rateLimitHeartbeat } from "../_lib/node-rate-limit";
import { heartbeatMinGapMs, nextHeartbeatPayload } from "../_lib/node-heartbeat-config";
import { isNodePlatform } from "../_lib/node-constants";
import { appendNodeEvent } from "../_lib/node-events";
import { respondNodeRevoked } from "../_lib/node-revoked";

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

  const nodeAuth = await resolveNodeOrPendingAuth({ headers: req.headers, nodeId });
  if (!nodeAuth || nodeAuth.kind !== "node") {
    jsonError(res, 401, "unauthorized", "Authorization: Node <credential> required");
    return;
  }

  if (nodeAuth.node.status === "revoked") {
    await appendNodeEvent(nodeId, "heartbeat_rejected", {
      cause: "node_revoked",
      reason: nodeAuth.node.reason,
    });
    respondNodeRevoked(jsonError, res, nodeAuth.node);
    return;
  }

  if (nodeAuth.node.status !== "approved") {
    jsonError(res, 403, "forbidden", "Node must be approved before heartbeats");
    return;
  }

  if (!rateLimitHeartbeat(nodeId, heartbeatMinGapMs(nodeAuth.node.platform))) {
    await appendNodeEvent(nodeId, "heartbeat_rejected", { cause: "rate_limited" });
    jsonError(res, 429, "rate_limited", "Heartbeat sent too soon");
    return;
  }

  const body = readJsonBody<{
    uptime_secs?: number;
    version?: string;
    zt_online?: boolean;
    platform?: string;
    peers?: number;
    block_height?: number | null;
  }>(req);

  const platform = body.platform?.trim().toLowerCase() ?? nodeAuth.node.platform;
  if (body.platform && !isNodePlatform(platform)) {
    jsonError(res, 400, "bad_request", "platform must be android, web, or desktop");
    return;
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const now = new Date().toISOString();
  const uptime =
    body.uptime_secs !== undefined && Number.isFinite(Number(body.uptime_secs))
      ? Number(body.uptime_secs)
      : null;
  const peers =
    body.peers !== undefined && Number.isFinite(Number(body.peers)) ? Number(body.peers) : null;
  const blockHeight =
    body.block_height === null || body.block_height === undefined
      ? null
      : Number.isFinite(Number(body.block_height))
        ? Number(body.block_height)
        : null;

  await admin.from("node_heartbeats").insert({
    node_id: nodeId,
    uptime_secs: uptime,
    app_version: body.version?.trim() ?? null,
    zerotier_online: body.zt_online ?? null,
    peers,
    chain_height: blockHeight,
    metadata: { platform },
  });

  await admin
    .from("nodes")
    .update({
      last_heartbeat_at: now,
      last_uptime_secs: uptime,
      last_peers: peers,
      last_zerotier_online: body.zt_online ?? null,
      last_chain_height: blockHeight,
      last_app_version: body.version?.trim() ?? nodeAuth.node.last_app_version,
      updated_at: now,
    })
    .eq("id", nodeId);

  const { data: refreshed } = await admin.from("nodes").select("*").eq("id", nodeId).single();

  jsonSuccess(res, 200, {
    node: serializeNodePublic(refreshed ?? nodeAuth.node),
    ...nextHeartbeatPayload(platform),
  });
}
