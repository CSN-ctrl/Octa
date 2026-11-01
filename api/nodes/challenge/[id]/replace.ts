import type { ApiRequest, ApiResponse } from "../../../_lib/types";
import { readJsonBody, methodNotAllowed } from "../../../_lib/http";
import { jsonError, jsonSuccess, noStore } from "../../../_lib/node-http";
import { createServiceSupabaseClient } from "../../../_lib/supabase-admin";
import {
  challengeState,
  reissueChallengeFields,
  verifyBrowserChallengeSignature,
  type BrowserChallengeRow,
} from "../../../_lib/node-browser-challenge";
import { buildMessageFromChallenge } from "../../../_lib/node-challenge";
import { fetchLiveNodesForWallet } from "../../../_lib/node-auth";
import { joinProofErrorStatus, respondIfJoinContextUnconfigured } from "../../../_lib/node-join-http";
import { rateLimitBrowserChallengeWrite } from "../../../_lib/node-rate-limit";

function challengeIdFromReq(req: ApiRequest): string | null {
  const idParam = req.query?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  return id && typeof id === "string" ? id : null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);

  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  if (respondIfJoinContextUnconfigured(jsonError, res)) {
    return;
  }

  const challengeId = challengeIdFromReq(req);
  if (!challengeId) {
    jsonError(res, 400, "bad_request", "challenge id is required in path");
    return;
  }

  if (!rateLimitBrowserChallengeWrite(`${challengeId}:replace`)) {
    jsonError(res, 429, "rate_limited");
    return;
  }

  const body = readJsonBody<{ replace_node_id?: string; signature?: string }>(req);
  const replaceNodeId = body.replace_node_id?.trim();
  const signature = body.signature?.trim();
  if (!replaceNodeId || !signature) {
    jsonError(res, 400, "bad_request", "replace_node_id and signature are required");
    return;
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
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

  if (challenge.signing_mode !== "browser") {
    jsonError(res, 404, "challenge_not_found");
    return;
  }

  const row = challenge as BrowserChallengeRow;
  const state = challengeState(row);
  if (state === "expired") {
    jsonError(res, 410, "challenge_expired", undefined, { state: "expired" });
    return;
  }
  if (state !== "pending") {
    jsonError(res, 409, "challenge_not_pending", undefined, { state });
    return;
  }

  if (challenge.replace_node_id) {
    jsonError(res, 400, "bad_request", "challenge already bound to a replace target");
    return;
  }

  const live = await fetchLiveNodesForWallet(row.wallet_address);
  if (!live.some((n) => n.id === replaceNodeId)) {
    jsonError(res, 400, "bad_request", "replace_node_id must be a live node owned by this wallet");
    return;
  }

  const proofChallenge = { ...row, replace_node_id: null };
  const verified = await verifyBrowserChallengeSignature(proofChallenge, signature, new Date(), req);
  if (!verified.ok) {
    if (verified.error === "wrong_wallet") {
      jsonError(res, 400, "wrong_wallet");
      return;
    }
    jsonError(res, joinProofErrorStatus(verified.error), verified.error, verified.message);
    return;
  }

  const { nonce, issued_at, expires_at } = reissueChallengeFields(row);
  const { error: updErr } = await admin
    .from("node_join_challenges")
    .update({
      replace_node_id: replaceNodeId,
      nonce,
      issued_at,
      expires_at,
      consumed_at: null,
    })
    .eq("id", challengeId);

  if (updErr) {
    jsonError(res, 500, "internal_error", updErr.message);
    return;
  }

  const updatedRow: BrowserChallengeRow = {
    ...row,
    replace_node_id: replaceNodeId,
    nonce,
    issued_at,
    expires_at,
  };

  jsonSuccess(res, 200, {
    challenge_id: challengeId,
    nonce,
    message: buildMessageFromChallenge(updatedRow),
    expires_at,
    replace_node_id: replaceNodeId,
    state: "pending",
  });
}
