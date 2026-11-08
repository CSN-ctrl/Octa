import type { ApiRouteDefinition } from "./route-types";
import { handler as basicResidentialClaim } from "./handlers/basic-residential/claim";
import { handler as basicResidentialEligibility } from "./handlers/basic-residential/eligibility";
import { handler as expatAvailability } from "./handlers/expat/availability";

/** Patterns relative to `/api/` for misc routes (rewrite sets `path=` query). */
export const MISC_API_ROUTE_DEFINITIONS: ApiRouteDefinition[] = [
  { pattern: "basic-residential/claim", handler: basicResidentialClaim },
  { pattern: "basic-residential/eligibility", handler: basicResidentialEligibility },
  { pattern: "expat/availability", handler: expatAvailability },
];
