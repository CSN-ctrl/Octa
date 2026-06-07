import { afterEach, describe, expect, it, vi } from "vitest";

describe("env chain ID defaults", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("getChainId defaults to Fuji 43113 when VITE_CHAIN_ID is unset", async () => {
    vi.stubEnv("VITE_CHAIN_ID", "");
    const { getChainId } = await import("@/env");
    expect(getChainId()).toBe(43113);
  });

  it("getNetworkName defaults to Avalanche Fuji C-Chain", async () => {
    vi.stubEnv("VITE_NETWORK_NAME", "");
    const { getNetworkName } = await import("@/env");
    expect(getNetworkName()).toBe("Avalanche Fuji C-Chain");
  });
});
