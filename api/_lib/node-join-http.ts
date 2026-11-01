import { assertJoinContextConfigured } from "./node-join-context";
import type { ApiResponse } from "./types";

/** HTTP status for wallet proof / join-context errors on /join, /sign, /replace, /by-wallet. */
export function joinProofErrorStatus(error: string): number {
  if (error === "join_context_mismatch") return 403;
  if (error === "join_context_unconfigured") return 503;
  if (error === "wrong_wallet") return 400;
  return 401;
}

export function respondIfJoinContextUnconfigured(
  jsonError: (res: ApiResponse, code: number, error: string, message?: string) => void,
  res: ApiResponse,
): boolean {
  const check = assertJoinContextConfigured();
  if (!check.ok) {
    jsonError(res, 503, "join_context_unconfigured", check.message);
    return true;
  }
  return false;
}
