import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { NodeRow } from "../node-http";

const nodeStore: Record<string, NodeRow & Record<string, unknown>> = {};
const events: { nodeId: string; type: string; detail: Record<string, unknown> }[] = [];

vi.mock("../supabase-admin", () => ({
  createServiceSupabaseClient: () => ({
    from: (table: string) => {
      if (table !== "nodes") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
              single: async () => ({ data: null }),
            }),
          }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      return {
        select: () => ({
          eq: (_col: string, id: string) => ({
            maybeSingle: async () => ({ data: nodeStore[id] ?? null }),
            single: async () => ({ data: nodeStore[id] ?? null }),
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => {
            nodeStore[id] = { ...nodeStore[id], ...patch };
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
  }),
}));

vi.mock("../node-events", () => ({
  appendNodeEvent: async (nodeId: string, event_type: string, detail: Record<string, unknown>) => {
    events.push({ nodeId, type: event_type, detail });
  },
}));

import {
  markZeroTierDeauthPending,
  requestZeroTierDeauthForNode,
  retryZeroTierDeauthIfDue,
} from "../node-zt-pending";

describe("node-zt-pending deauth retry", () => {
  beforeEach(() => {
    Object.keys(nodeStore).forEach((k) => delete nodeStore[k]);
    events.length = 0;
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks pending on Central failure then succeeds on retry", async () => {
    const nodeId = "11111111-1111-1111-1111-111111111111";
    nodeStore[nodeId] = {
      id: nodeId,
      owner_user_id: null,
      wallet_address: "0xabc",
      zerotier_node_id: "a1b2c3d4e5",
      platform: "android",
      app_version: "1",
      status: "revoked",
      reason: "replaced_by_new_device",
      zt_authorized_at: new Date().toISOString(),
      replaced_by_node_id: null,
      zt_deauth_pending: false,
      zt_deauth_attempts: 0,
      zt_deauth_next_attempt_at: null,
      zt_deauth_last_error: null,
      credential_hash: "hash",
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
    };

    let calls = 0;
    process.env.ZEROTIER_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response("upstream error", { status: 503 });
        }
        return new Response(JSON.stringify({ authorized: false }), { status: 200 });
      }),
    );

    const first = await requestZeroTierDeauthForNode(nodeStore[nodeId] as NodeRow, {
      apiToken: "t",
      networkId: "n",
    });
    expect(first.ok).toBe(false);
    expect(nodeStore[nodeId].zt_deauth_pending).toBe(true);
    expect(events.some((e) => e.type === "zt_deauth_failed")).toBe(true);

    nodeStore[nodeId].zt_deauth_next_attempt_at = new Date(Date.now() - 1000).toISOString();

    process.env.ZEROTIER_API_TOKEN = "t";
    process.env.ZEROTIER_NETWORK_ID = "n";

    const retry = await retryZeroTierDeauthIfDue(nodeId, { force: true });
    expect(retry.attempted).toBe(true);
    expect(retry.ok).toBe(true);
    expect(nodeStore[nodeId].zt_deauth_pending).toBe(false);
    expect(nodeStore[nodeId].zt_authorized_at).toBeNull();
    expect(events.some((e) => e.type === "zt_deauthorized")).toBe(true);
  });

  it("computes backoff via markZeroTierDeauthPending", async () => {
    const nodeId = "22222222-2222-2222-2222-222222222222";
    nodeStore[nodeId] = {
      id: nodeId,
      zt_deauth_attempts: 1,
    } as NodeRow;
    await markZeroTierDeauthPending(nodeId, "err");
    expect(nodeStore[nodeId].zt_deauth_attempts).toBe(2);
    expect(nodeStore[nodeId].zt_deauth_next_attempt_at).toBeTruthy();
  });
});
