import type { ApiRequest, ApiResponse } from "./_lib/types";

function pathSegmentsFromRequest(
  req: ApiRequest,
  normalizePathSegments: (pathQuery: string | string[] | undefined) => string[],
): string[] {
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
  try {
    const { dispatchApiRoute, normalizePathSegments } = await import("./_lib/router");
    const segments = pathSegmentsFromRequest(req, normalizePathSegments);
    await dispatchApiRoute(segments, req, res);
  } catch (error) {
    console.error("api_router_fatal", error);
    res.status(500).json({
      error: "internal_error",
      message: error instanceof Error ? error.message : "API router failed",
    });
  }
}
