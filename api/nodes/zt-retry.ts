import type { ApiRequest, ApiResponse } from "../_lib/types";
import { methodNotAllowed, requireBearerToken, unauthorized } from "../_lib/http";
import { jsonError, jsonSuccess } from "../_lib/node-http";
import { isNetworkGovernanceReviewer, resolveSupabaseUser } from "../_lib/node-auth";
import { isZeroTierRetryAuthorized, retryAllPendingZeroTier } from "../_lib/node-zt-pending";
import { zerotierEnabled } from "../_lib/node-zerotier-policy";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const cronAuth = isZeroTierRetryAuthorized(req);
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
