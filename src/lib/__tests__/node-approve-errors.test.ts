import { describe, expect, it } from "vitest";
import { NodeApproveApiError } from "@/lib/node-approve-api";
import { resolveNodeApproveApiError } from "@/lib/node-approve-errors";

describe("node-approve-errors", () => {
  it("maps challenge_expired to expired terminal", () => {
    expect(
      resolveNodeApproveApiError(new NodeApproveApiError(410, "challenge_expired", undefined, { state: "expired" })),
    ).toEqual({ kind: "phase", phase: "terminal_expired" });
  });

  it("maps domain_not_allowed to domain block", () => {
    expect(resolveNodeApproveApiError(new NodeApproveApiError(400, "domain_not_allowed"))).toEqual({
      kind: "phase",
      phase: "domain_block",
    });
  });

  it("maps join_context_mismatch to link-invalid screen", () => {
    expect(resolveNodeApproveApiError(new NodeApproveApiError(403, "join_context_mismatch"))).toEqual({
      kind: "phase",
      phase: "link_invalid_for_site",
    });
  });

  it("maps join_context_unconfigured to temporarily unavailable", () => {
    expect(resolveNodeApproveApiError(new NodeApproveApiError(503, "join_context_unconfigured"))).toEqual({
      kind: "phase",
      phase: "temporarily_unavailable",
    });
  });

  it("maps wrong_wallet and device_limit_reached", () => {
    expect(resolveNodeApproveApiError(new NodeApproveApiError(400, "wrong_wallet"))).toEqual({
      kind: "phase",
      phase: "wrong_wallet",
    });
    expect(
      resolveNodeApproveApiError(
        new NodeApproveApiError(409, "device_limit_reached", undefined, {
          nodes: [
            {
              id: "a",
              platform: "desktop",
              app_version: "1",
              last_seen_at: "",
              created_at: "",
              status: "approved",
              label: null,
            },
          ],
        }),
      ),
    ).toEqual({
      kind: "phase",
      phase: "device_limit",
      nodes: [
        {
          id: "a",
          platform: "desktop",
          app_version: "1",
          last_seen_at: "",
          created_at: "",
          status: "approved",
          label: null,
        },
      ],
    });
  });

  it("falls back to generic for unknown codes", () => {
    const resolved = resolveNodeApproveApiError(new NodeApproveApiError(429, "rate_limited", "Slow down"));
    expect(resolved.kind).toBe("generic");
    if (resolved.kind === "generic") expect(resolved.message).toBe("Slow down");
  });
});
