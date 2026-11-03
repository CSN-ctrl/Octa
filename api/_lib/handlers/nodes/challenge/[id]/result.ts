import type { ApiRequest, ApiResponse } from "../../../../types";
import { methodNotAllowed } from "../../../../http";
import { jsonError, jsonSuccess, noStore } from "../../../../node-http";
import { createServiceSupabaseClient } from "../../../../supabase-admin";
import { parseChallengePollHeader, verifySecretHash } from "../../../../node-credential";
import { challengeState, type BrowserChallengeRow } from "../../../../node-browser-challenge";
import { rateLimitBrowserChallengeRead } from "../../../../node-rate-limit";

function challengeIdFromReq(req: ApiRequest): string | null {
  const idParam = req.query?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  return id && typeof id === "string" ? id : null;
}

function pollHeader(req: ApiRequest): string | undefined {
  const raw = req.headers.authorization ?? req.headers.Authorization;
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);

  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const challengeId = challengeIdFromReq(req);
  if (!challengeId) {
    jsonError(res, 400, "bad_request", "challenge id is required in path");
    return;
  }

  const pollToken = parseChallengePollHeader(pollHeader(req));
  if (!pollToken) {
    jsonError(res, 401, "unauthorized", "Authorization: Poll <poll_secret> required");
    return;
  }

  if (!rateLimitBrowserChallengeRead(`${challengeId}:poll`)) {
    jsonError(res, 429, "rate_limited");
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

  if (!verifySecretHash(pollToken, challenge.poll_token_hash)) {
    jsonError(res, 401, "unauthorized");
    return;
  }

  const row = challenge as BrowserChallengeRow;
  const state = challengeState(row);

  if (state === "pending" || state === "expired") {
    jsonSuccess(res, 200, { state, ready: false });
    return;
  }

  if (row.poll_result_delivered_at) {
    jsonError(res, 409, "result_already_delivered", undefined, { state: "already_used" });
    return;
  }

  const result = row.browser_join_result;
  if (!result?.node_id || !result.join_request_id) {
    jsonError(res, 503, "join_incomplete");
    return;
  }

  const now = new Date().toISOString();
  await admin
    .from("node_join_challenges")
    .update({ poll_result_delivered_at: now })
    .eq("id", challengeId);

  const payload: Record<string, unknown> = {
    state: "signed",
    ready: true,
    join_request_id: result.join_request_id,
    node_id: result.node_id,
  };
  if (result.pending_token) {
    payload.pending_token = result.pending_token;
  }
  if ((result as { node_credential?: string }).node_credential) {
    payload.node_credential = (result as { node_credential?: string }).node_credential;
  }

  jsonSuccess(res, 200, payload);
}
