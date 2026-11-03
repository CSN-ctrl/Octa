import type { ApiRouteDefinition } from "./route-types";
import { handler as permitsConfirmLocation } from "./handlers/permits/_id/confirm-location";
import { handler as permitsReview } from "./handlers/permits/_id/review";
import { handler as permitsIndex } from "./handlers/permits/index";
import { handler as permitsMine } from "./handlers/permits/mine";

/** Patterns relative to `/api/permits/` (longest first). Empty pattern = `/api/permits`. */
export const PERMITS_API_ROUTE_DEFINITIONS: ApiRouteDefinition[] = [
  { pattern: ":id/confirm-location", handler: permitsConfirmLocation },
  { pattern: ":id/review", handler: permitsReview },
  { pattern: "mine", handler: permitsMine },
  { pattern: "", handler: permitsIndex },
];
