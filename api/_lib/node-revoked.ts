import type { NodeRow } from "./node-http";

export function nodeRevokedResponseExtra(node: Pick<NodeRow, "reason" | "replaced_by_node_id">) {
  return {
    reason: node.reason ?? null,
    replaced_by_node_id: (node as NodeRow).replaced_by_node_id ?? null,
  };
}

export function respondNodeRevoked(
  jsonError: (
    res: import("./types").ApiResponse,
    code: number,
    error: string,
    message?: string,
    extra?: Record<string, unknown>,
  ) => void,
  res: import("./types").ApiResponse,
  node: NodeRow,
): void {
  jsonError(res, 401, "node_revoked", "Node access revoked", nodeRevokedResponseExtra(node));
}
