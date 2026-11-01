import type { ApiRequest, ApiResponse } from "../_lib/types";
import { readJsonBody, methodNotAllowed } from "../_lib/http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../_lib/node-http";
import { createServiceSupabaseClient } from "../_lib/supabase-admin";
import { normalizeWalletAddress } from "../_lib/node-constants";
import { verifyChallengeSignature, type ChallengeRecord } from "../_lib/node-challenge";
import { fetchNodesForWallet } from "../_lib/node-auth";

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

  const { data: challenge } = await admin
    .from("node_join_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  if (!challenge) {
    jsonError(res, 404, "challenge_not_found");
    return;
  }

  if (challenge.purpose !== "lookup") {
    jsonError(res, 400, "bad_request", "challenge purpose must be lookup");
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

  const verified = await verifyChallengeSignature(challenge as ChallengeRecord, signature, wallet, req);
  if (!verified.ok) {
    jsonError(res, verified.error === "join_context_mismatch" ? 403 : 401, verified.error, verified.message);
    return;
  }

  await admin
    .from("node_join_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challenge.id);

  const nodes = await fetchNodesForWallet(wallet);
  jsonSuccess(res, 200, {
    nodes: nodes.map(serializeNodePublic),
  });
}
