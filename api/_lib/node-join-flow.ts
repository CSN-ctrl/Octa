import { nodeJoinAutoApproveEnabled } from "./node-constants";
import { createServiceSupabaseClient } from "./supabase-admin";
import { generateNodeCredential } from "./node-credential";
import { authorizeZeroTierMember, deauthorizeZeroTierMember, getZeroTierConfig } from "./node-zerotier";
import type { NodeRow } from "./node-http";

export async function issueNodeCredential(nodeId: string): Promise<string | null> {
  const admin = createServiceSupabaseClient();
  const { token, hash } = generateNodeCredential();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("nodes")
    .update({
      credential_hash: hash,
      credential_rotated_at: now,
      updated_at: now,
    })
    .eq("id", nodeId);
  if (error) return null;
  return token;
}

export type ApproveJoinResult =
  | { ok: true; node: NodeRow; nodeCredential?: string }
  | { ok: false; status: "pending_authorization"; error: string; node: NodeRow }
  | { ok: false; error: string };

export async function approveJoinRequest(
  joinRequestId: string,
  reviewerId: string | null,
): Promise<ApproveJoinResult> {
  const admin = createServiceSupabaseClient();
  const { data: jr, error: jrErr } = await admin
    .from("node_join_requests")
    .select("*, nodes(*)")
    .eq("id", joinRequestId)
    .maybeSingle();

  if (jrErr || !jr) {
    return { ok: false, error: "join_request_not_found" };
  }

  const node = (jr as { nodes: NodeRow }).nodes;
  if (!node) return { ok: false, error: "node_not_found" };

  if (jr.status === "approved" && node.status === "approved") {
    return { ok: true, node };
  }

  const ztConfig = getZeroTierConfig();
  if (!ztConfig) {
    await admin
      .from("node_join_requests")
      .update({
        status: "pending_authorization",
        zerotier_last_error: "zerotier_not_configured",
        updated_at: new Date().toISOString(),
      })
      .eq("id", joinRequestId);
    await admin
      .from("nodes")
      .update({ status: "pending", reason: null, updated_at: new Date().toISOString() })
      .eq("id", node.id);
    const { data: refreshed } = await admin.from("nodes").select("*").eq("id", node.id).single();
    return {
      ok: false,
      status: "pending_authorization",
      error: "zerotier_not_configured",
      node: refreshed as NodeRow,
    };
  }

  const memberName = `octa-${node.wallet_address.slice(2, 10)}-${node.zerotier_node_id}`;
  const zt = await authorizeZeroTierMember(node.zerotier_node_id, memberName, ztConfig);
  if (!zt.ok) {
    await admin
      .from("node_join_requests")
      .update({
        status: "pending_authorization",
        zerotier_last_error: zt.error ?? "zerotier_authorize_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", joinRequestId);
    const { data: refreshed } = await admin.from("nodes").select("*").eq("id", node.id).single();
    return {
      ok: false,
      status: "pending_authorization",
      error: zt.error ?? "zerotier_authorize_failed",
      node: refreshed as NodeRow,
    };
  }

  const now = new Date().toISOString();

  await admin
    .from("node_join_requests")
    .update({
      status: "approved",
      reviewer_id: reviewerId,
      reviewed_at: now,
      zerotier_member_id: node.zerotier_node_id,
      zerotier_authorized_at: now,
      zerotier_last_error: null,
      updated_at: now,
    })
    .eq("id", joinRequestId);

  await admin
    .from("nodes")
    .update({
      status: "approved",
      reason: null,
      zt_authorized_at: now,
      updated_at: now,
    })
    .eq("id", node.id);

  const { data: approvedNode } = await admin.from("nodes").select("*").eq("id", node.id).single();
  return { ok: true, node: approvedNode as NodeRow };
}

export async function rejectJoinRequest(
  joinRequestId: string,
  reviewerId: string | null,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createServiceSupabaseClient();
  const { data: jr } = await admin.from("node_join_requests").select("node_id").eq("id", joinRequestId).maybeSingle();
  if (!jr) return { ok: false, error: "join_request_not_found" };
  const now = new Date().toISOString();
  await admin
    .from("node_join_requests")
    .update({
      status: "rejected",
      reason,
      reviewer_id: reviewerId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", joinRequestId);
  await admin
    .from("nodes")
    .update({ status: "rejected", reason, updated_at: now })
    .eq("id", jr.node_id);
  return { ok: true };
}

export async function revokeNode(
  nodeId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createServiceSupabaseClient();
  const { data: node } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (!node) return { ok: false, error: "node_not_found" };

  const ztConfig = getZeroTierConfig();
  if (ztConfig && node.zt_authorized_at) {
    await deauthorizeZeroTierMember(node.zerotier_node_id, ztConfig);
  }

  const now = new Date().toISOString();
  await admin
    .from("nodes")
    .update({
      status: "revoked",
      reason,
      credential_hash: null,
      pending_token_hash: null,
      updated_at: now,
    })
    .eq("id", nodeId);

  await admin
    .from("node_join_requests")
    .update({ status: "revoked", reason, updated_at: now })
    .eq("node_id", nodeId);

  return { ok: true };
}

export async function tryAutoApproveJoin(joinRequestId: string): Promise<{ nodeCredential?: string }> {
  if (!nodeJoinAutoApproveEnabled()) return {};
  const result = await approveJoinRequest(joinRequestId, null);
  if (!result.ok) return {};
  const token = await issueNodeCredential(result.node.id);
  if (token) {
    const admin = createServiceSupabaseClient();
    await admin
      .from("nodes")
      .update({
        pending_token_consumed_at: new Date().toISOString(),
        pending_token_hash: null,
      })
      .eq("id", result.node.id);
  }
  return { nodeCredential: token ?? undefined };
}
