import type { ApiRequest, ApiResponse } from "../../types";
import { methodNotAllowed } from "../../http";
import { jsonError, jsonSuccess } from "../../node-http";

export async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const version = process.env.NODE_APP_RELEASE_VERSION?.trim() ?? "";
  const url = process.env.NODE_APP_RELEASE_URL?.trim() ?? "";
  const sha256 = process.env.NODE_APP_RELEASE_SHA256?.trim() ?? "";
  const minSupported = process.env.NODE_APP_MIN_SUPPORTED_VERSION?.trim() ?? "";

  if (!version || !url) {
    jsonError(res, 503, "not_configured", "NODE_APP_RELEASE_VERSION and NODE_APP_RELEASE_URL must be set");
    return;
  }

  jsonSuccess(res, 200, {
    version,
    url,
    sha256: sha256 || null,
    min_supported_version: minSupported || null,
  });
}
