import { describe, expect, it, vi, afterEach } from "vitest";
import { authorizeZeroTierMember, deauthorizeZeroTierMember } from "../node-zerotier";

describe("node-zerotier", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("authorize is idempotent when member already authorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "GET") {
          return new Response(JSON.stringify({ config: { authorized: true } }), { status: 200 });
        }
        throw new Error(`unexpected fetch ${url}`);
      }),
    );

    const result = await authorizeZeroTierMember("a1b2c3d4e5", "octa-test", {
      apiToken: "zt-test",
      networkId: "net-test",
    });
    expect(result.ok).toBe(true);
  });

  it("deauthorize treats 404 as success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    const result = await deauthorizeZeroTierMember("a1b2c3d4e5", {
      apiToken: "zt-test",
      networkId: "net-test",
    });
    expect(result.ok).toBe(true);
  });
});
