import { describe, expect, it } from "vitest";
import { joinProofErrorStatus } from "../node-join-http";

describe("node-join-http", () => {
  it("maps join context errors consistently", () => {
    expect(joinProofErrorStatus("join_context_mismatch")).toBe(403);
    expect(joinProofErrorStatus("join_context_unconfigured")).toBe(503);
    expect(joinProofErrorStatus("wrong_wallet")).toBe(400);
    expect(joinProofErrorStatus("invalid_signature")).toBe(401);
  });
});
