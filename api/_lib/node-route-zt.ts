import { runOpportunisticZeroTierRetries } from "./node-zt-pending";

/** Best-effort ZT retry when a node touches any /api/nodes route (does not block on backoff). */
export async function nodeRouteOpportunisticZt(
  nodeId?: string | null,
  joinRequestId?: string | null,
): Promise<void> {
  if (!nodeId) return;
  await runOpportunisticZeroTierRetries({ nodeId, joinRequestId });
}

export async function nodeRouteOpportunisticZtMany(nodeIds: string[]): Promise<void> {
  for (const id of nodeIds) {
    await runOpportunisticZeroTierRetries({ nodeId: id });
  }
}
