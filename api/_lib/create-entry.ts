import type { ApiRequest, ApiResponse } from "./types";
import type { ApiRouteDefinition } from "./route-types";
import {
  buildApiRequest,
  matchApiRouteWithDefinitions,
  normalizePathSegments,
  notFound,
} from "./router";

export function createApiEntryHandler(definitions: ApiRouteDefinition[]) {
  return async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const safeReq: ApiRequest = {
        ...req,
        headers: req.headers ?? {},
        query: req.query ?? {},
      };
      const segments = normalizePathSegments(safeReq.query?.path as string | string[] | undefined);
      const match = matchApiRouteWithDefinitions(segments, definitions);
      if (!match) {
        notFound(res);
        return;
      }
      const apiReq = buildApiRequest(safeReq, segments, match);
      await match.handler(apiReq, res);
    } catch (error) {
      console.error("api_router_fatal", error);
      res.status(500).json({
        error: "internal_error",
        message: error instanceof Error ? error.message : "API router failed",
      });
    }
  };
}
