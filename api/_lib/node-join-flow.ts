import { nodeJoinAutoApproveEnabled } from "./node-constants";
import { createServiceSupabaseClient } from "./supabase-admin";
import { generateNodeCredential } from "./node-credential";
import { shouldUseZeroTierCentral } from "./node-zerotier-policy";
import { authorizeZeroTierMember, getZeroTierConfig } from "./node-zerotier";
import type { NodeRow } from "./node-http";
import { appendNodeEvent } from "./node-events";
import {
  clearZeroTierAuthorizePending,
  markZeroTierAuthorizePending,
  requestZeroTierDeauthForNode,
} from "./node-zt-pending";
import { inviteAutoApproveForJoinRequest } from "./node-invites";

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

  if (!shouldUseZeroTierCentral(node)) {
    const now = new Date().toISOString();
    await admin
      .from("node_join_requests")
      .update({
        status: "approved",
        reviewer_id: reviewerId,
        reviewed_at: now,
        zerotier_member_id: null,
        zerotier_authorized_at: null,
        zerotier_last_error: null,
        updated_at: now,
      })
      .eq("id", joinRequestId);
    await admin
      .from("nodes")
      .update({
        status: "approved",
        reason: null,
        updated_at: now,
      })
      .eq("id", node.id);
    await appendNodeEvent(node.id, "approved", {
      join_request_id: joinRequestId,
      reviewer_id: reviewerId,
      zerotier: "disabled",
    });
    const { data: approvedNode } = await admin.from("nodes").select("*").eq("id", node.id).single();
    return { ok: true, node: approvedNode as NodeRow };
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
    await markZeroTierAuthorizePending(node.id, "zerotier_not_configured");
    const { data: refreshed } = await admin.from("nodes").select("*").eq("id", node.id).single();
    return {
      ok: false,
      status: "pending_authorization",
      error: "zerotier_not_configured",
      node: refreshed as NodeRow,
    };
  }

  const memberName = `octa-${node.wallet_address.slice(2, 10)}-${node.zerotier_node_id!}`;
  const zt = await authorizeZeroTierMember(node.zerotier_node_id!, memberName, ztConfig);
  if (!zt.ok) {
    await admin
      .from("node_join_requests")
      .update({
        status: "pending_authorization",
        zerotier_last_error: zt.error ?? "zerotier_authorize_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", joinRequestId);
    await markZeroTierAuthorizePending(node.id, zt.error ?? "zerotier_authorize_failed");
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

  await clearZeroTierAuthorizePending(node.id, node.zerotier_node_id!, joinRequestId);

  await appendNodeEvent(node.id, "approved", { join_request_id: joinRequestId, reviewer_id: reviewerId });

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
  await appendNodeEvent(jr.node_id, "rejected", { reason, join_request_id: joinRequestId });
  return { ok: true };
}

export async function revokeNode(
  nodeId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createServiceSupabaseClient();
  const { data: node } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (!node) return { ok: false, error: "node_not_found" };

  const now = new Date().toISOString();
  await admin
    .from("nodes")
    .update({
      status: "revoked",
      reason,
      pending_token_hash: null,
      updated_at: now,
    })
    .eq("id", nodeId);

  await admin
    .from("node_join_requests")
    .update({ status: "revoked", reason, updated_at: now })
    .eq("node_id", nodeId);

  await appendNodeEvent(nodeId, "revoked", { reason });

  await requestZeroTierDeauthForNode(node as NodeRow);

  return { ok: true };
}

export async function suspendNode(
  nodeId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string; node?: NodeRow }> {
  const admin = createServiceSupabaseClient();
  const { data: node } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (!node) return { ok: false, error: "node_not_found" };
  const row = node as NodeRow;
  if (row.status === "revoked") {
    return { ok: false, error: "node_revoked" };
  }
  if (row.status === "suspended") {
    return { ok: true, node: row };
  }

  const now = new Date().toISOString();
  await admin
    .from("nodes")
    .update({ status: "suspended", reason, updated_at: now })
    .eq("id", nodeId);

  await appendNodeEvent(nodeId, "suspended", { reason });
  await requestZeroTierDeauthForNode(row);

  const { data: refreshed } = await admin.from("nodes").select("*").eq("id", nodeId).single();
  return { ok: true, node: refreshed as NodeRow };
}

export async function reinstateNode(
  nodeId: string,
  reason: string | null,
): Promise<{ ok: boolean; error?: string; node?: NodeRow }> {
  const admin = createServiceSupabaseClient();
  const { data: node } = await admin.from("nodes").select("*").eq("id", nodeId).maybeSingle();
  if (!node) return { ok: false, error: "node_not_found" };
  const row = node as NodeRow;
  if (row.status === "revoked") {
    return { ok: false, error: "node_revoked" };
  }
  if (row.status !== "suspended") {
    return { ok: true, node: row };
  }

  const now = new Date().toISOString();
  const nextStatus = row.credential_hash ? "approved" : "pending";
  await admin
    .from("nodes")
    .update({
      status: nextStatus,
      reason: reason ?? null,
      updated_at: now,
    })
    .eq("id", nodeId);

  await appendNodeEvent(nodeId, "reinstated", { reason: reason ?? null });

  if (shouldUseZeroTierCentral(row) && row.zerotier_node_id) {
    await markZeroTierAuthorizePending(nodeId, "reinstate_pending");
  }

  const { data: refreshed } = await admin.from("nodes").select("*").eq("id", nodeId).single();
  return { ok: true, node: refreshed as NodeRow };
}

export async function tryAutoApproveJoin(joinRequestId: string): Promise<{ nodeCredential?: string }> {
  const envAuto = nodeJoinAutoApproveEnabled();
  const inviteAuto = await inviteAutoApproveForJoinRequest(joinRequestId);
  if (!envAuto && !inviteAuto) return {};
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
    await appendNodeEvent(result.node.id, "credential_issued", {
      source: inviteAuto ? "invite_auto_approve" : "auto_approve",
    });
  }
  return { nodeCredential: token ?? undefined };
}
