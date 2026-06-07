import { afterEach, describe, expect, it, vi } from "vitest";

describe("avax-network", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses public Fuji RPC in production instead of LAN default", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_CHAIN_ID", "43113");
    vi.stubEnv("VITE_AVALANCHE_RPC", "");
    vi.stubEnv("VITE_WALLET_RPC", "");
    vi.stubEnv("VITE_ALCHEMY_API_KEY", "");
    const { getWalletRpcUrl, getPaymentWalletRpcUrls } = await import("@/config/avax-network");
    const rpc = getWalletRpcUrl();
    expect(rpc).not.toContain("192.168.");
    expect(rpc).toContain("avax");
    const urls = getPaymentWalletRpcUrls();
    expect(urls.length).toBeGreaterThanOrEqual(1);
    expect(urls[0]).toBe(rpc);
  });

  it("rejects LAN RPC in production and falls back to Fuji", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_CHAIN_ID", "43113");
    vi.stubEnv("VITE_AVALANCHE_RPC", "http://192.168.88.62:9650/ext/bc/C/rpc");
    const { getAvaxRpcUrl } = await import("@/config/avax-network");
    expect(getAvaxRpcUrl()).not.toContain("192.168.");
  });
});
