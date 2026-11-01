import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import { normalizeWalletAddress } from "../_lib/node-constants";
import { executePersonalNodeJoin, linkUserIfPresent } from "../_lib/node-join-complete";
import { resolveSupabaseUser } from "../_lib/node-auth";
import { nextHeartbeatPayload } from "../_lib/node-heartbeat-config";
import { joinProofErrorStatus, respondIfJoinContextUnconfigured } from "../_lib/node-join-http";
import type { ChallengeRecord } from "../_lib/node-challenge";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  if (respondIfJoinContextUnconfigured(jsonError, res)) {
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

  const supabaseUser = await resolveSupabaseUser(req);
  const userId = supabaseUser?.userId ?? challenge.user_id ?? null;
  await linkUserIfPresent(userId, wallet, Boolean(supabaseUser));

  const joinResult = await executePersonalNodeJoin({
    challenge: { ...(challenge as ChallengeRecord), id: challengeId },
    wallet,
    signature,
    userId,
    replaceNodeId: (challenge.replace_node_id as string | null) ?? null,
    req,
  });

  if (!joinResult.ok) {
    jsonError(
      res,
      joinResult.statusCode ?? joinProofErrorStatus(joinResult.error),
      joinResult.error,
      joinResult.message,
      joinResult.active_nodes ? { active_nodes: joinResult.active_nodes } : undefined,
    );
    return;
  }

  const payload: Record<string, unknown> = {
    node: serializeNodePublic(joinResult.node),
    ...nextHeartbeatPayload(joinResult.node.platform),
  };

  if (joinResult.nodeCredential) {
    payload.node_credential = joinResult.nodeCredential;
  } else {
    payload.pending_token = joinResult.pendingToken;
  }

  jsonSuccess(res, 201, payload);
}
