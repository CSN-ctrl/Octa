import { describe, expect, it } from "vitest";
import { normalizeAppVersion, appVersionValidationDescription } from "../node-app-version";

describe("node-app-version", () => {
  it("accepts semver-ish values without trimming", () => {
    expect(normalizeAppVersion("1.2.3-beta+build")).toEqual({ ok: true, value: "1.2.3-beta+build" });
  });

  it("rejects leading or trailing whitespace", () => {
    expect(normalizeAppVersion(" 1.0.0").ok).toBe(false);
    expect(normalizeAppVersion("1.0.0 ").ok).toBe(false);
  });

  it("rejects control characters", () => {
    expect(normalizeAppVersion("1.0.0\n").ok).toBe(false);
  });

  it("rejects missing or invalid", () => {
    expect(normalizeAppVersion(undefined).ok).toBe(false);
    expect(normalizeAppVersion("").ok).toBe(false);
    expect(normalizeAppVersion("a".repeat(65)).ok).toBe(false);
    expect(normalizeAppVersion("bad space").ok).toBe(false);
  });

  it("documents validation rule", () => {
    expect(appVersionValidationDescription()).toContain("not trimmed");
  });
});
