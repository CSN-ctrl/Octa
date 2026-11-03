import type { ApiRequest, ApiResponse } from "./_lib/types";
import { dispatchApiRoute, normalizePathSegments } from "./_lib/router";

function pathSegmentsFromRequest(req: ApiRequest): string[] {
  const fromQuery = normalizePathSegments(req.query?.path as string | string[] | undefined);
  if (fromQuery.length > 0) {
    return fromQuery;
  }

  const rawUrl = (req as ApiRequest & { url?: string }).url;
  if (typeof rawUrl === "string" && rawUrl.length > 0) {
    const pathname = rawUrl.split("?")[0] ?? rawUrl;
    const prefix = "/api/";
    const idx = pathname.indexOf(prefix);
    if (idx !== -1) {
      const rest = pathname.slice(idx + prefix.length);
      return normalizePathSegments(rest);
    }
  }

  return [];
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const segments = pathSegmentsFromRequest(req);
  await dispatchApiRoute(segments, req, res);
}
