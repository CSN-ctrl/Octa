import { describe, expect, it } from "vitest";
import { hashSecret, verifySecretHash } from "../node-credential";

describe("node-credential", () => {
  it("hashes and verifies secrets", () => {
    const token = "octa_node_deadbeef";
    const hash = hashSecret(token);
    expect(verifySecretHash(token, hash)).toBe(true);
    expect(verifySecretHash("octa_node_wrong", hash)).toBe(false);
  });
});
