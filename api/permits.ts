import { createApiEntryHandler } from "../lib/octa-api/create-entry";
import { PERMITS_API_ROUTE_DEFINITIONS } from "../lib/octa-api/routes-permits";

export default createApiEntryHandler(PERMITS_API_ROUTE_DEFINITIONS);
