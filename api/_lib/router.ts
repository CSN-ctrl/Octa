import type { ApiRequest, ApiResponse } from "./types";
import { API_ROUTE_DEFINITIONS, type ApiRouteDefinition, type ApiRouteHandler } from "./routes";

export type MatchedApiRoute = {
  handler: ApiRouteHandler;
  params: Record<string, string>;
};

function patternSegments(pattern: string): string[] {
  return pattern.split("/").filter(Boolean);
}

export function matchApiRoute(pathSegments: string[]): MatchedApiRoute | null {
  if (pathSegments.length === 0) {
    return null;
  }

  for (const route of API_ROUTE_DEFINITIONS) {
    const matched = matchPattern(route, pathSegments);
    if (matched) {
      return matched;
    }
  }

  return null;
}

function matchPattern(route: ApiRouteDefinition, pathSegments: string[]): MatchedApiRoute | null {
  const patternParts = patternSegments(route.pattern);
  if (patternParts.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i];
    const segment = pathSegments[i];
    if (part === ":id") {
      if (!segment) {
        return null;
      }
      params.id = segment;
      continue;
    }
    if (part !== segment) {
      return null;
    }
  }

  return { handler: route.handler, params };
}

export function normalizePathSegments(pathQuery: string | string[] | undefined): string[] {
  if (!pathQuery) {
    return [];
  }
  const raw = Array.isArray(pathQuery) ? pathQuery : [pathQuery];
  return raw.flatMap((chunk) => chunk.split("/")).filter(Boolean);
}

export function buildApiRequest(
  base: ApiRequest,
  pathSegments: string[],
  match: MatchedApiRoute,
): ApiRequest {
  const query: Record<string, string | string[]> = { ...(base.query ?? {}) };
  delete query.path;
  for (const [key, value] of Object.entries(match.params)) {
    query[key] = value;
  }
  return {
    ...base,
    query,
  };
}

export function notFound(res: ApiResponse): void {
  res.status(404).json({ error: "not_found" });
}

export async function dispatchApiRoute(
  pathSegments: string[],
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  const match = matchApiRoute(pathSegments);
  if (!match) {
    notFound(res);
    return;
  }
  const apiReq = buildApiRequest(req, pathSegments, match);
  await match.handler(apiReq, res);
}
