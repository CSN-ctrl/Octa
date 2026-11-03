import type { ApiRequest, ApiResponse } from "./types";
import { handler as basicResidentialClaim } from "./handlers/basic-residential/claim";
import { handler as basicResidentialEligibility } from "./handlers/basic-residential/eligibility";
import { handler as expatAvailability } from "./handlers/expat/availability";
import { handler as nodesAppRelease } from "./handlers/nodes/app-release";
import { handler as nodesByWallet } from "./handlers/nodes/by-wallet";
import { handler as nodesChallengeIndex } from "./handlers/nodes/challenge/index";
import { handler as nodesChallengePublic } from "./handlers/nodes/challenge/[id]/public";
import { handler as nodesChallengeReplace } from "./handlers/nodes/challenge/[id]/replace";
import { handler as nodesChallengeResult } from "./handlers/nodes/challenge/[id]/result";
import { handler as nodesChallengeSign } from "./handlers/nodes/challenge/[id]/sign";
import { handler as nodesExchangeCredential } from "./handlers/nodes/[id]/exchange-credential";
import { handler as nodesHeartbeat } from "./handlers/nodes/[id]/heartbeat";
import { handler as nodesReinstate } from "./handlers/nodes/[id]/reinstate";
import { handler as nodesRevoke } from "./handlers/nodes/[id]/revoke";
import { handler as nodesRotateCredential } from "./handlers/nodes/[id]/rotate-credential";
import { handler as nodesStatus } from "./handlers/nodes/[id]/status";
import { handler as nodesSuspend } from "./handlers/nodes/[id]/suspend";
import { handler as nodesInvites } from "./handlers/nodes/invites";
import { handler as nodesJoin } from "./handlers/nodes/join";
import { handler as nodesJoinReview } from "./handlers/nodes/join-requests/[id]/review";
import { handler as nodesJoinQueue } from "./handlers/nodes/join-requests/queue";
import { handler as nodesMine } from "./handlers/nodes/mine";
import { handler as nodesZtRetry } from "./handlers/nodes/zt-retry";
import { handler as permitsConfirmLocation } from "./handlers/permits/[id]/confirm-location";
import { handler as permitsReview } from "./handlers/permits/[id]/review";
import { handler as permitsIndex } from "./handlers/permits/index";
import { handler as permitsMine } from "./handlers/permits/mine";

export type ApiRouteHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export type ApiRouteDefinition = {
  /** Path under `/api/` (no leading slash). Use `:id` for a dynamic segment stored in `req.query.id`. */
  pattern: string;
  handler: ApiRouteHandler;
};

/** Longest patterns first so static paths win over dynamic prefixes. */
export const API_ROUTE_DEFINITIONS: ApiRouteDefinition[] = [
  { pattern: "nodes/challenge/:id/public", handler: nodesChallengePublic },
  { pattern: "nodes/challenge/:id/replace", handler: nodesChallengeReplace },
  { pattern: "nodes/challenge/:id/result", handler: nodesChallengeResult },
  { pattern: "nodes/challenge/:id/sign", handler: nodesChallengeSign },
  { pattern: "nodes/join-requests/:id/review", handler: nodesJoinReview },
  { pattern: "nodes/:id/exchange-credential", handler: nodesExchangeCredential },
  { pattern: "nodes/:id/heartbeat", handler: nodesHeartbeat },
  { pattern: "nodes/:id/reinstate", handler: nodesReinstate },
  { pattern: "nodes/:id/revoke", handler: nodesRevoke },
  { pattern: "nodes/:id/rotate-credential", handler: nodesRotateCredential },
  { pattern: "nodes/:id/status", handler: nodesStatus },
  { pattern: "nodes/:id/suspend", handler: nodesSuspend },
  { pattern: "permits/:id/confirm-location", handler: permitsConfirmLocation },
  { pattern: "permits/:id/review", handler: permitsReview },
  { pattern: "basic-residential/claim", handler: basicResidentialClaim },
  { pattern: "basic-residential/eligibility", handler: basicResidentialEligibility },
  { pattern: "expat/availability", handler: expatAvailability },
  { pattern: "nodes/app-release", handler: nodesAppRelease },
  { pattern: "nodes/by-wallet", handler: nodesByWallet },
  { pattern: "nodes/challenge", handler: nodesChallengeIndex },
  { pattern: "nodes/invites", handler: nodesInvites },
  { pattern: "nodes/join-requests/queue", handler: nodesJoinQueue },
  { pattern: "nodes/join", handler: nodesJoin },
  { pattern: "nodes/mine", handler: nodesMine },
  { pattern: "nodes/zt-retry", handler: nodesZtRetry },
  { pattern: "permits/mine", handler: permitsMine },
  { pattern: "permits", handler: permitsIndex },
];

/** Public paths (with `/api/` prefix) previously implemented as standalone Vercel functions. */
export const LEGACY_API_PATHS: string[] = API_ROUTE_DEFINITIONS.map((r) => `/api/${r.pattern}`);
