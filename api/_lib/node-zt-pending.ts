import { shouldUseZeroTierCentral, zerotierEnabled } from "./node-zerotier-policy";
import { createServiceSupabaseClient } from "./supabase-admin";
import { appendNodeEvent } from "./node-events";
import type { NodeRow } from "./node-http";
import {
  authorizeZeroTierMember,
  deauthorizeZeroTierMember,
  getZeroTierConfig,
  type ZeroTierConfig,
} from "./node-zerotier";

const BACKOFF_BASE_SECS = 60;
const BACKOFF_MAX_SECS = 3600;

export type ZeroTierAlertFields = {
  deauth_pending: boolean;
  authorize_pending: boolean;
  deauth_attempts: number;
  authorize_attempts: number;
  next_deauth_attempt_at: string | null;
  next_authorize_attempt_at: string | null;
  last_deauth_error: string | null;
  last_authorize_error: string | null;
};

export function zeroTierAlertFromNode(row: NodeRow): ZeroTierAlertFields {
  return {
    deauth_pending: Boolean((row as NodeRow & { zt_deauth_pending?: boolean }).zt_deauth_pending),
    authorize_pending: Boolean((row as NodeRow & { zt_authorize_pending?: boolean }).zt_authorize_pending),
    deauth_attempts: (row as NodeRow & { zt_deauth_attempts?: number }).zt_deauth_attempts ?? 0,
    authorize_attempts: (row as NodeRow & { zt_authorize_attempts?: number }).zt_authorize_attempts ?? 0,
    next_deauth_attempt_at:
      (row as NodeRow & { zt_deauth_next_attempt_at?: string | null }).zt_deauth_next_attempt_at ?? null,
    next_authorize_attempt_at:
      (row as NodeRow & { zt_authorize_next_attempt_at?: string | null }).zt_authorize_next_attempt_at ?? null,
    last_deauth_error:
      (row as NodeRow & { zt_deauth_last_error?: string | null }).zt_deauth_last_error ?? null,
    last_authorize_error:
      (row as NodeRow & { zt_authorize_last_error?: string | null }).zt_authorize_last_error ?? null,
  };
}

export function nextBackoffIso(attemptsAfterFailure: number, from = new Date()): string {
  const exponent = Math.max(0, attemptsAfterFailure - 1);
  const delaySecs = Math.min(BACKOFF_MAX_SECS, BACKOFF_BASE_SECS * 2 ** exponent);
  return new Date(from.getTime() + delaySecs * 1000).toISOString();
}

function isDue(nextAt: string | null | undefined, force: boolean, now = new Date()): boolean {
  if (force) return true;
  if (!nextAt) return true;
  return new Date(nextAt).getTime() <= now.getTime();
}

async function loadNode(nodeId: string): Promise<NodeRow | null> {
  const admin = createServiceSupabaseClient();
  const { data } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  return (data as NodeRow | null) ?? null;
}

export async function markZeroTierDeauthPending(
  nodeId: string,
  error: string,
  incrementAttempt = true,
): Promise<void> {
  const admin = createServiceSupabaseClient();
  const node = await loadNode(nodeId);
  if (!node) return;
  const prevAttempts = (node as NodeRow & { zt_deauth_attempts?: number }).zt_deauth_attempts ?? 0;
  const attempts = incrementAttempt ? prevAttempts + 1 : prevAttempts;
  const nextAt = nextBackoffIso(attempts);
  await admin
    .from("nodes")
    .update({
      zt_deauth_pending: true,
      zt_deauth_attempts: attempts,
      zt_deauth_next_attempt_at: nextAt,
      zt_deauth_last_error: error.slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", nodeId);
  await appendNodeEvent(nodeId, "zt_deauth_failed", { error, attempt: attempts, next_attempt_at: nextAt });
}

export async function clearZeroTierDeauthPending(nodeId: string, zerotierNodeId: string): Promise<void> {
  const admin = createServiceSupabaseClient();
  const now = new Date().toISOString();
  await admin
    .from("nodes")
    .update({
      zt_deauth_pending: false,
      zt_deauth_next_attempt_at: null,
      zt_deauth_last_error: null,
      zt_authorized_at: null,
      updated_at: now,
    })
    .eq("id", nodeId);
  await appendNodeEvent(nodeId, "zt_deauthorized", { zerotier_node_id: zerotierNodeId });
}

export async function markZeroTierAuthorizePending(
  nodeId: string,
  error: string,
  incrementAttempt = true,
): Promise<void> {
  const admin = createServiceSupabaseClient();
  const node = await loadNode(nodeId);
  if (!node) return;
  const prevAttempts = (node as NodeRow & { zt_authorize_attempts?: number }).zt_authorize_attempts ?? 0;
  const attempts = incrementAttempt ? prevAttempts + 1 : prevAttempts;
  const nextAt = nextBackoffIso(attempts);
  await admin
    .from("nodes")
    .update({
      zt_authorize_pending: true,
      zt_authorize_attempts: attempts,
      zt_authorize_next_attempt_at: nextAt,
      zt_authorize_last_error: error.slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", nodeId);
  await appendNodeEvent(nodeId, "zt_auth_failed", { error, attempt: attempts, next_attempt_at: nextAt });
}

export async function clearZeroTierAuthorizePending(
  nodeId: string,
  zerotierNodeId: string,
  joinRequestId?: string | null,
): Promise<void> {
  const admin = createServiceSupabaseClient();
  const now = new Date().toISOString();
  await admin
    .from("nodes")
    .update({
      zt_authorize_pending: false,
      zt_authorize_next_attempt_at: null,
      zt_authorize_last_error: null,
      zt_authorized_at: now,
      status: "approved",
      updated_at: now,
    })
    .eq("id", nodeId);
  if (joinRequestId) {
    await admin
      .from("node_join_requests")
      .update({
        status: "approved",
        zerotier_member_id: zerotierNodeId,
        zerotier_authorized_at: now,
        zerotier_last_error: null,
        updated_at: now,
      })
      .eq("id", joinRequestId);
  }
  await appendNodeEvent(nodeId, "zt_authorized", { zerotier_node_id: zerotierNodeId });
}

/** After DB revoke: best-effort Central deauth; pending + backoff on failure. */
export async function requestZeroTierDeauthForNode(
  node: Pick<NodeRow, "id" | "zerotier_node_id" | "zt_authorized_at" | "status">,
  config?: ZeroTierConfig | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!shouldUseZeroTierCentral(node)) {
    return { ok: true };
  }
  const resolved = config ?? getZeroTierConfig();
  if (!resolved) {
    await markZeroTierDeauthPending(node.id, "zerotier_not_configured");
    return { ok: false, error: "zerotier_not_configured" };
  }
  if (!node.zt_authorized_at) {
    return { ok: true };
  }
  const zt = await deauthorizeZeroTierMember(node.zerotier_node_id, resolved);
  if (zt.ok) {
    await clearZeroTierDeauthPending(node.id, node.zerotier_node_id);
    return { ok: true };
  }
  await markZeroTierDeauthPending(node.id, zt.error ?? "zerotier_deauthorize_failed");
  return { ok: false, error: zt.error };
}

export async function retryZeroTierDeauthIfDue(
  nodeId: string,
  options?: { force?: boolean },
): Promise<{ attempted: boolean; ok?: boolean }> {
  const node = await loadNode(nodeId);
  if (!node) return { attempted: false };
  const pending = (node as NodeRow & { zt_deauth_pending?: boolean }).zt_deauth_pending;
  const nextAt = (node as NodeRow & { zt_deauth_next_attempt_at?: string | null }).zt_deauth_next_attempt_at;
  const needsDeauth =
    pending || (node.status === "revoked" && node.zt_authorized_at != null);
  if (!needsDeauth) return { attempted: false };
  if (!isDue(nextAt, Boolean(options?.force))) return { attempted: false };

  const result = await requestZeroTierDeauthForNode(node);
  return { attempted: true, ok: result.ok };
}

export async function retryZeroTierAuthorizeIfDue(
  nodeId: string,
  joinRequestId: string | null,
  options?: { force?: boolean },
): Promise<{ attempted: boolean; ok?: boolean }> {
  const node = await loadNode(nodeId);
  if (!node) return { attempted: false };
  const pending = (node as NodeRow & { zt_authorize_pending?: boolean }).zt_authorize_pending;
  const nextAt = (node as NodeRow & { zt_authorize_next_attempt_at?: string | null }).zt_authorize_next_attempt_at;
  if (!pending) return { attempted: false };
  if (!isDue(nextAt, Boolean(options?.force))) return { attempted: false };

  const resolved = getZeroTierConfig();
  if (!resolved) {
    await markZeroTierAuthorizePending(node.id, "zerotier_not_configured");
    return { attempted: true, ok: false };
  }

  const memberName = `octa-${node.wallet_address.slice(2, 10)}-${node.zerotier_node_id}`;
  const zt = await authorizeZeroTierMember(node.zerotier_node_id, memberName, resolved);
  if (zt.ok) {
    await clearZeroTierAuthorizePending(node.id, node.zerotier_node_id, joinRequestId);
    return { attempted: true, ok: true };
  }
  await markZeroTierAuthorizePending(node.id, zt.error ?? "zerotier_authorize_failed");
  return { attempted: true, ok: false };
}

export async function runOpportunisticZeroTierRetries(ctx: {
  nodeId?: string | null;
  joinRequestId?: string | null;
}): Promise<void> {
  if (!ctx.nodeId) return;
  await retryZeroTierDeauthIfDue(ctx.nodeId);
  await retryZeroTierAuthorizeIfDue(ctx.nodeId, ctx.joinRequestId ?? null);
}

export async function retryAllPendingZeroTier(options?: { force?: boolean }): Promise<{
  deauth_attempted: number;
  deauth_succeeded: number;
  authorize_attempted: number;
  authorize_succeeded: number;
}> {
  if (!zerotierEnabled()) {
    return {
      deauth_attempted: 0,
      deauth_succeeded: 0,
      authorize_attempted: 0,
      authorize_succeeded: 0,
    };
  }
  const admin = createServiceSupabaseClient();
  const force = Boolean(options?.force);

  const { data: deauthRows } = await admin
    .from("nodes")
    .select("id, zt_deauth_next_attempt_at")
    .eq("zt_deauth_pending", true);

  const { data: authRows } = await admin
    .from("nodes")
    .select("id, zt_authorize_next_attempt_at")
    .eq("zt_authorize_pending", true);

  const nowMs = Date.now();
  let deauthAttempted = 0;
  let deauthSucceeded = 0;
  for (const row of deauthRows ?? []) {
    if (
      !force &&
      row.zt_deauth_next_attempt_at &&
      new Date(row.zt_deauth_next_attempt_at).getTime() > nowMs
    ) {
      continue;
    }
    const r = await retryZeroTierDeauthIfDue(row.id, { force });
    if (r.attempted) {
      deauthAttempted += 1;
      if (r.ok) deauthSucceeded += 1;
    }
  }

  let authorizeAttempted = 0;
  let authorizeSucceeded = 0;
  for (const row of authRows ?? []) {
    if (
      !force &&
      row.zt_authorize_next_attempt_at &&
      new Date(row.zt_authorize_next_attempt_at).getTime() > nowMs
    ) {
      continue;
    }
    const { data: jr } = await admin
      .from("node_join_requests")
      .select("id")
      .eq("node_id", row.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const r = await retryZeroTierAuthorizeIfDue(row.id, jr?.id ?? null, { force });
    if (r.attempted) {
      authorizeAttempted += 1;
      if (r.ok) authorizeSucceeded += 1;
    }
  }

  return {
    deauth_attempted: deauthAttempted,
    deauth_succeeded: deauthSucceeded,
    authorize_attempted: authorizeAttempted,
    authorize_succeeded: authorizeSucceeded,
  };
}

export function isZeroTierRetryAuthorized(req: { headers?: Record<string, string | string[] | undefined> }): {
  cron: boolean;
} {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const headers = req.headers ?? {};
  const authHeader = headers.authorization ?? headers.Authorization;
  const bearer =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
  if (cronSecret && bearer === cronSecret) {
    return { cron: true };
  }
  return { cron: false };
}
