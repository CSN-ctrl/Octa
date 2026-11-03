import { createApiEntryHandler } from "./_lib/create-entry";
import { NODES_API_ROUTE_DEFINITIONS } from "./_lib/routes-nodes";

export default createApiEntryHandler(NODES_API_ROUTE_DEFINITIONS);
