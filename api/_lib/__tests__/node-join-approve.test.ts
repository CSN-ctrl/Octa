import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NodeRow } from "../node-http";

const updates: { table: string; patch: Record<string, unknown> }[] = [];

vi.mock("../supabase-admin", () => ({
  createServiceSupabaseClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "jr-1",
              status: "pending",
              nodes: {
                id: "node-1",
                wallet_address: "0xabc",
                zerotier_node_id: null,
                status: "pending",
                zt_authorized_at: null,
                zt_authorize_pending: false,
              },
            },
          }),
          single: async () => ({
            data: {
              id: "node-1",
              wallet_address: "0xabc",
              zerotier_node_id: null,
              status: "approved",
              zt_authorized_at: null,
              zt_authorize_pending: false,
            },
          }),
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async () => {
          updates.push({ table, patch });
          return { error: null };
        },
      }),
    }),
  }),
}));

vi.mock("../node-events", () => ({
  appendNodeEvent: async () => {},
}));

import { approveJoinRequest } from "../node-join-flow";
import { resolveZeroTierPublicStatus } from "../node-zerotier-policy";
import { serializeNodePublic } from "../node-http";

describe("join approve without ZeroTier", () => {
  beforeEach(() => {
    updates.length = 0;
    delete process.env.ZEROTIER_ENABLED;
  });

  it("approves active node when ZEROTIER_ENABLED is false and no member id", async () => {
    const result = await approveJoinRequest("jr-1", "reviewer-uuid");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.node.status).toBe("approved");
      expect(result.node.zerotier_node_id).toBeNull();
    }
    const nodeApproved = updates.some((u) => u.table === "nodes" && u.patch.status === "approved");
    expect(nodeApproved).toBe(true);
    const publicShape = serializeNodePublic({
      id: "node-1",
      owner_user_id: null,
      wallet_address: "0xabc",
      zerotier_node_id: null,
      platform: "android",
      app_version: "1",
      status: "approved",
      reason: null,
      zt_authorized_at: null,
      replaced_by_node_id: null,
      credential_hash: null,
      pending_token_hash: null,
      pending_token_expires_at: null,
      pending_token_consumed_at: null,
      last_heartbeat_at: null,
      last_app_version: null,
      last_uptime_secs: null,
      last_peers: null,
      last_zerotier_online: null,
      last_chain_height: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as NodeRow);
    expect(publicShape.zerotier).toBe("disabled");
    expect(resolveZeroTierPublicStatus({ zerotier_node_id: null, zt_authorized_at: null, zt_authorize_pending: false, status: "approved" })).toBe(
      "disabled",
    );
  });
});
