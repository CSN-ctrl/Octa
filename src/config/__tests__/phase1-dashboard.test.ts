import { afterEach, describe, expect, it, vi } from "vitest";

describe("isPhase1DashboardOnly", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("defaults to true in production when unset", async () => {
    vi.stubEnv("PROD", "true");
    vi.stubEnv("VITE_PHASE1_DASHBOARD_ONLY", "");
    const { isPhase1DashboardOnly } = await import("@/config/phase1-dashboard");
    expect(isPhase1DashboardOnly()).toBe(true);
  });

  it("can be disabled explicitly", async () => {
    vi.stubEnv("VITE_PHASE1_DASHBOARD_ONLY", "false");
    const { isPhase1DashboardOnly } = await import("@/config/phase1-dashboard");
    expect(isPhase1DashboardOnly()).toBe(false);
  });
});
