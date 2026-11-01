import type { ChallengeRecord } from "./node-challenge";
import { buildMessageFromChallenge, challengeToSiweParams } from "./node-challenge";
import { maxActiveNodesPerWallet } from "./node-constants";
import { generatePendingToken } from "./node-credential";
import { fetchLiveNodesForWallet, linkWalletToUser } from "./node-auth";
import { tryAutoApproveJoin } from "./node-join-flow";
import { requestZeroTierDeauthForNode } from "./node-zt-pending";
import { nodeRouteOpportunisticZt } from "./node-route-zt";
import { createServiceSupabaseClient } from "./supabase-admin";
import type { NodeRow } from "./node-http";
import { serializeNodePublic } from "./node-http";
import { verifyChallengeSignature, type ChallengeRecord } from "./node-challenge";
import { maxActiveNodesPerWallet, PENDING_TOKEN_TTL_SECONDS } from "./node-constants";

export type JoinChallengeRow = ChallengeRecord & {
  id: string;
  user_id?: string | null;
  consumed_at?: string | null;
  signing_mode?: string;
  invite_id?: string | null;
  replace_node_id?: string | null;
};

export type CompleteJoinResult =
  | {
      ok: true;
      node: NodeRow;
      joinRequestId: string;
      pendingToken: string;
      nodeCredential?: string;
      replacedNodeId?: string | null;
    }
  | { ok: false; error: string; message?: string; statusCode?: number; active_nodes?: ReturnType<typeof serializeNodePublic>[] };

export async function executePersonalNodeJoin(params: {
  challenge: JoinChallengeRow;
  wallet: string;
  signature: string;
  userId: string | null;
  replaceNodeId?: string | null;
}): Promise<CompleteJoinResult> {
  const { challenge, wallet, signature } = params;
  const admin = createServiceSupabaseClient();

  const verified = await verifyChallengeSignature(challenge, signature, wallet);
  if (!verified.ok) {
    return {
      ok: false,
      error: verified.error,
      message: verified.message,
      statusCode: verified.error === "join_context_mismatch" ? 403 : 401,
    };
  }

  let replaceId = (params.replaceNodeId ?? challenge.replace_node_id) as string | null;
  const liveNodes = await fetchLiveNodesForWallet(wallet);
  if (!replaceId && liveNodes.length >= maxActiveNodesPerWallet()) {
    return {
      ok: false,
      error: "device_limit_reached",
      statusCode: 409,
      active_nodes: liveNodes.map(serializeNodePublic),
    };
  }

  const pending = generatePendingToken();
  const pendingExpires = new Date(Date.now() + PENDING_TOKEN_TTL_SECONDS * 1000).toISOString();

  const { data: rpcResult, error: rpcError } = await admin.rpc("complete_personal_node_join", {
    p_wallet: wallet,
    p_challenge_id: challenge.id,
    p_user_id: params.userId,
    p_zt_id: (challenge.zerotier_node_id as string | null) ?? null,
    p_platform: challenge.platform,
    p_app_version: challenge.app_version,
    p_replace_node_id: replaceId,
    p_pending_token_hash: pending.hash,
    p_pending_expires: pendingExpires,
    p_max_devices: maxActiveNodesPerWallet(),
    p_signature: signature,
    p_device_key_address: (challenge.device_key_address as string | null) ?? null,
    p_invite_id: (challenge.invite_id as string | null) ?? null,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "";
    if (msg.includes("device_limit_reached")) {
      const active = await fetchLiveNodesForWallet(wallet);
      return {
        ok: false,
        error: "device_limit_reached",
        statusCode: 409,
        active_nodes: active.map(serializeNodePublic),
      };
    }
    if (msg.includes("challenge_consumed")) {
      return { ok: false, error: "challenge_consumed", statusCode: 409 };
    }
    if (msg.includes("zerotier_node_id_in_use")) {
      return { ok: false, error: "zerotier_node_id_in_use", statusCode: 409 };
    }
    if (msg.includes("invite_invalid") || msg.includes("invite_mismatch")) {
      return { ok: false, error: "bad_request", message: "invite is no longer valid for this challenge", statusCode: 400 };
    }
    if (msg.includes("device_key_mismatch")) {
      return { ok: false, error: "bad_request", message: "device key does not match challenge", statusCode: 400 };
    }
    return { ok: false, error: "internal_error", message: msg, statusCode: 500 };
  }

  const nodeId = (rpcResult as { node_id?: string })?.node_id;
  const joinRequestId = (rpcResult as { join_request_id?: string })?.join_request_id;
  const replacedNodeId = (rpcResult as { replaced_node_id?: string | null })?.replaced_node_id;
  if (!nodeId || !joinRequestId) {
    return { ok: false, error: "internal_error", message: "Join RPC returned incomplete payload", statusCode: 500 };
  }

  if (replacedNodeId) {
    const { data: oldNode } = await admin.from("nodes").select("*").eq("id", replacedNodeId).single();
    if (oldNode) {
      await requestZeroTierDeauthForNode(oldNode as NodeRow);
    }
  }

  await nodeRouteOpportunisticZt(nodeId, joinRequestId);

  const auto = await tryAutoApproveJoin(joinRequestId);
  const { data: finalNode } = await admin.from("nodes").select("*").eq("id", nodeId).single();
  const row = (finalNode ?? null) as NodeRow | null;
  if (!row) {
    return { ok: false, error: "internal_error", message: "Node not found after join", statusCode: 500 };
  }

  return {
    ok: true,
    node: row,
    joinRequestId,
    pendingToken: pending.token,
    nodeCredential: auto.nodeCredential,
    replacedNodeId: replacedNodeId ?? null,
  };
}

export async function linkUserIfPresent(userId: string | null, wallet: string, link: boolean): Promise<void> {
  if (link && userId) {
    await linkWalletToUser(userId, wallet);
  }
}

export { buildMessageFromChallenge, challengeToSiweParams };
