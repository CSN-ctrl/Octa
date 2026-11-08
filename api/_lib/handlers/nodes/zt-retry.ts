import type { ApiRequest, ApiResponse } from "../../types";
import { methodNotAllowed, requireBearerToken, unauthorized } from "../../http";
import { jsonError, jsonSuccess } from "../../node-http";
import { isNetworkGovernanceReviewer, resolveSupabaseUser } from "../../node-auth";
import { isZeroTierRetryAuthorized, retryAllPendingZeroTier } from "../../node-zt-pending";
import { zerotierEnabled } from "../../node-zerotier-policy";

export async function handler(req: ApiRequest, res: ApiResponse) {
  const cronAuth = isZeroTierRetryAuthorized(req);
  const allowedMethods = cronAuth.cron ? ["GET", "POST"] : ["POST"];
  if (!req.method || !allowedMethods.includes(req.method)) {
    methodNotAllowed(res, allowedMethods);
    return;
  }

  if (!cronAuth.cron) {
    const token = requireBearerToken(req);
    if (!token) {
      unauthorized(res);
      return;
    }
    const supabaseUser = await resolveSupabaseUser(req);
    if (!supabaseUser) {
      jsonError(res, 401, "unauthorized");
      return;
    }
    const reviewer = await isNetworkGovernanceReviewer(supabaseUser.accessToken);
    if (!reviewer) {
      jsonError(res, 403, "forbidden");
      return;
    }
  }

  const force = req.query?.force === "true" || req.query?.force === "1";
  if (!zerotierEnabled()) {
    jsonSuccess(res, 200, {
      retry: {
        deauth_attempted: 0,
        deauth_succeeded: 0,
        authorize_attempted: 0,
        authorize_succeeded: 0,
        zerotier_enabled: false,
      },
    });
    return;
  }
  const summary = await retryAllPendingZeroTier({ force });
  jsonSuccess(res, 200, { retry: summary });
}
