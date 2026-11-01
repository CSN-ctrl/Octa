import { onlineThresholdMs } from "./node-heartbeat-config";
import type { ApiResponse } from "./types";

export type NodeRow = {
  id: string;
  owner_user_id: string | null;
  wallet_address: string;
  zerotier_node_id: string;
  platform: string;
  app_version: string;
  status: string;
  reason: string | null;
  zt_authorized_at: string | null;
  replaced_by_node_id: string | null;
  zt_deauth_pending?: boolean;
  zt_deauth_attempts?: number;
  zt_deauth_next_attempt_at?: string | null;
  zt_deauth_last_error?: string | null;
  zt_authorize_pending?: boolean;
  zt_authorize_attempts?: number;
  zt_authorize_next_attempt_at?: string | null;
  zt_authorize_last_error?: string | null;
  credential_hash: string | null;
  pending_token_hash: string | null;
  pending_token_expires_at: string | null;
  pending_token_consumed_at: string | null;
  last_heartbeat_at: string | null;
  last_app_version: string | null;
  last_uptime_secs: number | null;
  last_peers: number | null;
  last_zerotier_online: boolean | null;
  last_chain_height: number | null;
  created_at: string;
  updated_at: string;
};

export function nodeIsOnline(row: Pick<NodeRow, "status" | "last_heartbeat_at" | "platform">): boolean {
  if (row.status !== "approved") return false;
  if (!row.last_heartbeat_at) return false;
  const ageMs = Date.now() - new Date(row.last_heartbeat_at).getTime();
  return ageMs <= onlineThresholdMs(row.platform);
}

export function serializeNodePublic(row: NodeRow) {
  const lastSeen = row.last_heartbeat_at ?? row.updated_at;
  return {
    id: row.id,
    status: row.status,
    reason: row.reason ?? null,
    zerotier_node_id: row.zerotier_node_id,
    zt_authorized: row.zt_authorized_at != null,
    last_seen_at: lastSeen,
    online: nodeIsOnline(row),
    app_version: row.last_app_version ?? row.app_version ?? "",
    uptime_secs: row.last_uptime_secs ?? null,
    peers: row.last_peers ?? null,
    wallet_address: row.wallet_address,
    platform: row.platform,
  };
}

export function jsonSuccess(res: ApiResponse, statusCode: number, body: Record<string, unknown>): void {
  res.status(statusCode).json({ success: true, ...body });
}

export function jsonError(
  res: ApiResponse,
  statusCode: number,
  error: string,
  message?: string,
  extra?: Record<string, unknown>,
): void {
  res.status(statusCode).json({
    success: false,
    error,
    ...(message ? { message } : {}),
    ...extra,
  });
}

export function noStore(res: ApiResponse): void {
  res.setHeader("Cache-Control", "no-store");
}
