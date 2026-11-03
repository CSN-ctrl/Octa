import { createApiEntryHandler } from "../lib/octa-api/create-entry";
import { NODES_API_ROUTE_DEFINITIONS } from "../lib/octa-api/routes";

export default createApiEntryHandler(NODES_API_ROUTE_DEFINITIONS);
