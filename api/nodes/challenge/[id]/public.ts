import type { ApiRequest, ApiResponse } from "../../../_lib/types";
import { methodNotAllowed } from "../../../_lib/http";
import { jsonError, jsonSuccess, noStore } from "../../../_lib/node-http";
import { createServiceSupabaseClient } from "../../../_lib/supabase-admin";
import {
  challengeState,
  serializeChallengePublicPayload,
  type BrowserChallengeRow,
} from "../../../_lib/node-browser-challenge";
import { rateLimitBrowserChallengeRead } from "../../../_lib/node-rate-limit";

function challengeIdFromReq(req: ApiRequest): string | null {
  const idParam = req.query?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  return id && typeof id === "string" ? id : null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
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

  if (!rateLimitBrowserChallengeRead(challengeId)) {
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

  const { data, error } = await admin
    .from("node_join_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !data) {
    jsonError(res, 404, "challenge_not_found");
    return;
  }

  if (data.signing_mode !== "browser") {
    jsonError(res, 404, "challenge_not_found");
    return;
  }

  const row = data as BrowserChallengeRow;
  jsonSuccess(res, 200, serializeChallengePublicPayload(row));
}
