import type { ApiRequest, ApiResponse } from "../../../_lib/types";
import { readJsonBody, methodNotAllowed } from "../../../_lib/http";
import { jsonError, jsonSuccess, noStore } from "../../../_lib/node-http";
import { createServiceSupabaseClient } from "../../../_lib/supabase-admin";
import {
  assertDeviceCapacityOrReplace,
  challengeState,
  fetchCapNodesForWallet,
  serializeChallengePublicPayload,
  verifyBrowserChallengeSignature,
  type BrowserChallengeRow,
} from "../../../_lib/node-browser-challenge";
import { executePersonalNodeJoin } from "../../../_lib/node-join-complete";
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

  const challengeId = challengeIdFromReq(req);
  if (!challengeId) {
    jsonError(res, 400, "bad_request", "challenge id is required in path");
    return;
  }

  if (!rateLimitBrowserChallengeWrite(challengeId)) {
    jsonError(res, 429, "rate_limited");
    return;
  }

  const body = readJsonBody<{ signature?: string; replace_node_id?: string }>(req);
  const signature = body.signature?.trim();
  if (!signature) {
    jsonError(res, 400, "bad_request", "signature is required");
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

  if (state === "already_used") {
    jsonError(res, 409, "challenge_consumed", undefined, { state: "already_used" });
    return;
  }

  if (state === "expired") {
    jsonError(res, 410, "challenge_expired", undefined, { state: "expired" });
    return;
  }

  if (state === "signed") {
    jsonSuccess(res, 200, {
      state: "signed",
      ...serializeChallengePublicPayload(row),
    });
    return;
  }

  if (body.replace_node_id?.trim() && body.replace_node_id.trim() !== challenge.replace_node_id) {
    jsonError(res, 400, "bad_request", "replace_node_id must match the challenge");
    return;
  }

  const verified = await verifyBrowserChallengeSignature(row, signature, new Date(), req);
  if (!verified.ok) {
    if (verified.error === "wrong_wallet") {
      jsonError(res, 400, "wrong_wallet", undefined, { state: "pending" });
      return;
    }
    jsonError(
      res,
      verified.error === "join_context_mismatch" ? 403 : 401,
      verified.error,
      verified.message,
      { state: "pending" },
    );
    return;
  }

  const replaceId = (challenge.replace_node_id as string | null) ?? null;
  const capacity = await assertDeviceCapacityOrReplace(row.wallet_address, replaceId);
  if (!capacity.ok) {
    const nodes = await fetchCapNodesForWallet(row.wallet_address);
    jsonError(res, 409, "device_limit_reached", undefined, {
      state: "pending",
      nodes,
    });
    return;
  }

  const joinResult = await executePersonalNodeJoin({
    challenge: { ...row, id: challengeId },
    wallet: row.wallet_address,
    signature,
    userId: (challenge.user_id as string | null) ?? null,
    replaceNodeId: replaceId,
    req,
  });

  if (!joinResult.ok) {
    if (joinResult.error === "device_limit_reached") {
      const nodes = await fetchCapNodesForWallet(row.wallet_address);
      jsonError(res, 409, "device_limit_reached", undefined, { state: "pending", nodes });
      return;
    }
    jsonError(
      res,
      joinResult.statusCode ?? 500,
      joinResult.error,
      joinResult.message,
      { state: challengeState(row) },
    );
    return;
  }

  const now = new Date().toISOString();
  await admin
    .from("node_join_challenges")
    .update({
      browser_signed_at: now,
      browser_join_result: {
        join_request_id: joinResult.joinRequestId,
        node_id: joinResult.node.id,
        pending_token: joinResult.pendingToken,
        ...(joinResult.nodeCredential ? { node_credential: joinResult.nodeCredential } : {}),
      },
    })
    .eq("id", challengeId);

  const { data: refreshed } = await admin
    .from("node_join_challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  jsonSuccess(res, 200, {
    state: "signed",
    join_request_id: joinResult.joinRequestId,
    node_id: joinResult.node.id,
  });
}
