import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { ApiRequest } from "../types";
import {
  approveUrlForChallenge,
  devJoinHostsAllowlist,
  isHostAllowlistedForJoin,
  matchPreviewHostPattern,
  requestHostHeader,
  resolveJoinBindingFromRequest,
} from "../node-join-host";

function reqWithHost(host: string): ApiRequest {
  return { headers: { host } };
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
    delete process.env.NODE_JOIN_PREVIEW_HOST_PATTERN;
    delete process.env.NODE_JOIN_DEV_HOSTS;
    delete process.env.NODE_JOIN_DOMAIN;
    delete process.env.NODE_JOIN_SITE_ORIGIN;
  });

  it("allows configured dev hosts", () => {
    expect(devJoinHostsAllowlist()).toContain("localhost:8080");
    expect(isHostAllowlistedForJoin("localhost:8080")).toBe(true);
    expect(isHostAllowlistedForJoin("evil.example.com")).toBe(false);
  });

  it("resolves binding from dev request host", () => {
    const resolved = resolveJoinBindingFromRequest(reqWithHost("localhost:8080"));
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.origin).toBe("http://localhost:8080");
      expect(resolved.binding.domain).toBe("http://localhost:8080");
    }
  });

  it("rejects disallowed dev host with domain_not_allowed", () => {
    const resolved = resolveJoinBindingFromRequest(reqWithHost("localhost:5173"));
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.error).toBe("domain_not_allowed");
    }
  });

  it("matches preview host pattern with single-label wildcard", () => {
    process.env.NODE_JOIN_PREVIEW_HOST_PATTERN = "octa-*-csn-ctrl.vercel.app";
    process.env.VERCEL_ENV = "preview";
    expect(matchPreviewHostPattern("octa-*-csn-ctrl.vercel.app", "octa-pr24-csn-ctrl.vercel.app")).toBe(true);
    expect(isHostAllowlistedForJoin("octa-pr24-csn-ctrl.vercel.app")).toBe(true);
    expect(isHostAllowlistedForJoin("octa-pr24-other.vercel.app")).toBe(false);
  });

  it("allows VERCEL_URL host on preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "octa-git-feature-csn-ctrl.vercel.app";
    expect(isHostAllowlistedForJoin("octa-git-feature-csn-ctrl.vercel.app")).toBe(true);
  });

  it("production requires exact NODE_JOIN_DOMAIN host", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NODE_JOIN_DOMAIN = "https://www.sarakt.com";
    process.env.NODE_JOIN_CHAIN_ID = "43113";
    process.env.NODE_JOIN_ENVIRONMENT = "production";
    const ok = resolveJoinBindingFromRequest(reqWithHost("www.sarakt.com"));
    expect(ok.ok).toBe(true);
    const bad = resolveJoinBindingFromRequest(reqWithHost("evil.vercel.app"));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("domain_not_allowed");
  });

  it("approve_url defaults to request origin", () => {
    expect(approveUrlForChallenge("http://localhost:8080", "uuid")).toBe(
      "http://localhost:8080/run-a-node/approve?challenge=uuid",
    );
  });

  it("uses host header on non-Vercel", () => {
    expect(requestHostHeader(reqWithHost("LocalHost:8080"))).toBe("localhost:8080");
  });
});
