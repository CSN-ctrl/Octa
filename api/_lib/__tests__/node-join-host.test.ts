import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { ApiRequest } from "../types";
import {
  approveUrlForChallenge,
  devJoinHostsAllowlist,
  isHostAllowlistedForJoin,
  matchPreviewProjectHashHost,
  requestHostHeader,
  resolveJoinBindingFromRequest,
} from "../node-join-host";

function reqWithHost(host: string, extra: Record<string, string> = {}): ApiRequest {
  return { headers: { host, ...extra } };
}

describe("node-join-host", () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  beforeEach(() => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.NODE_JOIN_PREVIEW_PROJECT_SLUG;
    delete process.env.NODE_JOIN_PREVIEW_TEAM_SLUG;
    delete process.env.NODE_JOIN_DEV_HOSTS;
    delete process.env.NODE_JOIN_DOMAIN;
    delete process.env.NODE_JOIN_SITE_ORIGIN;
    delete process.env.NODE_JOIN_ENVIRONMENT;
    process.env.NODE_JOIN_ENVIRONMENT = "development";
  });

  it("allows configured dev hosts only when environment is development", () => {
    expect(devJoinHostsAllowlist()).toContain("localhost:8080");
    expect(isHostAllowlistedForJoin("localhost:8080")).toBe(true);
    expect(isHostAllowlistedForJoin("evil.example.com")).toBe(false);
  });

  it("fail closed when NODE_JOIN_ENVIRONMENT and VERCEL_ENV are unset", () => {
    delete process.env.NODE_JOIN_ENVIRONMENT;
    expect(isHostAllowlistedForJoin("localhost:8080")).toBe(false);
    const resolved = resolveJoinBindingFromRequest(reqWithHost("localhost:8080"));
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) expect(resolved.error).toBe("join_context_unconfigured");
  });

  it("resolves binding from dev request host", () => {
    const resolved = resolveJoinBindingFromRequest(reqWithHost("localhost:8080"));
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.origin).toBe("http://localhost:8080");
    }
  });

  it("rejects disallowed dev host with domain_not_allowed", () => {
    const resolved = resolveJoinBindingFromRequest(reqWithHost("localhost:5173"));
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.error).toBe("domain_not_allowed");
    }
  });

  it("preview hash segment is alphanumeric only", () => {
    process.env.NODE_JOIN_ENVIRONMENT = "staging";
    process.env.VERCEL_ENV = "preview";
    process.env.NODE_JOIN_PREVIEW_PROJECT_SLUG = "octa";
    process.env.NODE_JOIN_PREVIEW_TEAM_SLUG = "csn-ctrl";
    expect(matchPreviewProjectHashHost("octa-pr24-csn-ctrl.vercel.app")).toBe(true);
    expect(matchPreviewProjectHashHost("octa-ab12-csn-ctrl.vercel.app")).toBe(true);
    expect(isHostAllowlistedForJoin("octa-x-attacker-csn-ctrl.vercel.app")).toBe(false);
  });

  it("allows exact VERCEL_URL host on preview (hyphens in branch slug)", () => {
    process.env.NODE_JOIN_ENVIRONMENT = "staging";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "octa-git-feature-csn-ctrl.vercel.app";
    expect(isHostAllowlistedForJoin("octa-git-feature-csn-ctrl.vercel.app")).toBe(true);
  });

  it("production requires exact NODE_JOIN_DOMAIN host", () => {
    process.env.NODE_JOIN_ENVIRONMENT = "production";
    process.env.VERCEL_ENV = "production";
    process.env.NODE_JOIN_DOMAIN = "https://www.sarakt.com";
    process.env.NODE_JOIN_CHAIN_ID = "43113";
    const ok = resolveJoinBindingFromRequest(reqWithHost("www.sarakt.com"));
    expect(ok.ok).toBe(true);
    const bad = resolveJoinBindingFromRequest(reqWithHost("evil.vercel.app"));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("domain_not_allowed");
  });

  it("ignores spoofed X-Forwarded-Host when not on real Vercel", () => {
    process.env.NODE_JOIN_ENVIRONMENT = "development";
    process.env.VERCEL_ENV = "preview";
    const host = requestHostHeader(
      reqWithHost("localhost:8080", { "x-forwarded-host": "evil.vercel.app" }),
    );
    expect(host).toBe("localhost:8080");
    expect(isHostAllowlistedForJoin("evil.vercel.app")).toBe(false);
  });

  it("uses x-vercel-forwarded-host only with VERCEL=1 and x-vercel-id", () => {
    process.env.VERCEL = "1";
    process.env.NODE_JOIN_ENVIRONMENT = "staging";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "octa-ab12-csn-ctrl.vercel.app";
    process.env.NODE_JOIN_PREVIEW_PROJECT_SLUG = "octa";
    process.env.NODE_JOIN_PREVIEW_TEAM_SLUG = "csn-ctrl";
    const host = requestHostHeader(
      reqWithHost("ignored.internal", {
        "x-vercel-id": "iad1::abc",
        "x-vercel-forwarded-host": "octa-ab12-csn-ctrl.vercel.app",
      }),
    );
    expect(host).toBe("octa-ab12-csn-ctrl.vercel.app");
  });

  it("approve_url defaults to request origin", () => {
    expect(approveUrlForChallenge("http://localhost:8080", "uuid")).toBe(
      "http://localhost:8080/run-a-node/approve?challenge=uuid",
    );
  });
});
