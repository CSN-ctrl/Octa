import { createApiEntryHandler } from "./_lib/create-entry";
import { PERMITS_API_ROUTE_DEFINITIONS } from "./_lib/routes-permits";

export default createApiEntryHandler(PERMITS_API_ROUTE_DEFINITIONS);
