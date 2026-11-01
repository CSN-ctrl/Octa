import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import {
  maxActiveNodesPerWallet,
  normalizeWalletAddress,
  PENDING_TOKEN_TTL_SECONDS,
} from "../_lib/node-constants";
import { verifyChallengeSignature, type ChallengeRecord } from "../_lib/node-challenge";
import { generatePendingToken } from "../_lib/node-credential";
import { fetchLiveNodesForWallet, linkWalletToUser, resolveSupabaseUser } from "../_lib/node-auth";
import { tryAutoApproveJoin } from "../_lib/node-join-flow";
import { nextHeartbeatPayload } from "../_lib/node-heartbeat-config";
import { deauthorizeZeroTierMember, getZeroTierConfig } from "../_lib/node-zerotier";
import type { NodeRow } from "../_lib/node-http";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const body = readJsonBody<{
    challenge_id?: string;
    wallet_address?: string;
    signature?: string;
    replace_node_id?: string;
  }>(req);

  const challengeId = body.challenge_id?.trim();
  const wallet = body.wallet_address ? normalizeWalletAddress(body.wallet_address) : null;
  const signature = body.signature?.trim();

  if (!challengeId || !wallet || !signature) {
    jsonError(res, 400, "bad_request", "challenge_id, wallet_address, and signature are required");
    return;
  }

  const { data: challenge, error: chErr } = await admin
    .from("node_join_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  if (chErr || !challenge) {
    jsonError(res, 404, "challenge_not_found");
    return;
  }

  if (body.replace_node_id?.trim() && body.replace_node_id.trim() !== challenge.replace_node_id) {
    jsonError(res, 400, "bad_request", "replace_node_id must match the challenge");
    return;
  }

  if (challenge.purpose !== "join") {
    jsonError(res, 400, "bad_request", "challenge purpose must be join");
    return;
  }

  if (challenge.consumed_at) {
    jsonError(res, 409, "challenge_consumed");
    return;
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    jsonError(res, 410, "challenge_expired");
    return;
  }

  if (challenge.wallet_address !== wallet) {
    jsonError(res, 400, "bad_request", "wallet_address does not match challenge");
    return;
  }

  const verified = await verifyChallengeSignature(challenge as ChallengeRecord, signature, wallet);
  if (!verified.ok) {
    jsonError(res, verified.error === "join_context_mismatch" ? 403 : 401, verified.error, verified.message);
    return;
  }

  const liveNodes = await fetchLiveNodesForWallet(wallet);
  const replaceId = challenge.replace_node_id as string | null;
  if (!replaceId && liveNodes.length >= maxActiveNodesPerWallet()) {
    jsonError(res, 409, "device_limit_reached", undefined, {
      active_nodes: liveNodes.map(serializeNodePublic),
    });
    return;
  }

  let ztDeauthOk = true;
  let ztDeauthError: string | null = null;
  if (replaceId) {
    const oldNode = liveNodes.find((n) => n.id === replaceId);
    if (!oldNode) {
      jsonError(res, 400, "bad_request", "replace_node_id is not a live node for this wallet");
      return;
    }
    const ztConfig = getZeroTierConfig();
    if (ztConfig && oldNode.zt_authorized_at) {
      const zt = await deauthorizeZeroTierMember(oldNode.zerotier_node_id, ztConfig);
      ztDeauthOk = zt.ok;
      ztDeauthError = zt.error ?? null;
    }
  }

  const supabaseUser = await resolveSupabaseUser(req);
  const userId = supabaseUser?.userId ?? challenge.user_id ?? null;
  if (supabaseUser) {
    await linkWalletToUser(supabaseUser.userId, wallet);
  }

  const pending = generatePendingToken();
  const pendingExpires = new Date(Date.now() + PENDING_TOKEN_TTL_SECONDS * 1000).toISOString();

  const { data: rpcResult, error: rpcError } = await admin.rpc("complete_personal_node_join", {
    p_wallet: wallet,
    p_challenge_id: challenge.id,
    p_user_id: userId,
    p_zt_id: challenge.zerotier_node_id,
    p_platform: challenge.platform,
    p_app_version: challenge.app_version,
    p_replace_node_id: replaceId,
    p_pending_token_hash: pending.hash,
    p_pending_expires: pendingExpires,
    p_max_devices: maxActiveNodesPerWallet(),
    p_zt_deauth_ok: ztDeauthOk,
    p_zt_deauth_error: ztDeauthError,
    p_signature: signature,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "";
    if (msg.includes("device_limit_reached")) {
      const active = await fetchLiveNodesForWallet(wallet);
      jsonError(res, 409, "device_limit_reached", undefined, {
        active_nodes: active.map(serializeNodePublic),
      });
      return;
    }
    if (msg.includes("challenge_consumed")) {
      jsonError(res, 409, "challenge_consumed");
      return;
    }
    if (msg.includes("zerotier_node_id_in_use")) {
      jsonError(res, 409, "zerotier_node_id_in_use");
      return;
    }
    jsonError(res, 500, "internal_error", msg);
    return;
  }

  const nodeId = (rpcResult as { node_id?: string })?.node_id;
  const joinRequestId = (rpcResult as { join_request_id?: string })?.join_request_id;
  if (!nodeId || !joinRequestId) {
    jsonError(res, 500, "internal_error", "Join RPC returned incomplete payload");
    return;
  }

  const auto = await tryAutoApproveJoin(joinRequestId);
  const { data: finalNode } = await admin.from("nodes").select("*").eq("id", nodeId).single();
  const row = (finalNode ?? null) as NodeRow | null;
  if (!row) {
    jsonError(res, 500, "internal_error", "Node not found after join");
    return;
  }

  const payload: Record<string, unknown> = {
    node: serializeNodePublic(row),
    ...nextHeartbeatPayload(row.platform),
  };

  if (auto.nodeCredential) {
    payload.node_credential = auto.nodeCredential;
  } else {
    payload.pending_token = pending.token;
  }

  jsonSuccess(res, 201, payload);
}
