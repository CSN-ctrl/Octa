import type { ApiRouteDefinition } from "./route-types";
import { handler as nodesAppRelease } from "./handlers/nodes/app-release";
import { handler as nodesByWallet } from "./handlers/nodes/by-wallet";
import { handler as nodesChallengeIndex } from "./handlers/nodes/challenge/index";
import { handler as nodesChallengePublic } from "./handlers/nodes/challenge/_id/public";
import { handler as nodesChallengeReplace } from "./handlers/nodes/challenge/_id/replace";
import { handler as nodesChallengeResult } from "./handlers/nodes/challenge/_id/result";
import { handler as nodesChallengeSign } from "./handlers/nodes/challenge/_id/sign";
import { handler as nodesExchangeCredential } from "./handlers/nodes/_id/exchange-credential";
import { handler as nodesHeartbeat } from "./handlers/nodes/_id/heartbeat";
import { handler as nodesReinstate } from "./handlers/nodes/_id/reinstate";
import { handler as nodesRevoke } from "./handlers/nodes/_id/revoke";
import { handler as nodesRotateCredential } from "./handlers/nodes/_id/rotate-credential";
import { handler as nodesStatus } from "./handlers/nodes/_id/status";
import { handler as nodesSuspend } from "./handlers/nodes/_id/suspend";
import { handler as nodesInvites } from "./handlers/nodes/invites";
import { handler as nodesJoin } from "./handlers/nodes/join";
import { handler as nodesJoinReview } from "./handlers/nodes/join-requests/_id/review";
import { handler as nodesJoinQueue } from "./handlers/nodes/join-requests/queue";
import { handler as nodesMine } from "./handlers/nodes/mine";
import { handler as nodesZtRetry } from "./handlers/nodes/zt-retry";

/** Patterns relative to `/api/nodes/` (longest first). */
export const NODES_API_ROUTE_DEFINITIONS: ApiRouteDefinition[] = [
  { pattern: "challenge/:id/public", handler: nodesChallengePublic },
  { pattern: "challenge/:id/replace", handler: nodesChallengeReplace },
  { pattern: "challenge/:id/result", handler: nodesChallengeResult },
  { pattern: "challenge/:id/sign", handler: nodesChallengeSign },
  { pattern: "join-requests/:id/review", handler: nodesJoinReview },
  { pattern: ":id/exchange-credential", handler: nodesExchangeCredential },
  { pattern: ":id/heartbeat", handler: nodesHeartbeat },
  { pattern: ":id/reinstate", handler: nodesReinstate },
  { pattern: ":id/revoke", handler: nodesRevoke },
  { pattern: ":id/rotate-credential", handler: nodesRotateCredential },
  { pattern: ":id/status", handler: nodesStatus },
  { pattern: ":id/suspend", handler: nodesSuspend },
  { pattern: "app-release", handler: nodesAppRelease },
  { pattern: "by-wallet", handler: nodesByWallet },
  { pattern: "challenge", handler: nodesChallengeIndex },
  { pattern: "invites", handler: nodesInvites },
  { pattern: "join-requests/queue", handler: nodesJoinQueue },
  { pattern: "join", handler: nodesJoin },
  { pattern: "mine", handler: nodesMine },
  { pattern: "zt-retry", handler: nodesZtRetry },
];
