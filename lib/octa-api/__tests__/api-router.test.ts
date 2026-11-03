import { describe, expect, it } from "vitest";
import { API_ROUTE_DEFINITIONS } from "../routes";
import { PERMITS_API_ROUTE_DEFINITIONS } from "../routes-permits";
import { matchApiRouteWithDefinitions, normalizePathSegments } from "../router";

function matchApiRoute(pathSegments: string[]) {
  return matchApiRouteWithDefinitions(pathSegments, API_ROUTE_DEFINITIONS);
}

const EXPECTED_ROUTES: { path: string; sampleId?: string }[] = [
  { path: "basic-residential/claim" },
  { path: "basic-residential/eligibility" },
  { path: "expat/availability" },
  { path: "nodes/app-release" },
  { path: "nodes/by-wallet" },
  { path: "nodes/challenge" },
  { path: "nodes/challenge/:id/public", sampleId: "00000000-0000-4000-8000-000000000001" },
  { path: "nodes/challenge/:id/replace", sampleId: "00000000-0000-4000-8000-000000000001" },
  { path: "nodes/challenge/:id/result", sampleId: "00000000-0000-4000-8000-000000000001" },
  { path: "nodes/challenge/:id/sign", sampleId: "00000000-0000-4000-8000-000000000001" },
  { path: "nodes/:id/exchange-credential", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/:id/heartbeat", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/:id/reinstate", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/:id/revoke", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/:id/rotate-credential", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/:id/status", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/:id/suspend", sampleId: "00000000-0000-4000-8000-000000000002" },
  { path: "nodes/invites" },
  { path: "nodes/join" },
  { path: "nodes/join-requests/queue" },
  { path: "nodes/join-requests/:id/review", sampleId: "00000000-0000-4000-8000-000000000003" },
  { path: "nodes/mine" },
  { path: "nodes/zt-retry" },
  { path: "permits" },
  { path: "permits/mine" },
  { path: "permits/:id/confirm-location", sampleId: "00000000-0000-4000-8000-000000000004" },
  { path: "permits/:id/review", sampleId: "00000000-0000-4000-8000-000000000004" },
];

function segmentsForPattern(pattern: string, sampleId: string): string[] {
  return pattern.split("/").map((part) => (part === ":id" ? sampleId : part));
}

describe("api catch-all router", () => {
  it("registers exactly the legacy standalone routes", () => {
    const patterns = API_ROUTE_DEFINITIONS.map((r) => r.pattern).sort();
    const expected = EXPECTED_ROUTES.map((r) => r.path).sort();
    expect(patterns).toEqual(expected);
  });

  it.each(EXPECTED_ROUTES)("dispatches $path to a handler", ({ path, sampleId }) => {
    const id = sampleId ?? "00000000-0000-4000-8000-000000000099";
    const segments = segmentsForPattern(path, id);
    const match = matchApiRoute(segments);
    expect(match, `no match for /api/${path}`).not.toBeNull();
    if (path.includes(":id")) {
      expect(match?.params.id).toBe(id);
    }
  });

  it("normalizes catch-all path query segments", () => {
    expect(normalizePathSegments(["nodes/join"])).toEqual(["nodes", "join"]);
    expect(normalizePathSegments(["nodes", "join"])).toEqual(["nodes", "join"]);
  });

  it("returns null for unknown paths", () => {
    expect(matchApiRoute(["nodes", "does-not-exist"])).toBeNull();
    expect(matchApiRoute(["nodes", "mine", "extra"])).toBeNull();
  });

  it("matches POST /api/permits root via empty relative pattern", () => {
    expect(matchApiRouteWithDefinitions([], PERMITS_API_ROUTE_DEFINITIONS)?.handler).toBeDefined();
  });

  it("does not let nodes/challenge/:id shadow nodes/challenge", () => {
    const challenge = matchApiRoute(["nodes", "challenge"]);
    const nested = matchApiRoute(["nodes", "challenge", "00000000-0000-4000-8000-000000000001", "public"]);
    expect(challenge?.handler).not.toBe(nested?.handler);
  });
});
