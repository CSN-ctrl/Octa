import { afterEach, describe, expect, it, vi } from "vitest";

describe("blockchain-profile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to Fuji 43113 in production when VITE_CHAIN_ID is unset", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_CHAIN_ID", "");
    const { getPaymentChainId, getPaymentRailProfile, getDepositNetworkId } = await import(
      "@/config/blockchain-profile"
    );
    expect(getPaymentChainId()).toBe(43113);
    expect(getPaymentRailProfile()).toBe("fuji-43113");
    expect(getDepositNetworkId()).toBe("avalanche-fuji");
  });

  it("returns Snowtrace explorer URL on Fuji", async () => {
    vi.stubEnv("VITE_CHAIN_ID", "43113");
    const { getPaymentBlockExplorerUrl } = await import("@/config/blockchain-profile");
    expect(getPaymentBlockExplorerUrl()).toBe("https://testnet.snowtrace.io");
  });

  it("defaults to local 1337 in development when VITE_CHAIN_ID is unset", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_CHAIN_ID", "");
    const { getPaymentChainId } = await import("@/config/blockchain-profile");
    expect(getPaymentChainId()).toBe(1337);
  });
});
