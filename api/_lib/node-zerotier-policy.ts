import type { NodeRow } from "./node-http";

/** When false (default), join/approve never calls ZeroTier Central. */
export function zerotierEnabled(): boolean {
  return process.env.ZEROTIER_ENABLED?.trim().toLowerCase() === "true";
}

export function shouldUseZeroTierCentral(
  node: Pick<NodeRow, "zerotier_node_id"> | { zerotier_node_id?: string | null },
): boolean {
  return zerotierEnabled() && Boolean(node.zerotier_node_id);
}

export type ZeroTierPublicStatus = "disabled" | "pending_authorization" | "authorized";

export function resolveZeroTierPublicStatus(
  node: Pick<
    NodeRow,
    "zerotier_node_id" | "zt_authorized_at" | "zt_authorize_pending" | "status"
  >,
  joinRequestStatus?: string | null,
): ZeroTierPublicStatus {
  if (!shouldUseZeroTierCentral(node)) {
    return "disabled";
  }
  if (node.zt_authorized_at) {
    return "authorized";
  }
  if (
    node.zt_authorize_pending ||
    joinRequestStatus === "pending_authorization" ||
    (node.status === "pending" && !node.zt_authorized_at)
  ) {
    return "pending_authorization";
  }
  if (node.status === "approved" && !node.zt_authorized_at) {
    return "pending_authorization";
  }
  return "pending_authorization";
}
