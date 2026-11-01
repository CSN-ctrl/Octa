import { createServiceSupabaseClient } from "./supabase-admin";

export const NODE_EVENT_TYPES = [
  "joined",
  "approved",
  "rejected",
  "zt_authorized",
  "zt_auth_failed",
  "zt_deauthorized",
  "zt_deauth_failed",
  "credential_issued",
  "credential_rotated",
  "revoked",
  "replaced",
  "heartbeat_rejected",
] as const;

export type NodeEventType = (typeof NODE_EVENT_TYPES)[number];

export async function appendNodeEvent(
  nodeId: string,
  eventType: NodeEventType,
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    const admin = createServiceSupabaseClient();
    await admin.from("node_events").insert({
      node_id: nodeId,
      event_type: eventType,
      detail,
    });
  } catch {
    // Audit must not break primary flow; logs are best-effort server-side.
  }
}
