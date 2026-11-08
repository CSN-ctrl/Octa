import type { ApiRequest, ApiResponse } from "../../types";
import { methodNotAllowed } from "../../http";
import { jsonError, jsonSuccess, serializeNodePublic } from "../../node-http";
import {
  fetchNodesForUser,
  resolveNodeOrPendingAuth,
  resolveSupabaseUser,
} from "../../node-auth";
import { nodeRouteOpportunisticZt, nodeRouteOpportunisticZtMany } from "../../node-route-zt";

export async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  const nodeAuth = await resolveNodeOrPendingAuth(req);
  if (nodeAuth?.kind === "node") {
    await nodeRouteOpportunisticZt(nodeAuth.node.id);
    jsonSuccess(res, 200, { nodes: [serializeNodePublic(nodeAuth.node)] });
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  if (supabaseUser) {
    const nodes = await fetchNodesForUser(supabaseUser.userId);
    await nodeRouteOpportunisticZtMany(nodes.map((n) => n.id));
    jsonSuccess(res, 200, { nodes: nodes.map(serializeNodePublic) });
    return;
  }

  jsonError(
    res,
    401,
    "unauthorized",
    "Provide Authorization: Node <credential> or Bearer <supabase_access_token>",
  );
}
