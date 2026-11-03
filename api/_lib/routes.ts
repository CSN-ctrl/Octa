import type { ApiRouteDefinition } from "./route-types";
import { MISC_API_ROUTE_DEFINITIONS } from "./routes-misc";
import { NODES_API_ROUTE_DEFINITIONS } from "./routes-nodes";
import { PERMITS_API_ROUTE_DEFINITIONS } from "./routes-permits";

export type { ApiRouteDefinition, ApiRouteHandler } from "./route-types";

function withPrefix(prefix: string, routes: ApiRouteDefinition[]): ApiRouteDefinition[] {
  return routes.map((route) => ({
    ...route,
    pattern: route.pattern === "" ? prefix : `${prefix}/${route.pattern}`,
  }));
}

/** Full table for tests and legacy path listing (not imported by serverless entrypoints). */
export const API_ROUTE_DEFINITIONS: ApiRouteDefinition[] = [
  ...withPrefix("nodes", NODES_API_ROUTE_DEFINITIONS),
  ...withPrefix("permits", PERMITS_API_ROUTE_DEFINITIONS),
  ...MISC_API_ROUTE_DEFINITIONS,
];

/** Public paths (with `/api/` prefix) previously implemented as standalone Vercel functions. */
export const LEGACY_API_PATHS: string[] = API_ROUTE_DEFINITIONS.map((r) =>
  r.pattern === "" ? "/api/permits" : `/api/${r.pattern}`,
);

export { MISC_API_ROUTE_DEFINITIONS } from "./routes-misc";
export { NODES_API_ROUTE_DEFINITIONS } from "./routes-nodes";
export { PERMITS_API_ROUTE_DEFINITIONS } from "./routes-permits";
