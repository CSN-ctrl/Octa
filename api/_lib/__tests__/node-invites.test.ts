import { describe, expect, it } from "vitest";
import { generateInviteCode, hashInviteCode, normalizeInviteCode } from "../node-invites";

describe("node-invites", () => {
  it("hashes normalized invite codes deterministically", () => {
    const a = hashInviteCode("  OCTA_test  ");
    const b = hashInviteCode(normalizeInviteCode("OCTA_test"));
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("generates opaque invite codes", () => {
    const code = generateInviteCode();
    expect(code.startsWith("octa_")).toBe(true);
    expect(code.length).toBeGreaterThan(12);
  });
});
