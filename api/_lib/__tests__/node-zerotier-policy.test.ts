import { describe, expect, it } from "vitest";
import { buildSiweMessage } from "../node-siwe";
import { resolveZeroTierPublicStatus, shouldUseZeroTierCentral, zerotierEnabled } from "../node-zerotier-policy";

describe("node-zerotier-policy", () => {
  it("defaults ZEROTIER_ENABLED to false", () => {
    delete process.env.ZEROTIER_ENABLED;
    expect(zerotierEnabled()).toBe(false);
    expect(shouldUseZeroTierCentral({ zerotier_node_id: "a1b2c3d4e5" })).toBe(false);
  });

  it("reports disabled status without central when off", () => {
    delete process.env.ZEROTIER_ENABLED;
    expect(
      resolveZeroTierPublicStatus({
        zerotier_node_id: null,
        zt_authorized_at: null,
        zt_authorize_pending: false,
        status: "approved",
      }),
    ).toBe("disabled");
  });

  it("omits urn:zerotier when no member id on challenge", () => {
    const msg = buildSiweMessage({
      purpose: "join",
      walletAddress: "0x9ef900738ea2d80bf4d2813f4663391f0382ab52",
      zerotierNodeId: null,
      platform: "android",
      nonce: "0123456789abcdef0123456789abcdef",
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 300_000).toISOString(),
      joinDomain: "https://www.sarakt.com",
      chainId: "43113",
      environment: "dev",
    });
    expect(msg.resources?.some((r) => r.startsWith("urn:zerotier:"))).toBe(false);
    expect(msg.resources?.some((r) => r.startsWith("urn:octa:"))).toBe(true);
  });
});
