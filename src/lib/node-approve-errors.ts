import type { CapNodeSummary } from "@/lib/node-approve-contract";
import { NodeApproveApiError } from "@/lib/node-approve-api";
import { NODE_APPROVE_COPY } from "@/lib/node-approve-copy";

export type NodeApproveTerminalPhase =
  | "terminal_expired"
  | "domain_block"
  | "link_invalid_for_site"
  | "temporarily_unavailable"
  | "wrong_wallet"
  | "device_limit"
  | "terminal_already_used";

export type ResolveNodeApproveApiErrorResult =
  | { kind: "phase"; phase: NodeApproveTerminalPhase; nodes?: CapNodeSummary[] }
  | { kind: "generic"; message: string };

/** Maps browser challenge API errors to UI phases per docs/personal-node-onboarding-api.md QA table. */
export function resolveNodeApproveApiError(err: NodeApproveApiError): ResolveNodeApproveApiErrorResult {
  if (err.code === "wrong_wallet") {
    return { kind: "phase", phase: "wrong_wallet" };
  }

  if (err.code === "device_limit_reached") {
    if (err.nodes?.length) {
      return { kind: "phase", phase: "device_limit", nodes: err.nodes };
    }
    return { kind: "generic", message: NODE_APPROVE_COPY.genericApiError };
  }

  if (err.code === "challenge_expired" || err.state === "expired") {
    return { kind: "phase", phase: "terminal_expired" };
  }

  if (err.code === "join_context_unconfigured") {
    return { kind: "phase", phase: "temporarily_unavailable" };
  }

  if (err.code === "join_context_mismatch") {
    return { kind: "phase", phase: "link_invalid_for_site" };
  }

  if (err.code === "domain_not_allowed") {
    // Host not allowlisted at challenge create (see docs + PR dev note).
    return { kind: "phase", phase: "domain_block" };
  }

  if (
    err.code === "challenge_consumed" ||
    err.code === "result_already_delivered" ||
    err.state === "already_used"
  ) {
    return { kind: "phase", phase: "terminal_already_used" };
  }

  const fallback =
    err.message && err.message !== err.code ? err.message : NODE_APPROVE_COPY.genericApiError;
  return { kind: "generic", message: fallback };
}

export function applyNodeApproveApiError(
  err: unknown,
  handlers: {
    onPhase: (phase: NodeApproveTerminalPhase, nodes?: CapNodeSummary[]) => void;
    onGeneric: (message: string) => void;
  },
): boolean {
  if (!(err instanceof NodeApproveApiError)) return false;
  const resolved = resolveNodeApproveApiError(err);
  if (resolved.kind === "phase") {
    handlers.onPhase(resolved.phase, resolved.nodes);
    return true;
  }
  handlers.onGeneric(resolved.message);
  return true;
}
