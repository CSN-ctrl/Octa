import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import {
  CHALLENGE_TTL_SECONDS,
  maxActiveNodesPerWallet,
  normalizeWalletAddress,
  PENDING_TOKEN_TTL_SECONDS,
} from "../_lib/node-constants";
import { buildChallengeSignMessage } from "../_lib/node-message";
import { recoverWalletFromJoinSignature } from "../_lib/node-signature";
import { generatePendingToken } from "../_lib/node-credential";
import { countLiveNodesForWallet, linkWalletToUser, resolveSupabaseUser } from "../_lib/node-auth";
import { tryAutoApproveJoin } from "../_lib/node-join-flow";
import { nextHeartbeatPayload } from "../_lib/node-heartbeat-config";
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

  const issuedAt = new Date(
    new Date(challenge.expires_at).getTime() - CHALLENGE_TTL_SECONDS * 1000,
  ).toISOString();

  const message = buildChallengeSignMessage({
    purpose: "join",
    walletAddress: challenge.wallet_address,
    zerotierNodeId: challenge.zerotier_node_id,
    platform: challenge.platform,
    appVersion: challenge.app_version,
    nonce: challenge.nonce,
    issuedAt,
    expiresAt: challenge.expires_at,
  });

  const recovered = recoverWalletFromJoinSignature(message, signature);
  if (!recovered || recovered !== wallet) {
    jsonError(res, 401, "invalid_signature");
    return;
  }

  const liveCount = await countLiveNodesForWallet(wallet);
  if (liveCount >= maxActiveNodesPerWallet()) {
    jsonError(res, 429, "wallet_node_limit", `Maximum ${maxActiveNodesPerWallet()} live nodes per wallet`);
    return;
  }

  const { data: ztConflict } = await admin
    .from("nodes")
    .select("id")
    .eq("zerotier_node_id", challenge.zerotier_node_id)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (ztConflict) {
    jsonError(res, 409, "zerotier_node_id_in_use");
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  const userId = supabaseUser?.userId ?? challenge.user_id ?? null;
  if (supabaseUser) {
    await linkWalletToUser(supabaseUser.userId, wallet);
  }

  const pending = generatePendingToken();
  const pendingExpires = new Date(Date.now() + PENDING_TOKEN_TTL_SECONDS * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: node, error: nodeErr } = await admin
    .from("nodes")
    .insert({
      owner_user_id: userId,
      wallet_address: wallet,
      zerotier_node_id: challenge.zerotier_node_id,
      platform: challenge.platform,
      app_version: challenge.app_version,
      status: "pending",
      pending_token_hash: pending.hash,
      pending_token_expires_at: pendingExpires,
    })
    .select("*")
    .single();

  if (nodeErr || !node) {
    jsonError(res, 500, "internal_error", nodeErr?.message ?? "Failed to create node");
    return;
  }

  const { data: joinRequest, error: jrErr } = await admin
    .from("node_join_requests")
    .insert({
      user_id: userId,
      wallet_address: wallet,
      zerotier_node_id: challenge.zerotier_node_id,
      platform: challenge.platform,
      app_version: challenge.app_version,
      challenge_id: challenge.id,
      signature,
      status: "pending",
      node_id: node.id,
    })
    .select("id")
    .single();

  if (jrErr || !joinRequest) {
    jsonError(res, 500, "internal_error", jrErr?.message ?? "Failed to create join request");
    return;
  }

  await admin.from("node_join_challenges").update({ consumed_at: now }).eq("id", challenge.id);

  const auto = await tryAutoApproveJoin(joinRequest.id);
  const { data: finalNode } = await admin.from("nodes").select("*").eq("id", node.id).single();
  const row = (finalNode ?? node) as NodeRow;

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
