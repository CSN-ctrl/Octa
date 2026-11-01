import { getBearerToken } from "./auth";
import type { NodeRow } from "./node-http";
import { hashSecret, parseNodeCredentialHeader, parsePendingTokenHeader, verifySecretHash } from "./node-credential";
import { createUserSupabaseClient } from "./supabase";
import { createServiceSupabaseClient } from "./supabase-admin";

type HeaderBag = Record<string, string | string[] | undefined>;

export type SupabaseAuth = { kind: "supabase"; userId: string; accessToken: string };
export type NodeAuth = { kind: "node"; node: NodeRow; token: string };
export type PendingAuth = { kind: "pending"; node: NodeRow; token: string };

function headerValue(headers: HeaderBag, name: string): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function resolveSupabaseUser(
  req: { headers: HeaderBag },
): Promise<SupabaseAuth | null> {
  const token = getBearerToken(req);
  if (!token || token.startsWith("octa_")) return null;
  const supabase = createUserSupabaseClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { kind: "supabase", userId: data.user.id, accessToken: token };
}

export async function loadNodeByCredential(token: string): Promise<NodeRow | null> {
  const admin = createServiceSupabaseClient();
  const { data, error } = await admin
    .from("nodes")
    .select("*")
    .eq("credential_hash", hashSecret(token))
    .maybeSingle();
  if (error || !data) return null;
  return data as NodeRow;
}

export async function loadNodeByPendingToken(token: string): Promise<NodeRow | null> {
  const admin = createServiceSupabaseClient();
  const { data, error } = await admin
    .from("nodes")
    .select("*")
    .eq("pending_token_hash", hashSecret(token))
    .maybeSingle();
  if (error || !data) return null;
  const row = data as NodeRow;
  if (row.pending_token_consumed_at) return null;
  if (row.pending_token_expires_at && new Date(row.pending_token_expires_at).getTime() < Date.now()) {
    return null;
  }
  if (!verifySecretHash(token, row.pending_token_hash)) return null;
  return row;
}

export async function resolveNodeOrPendingAuth(req: {
  headers: HeaderBag;
  nodeId?: string;
}): Promise<NodeAuth | PendingAuth | null> {
  const authHeader = headerValue(req.headers, "authorization");
  const nodeToken = parseNodeCredentialHeader(authHeader);
  if (nodeToken) {
    const node = await loadNodeByCredential(nodeToken);
    if (!node) return null;
    if (req.nodeId && node.id !== req.nodeId) return null;
    return { kind: "node", node, token: nodeToken };
  }

  const pendingToken = parsePendingTokenHeader(authHeader);
  if (pendingToken) {
    const node = await loadNodeByPendingToken(pendingToken);
    if (!node) return null;
    if (req.nodeId && node.id !== req.nodeId) return null;
    return { kind: "pending", node, token: pendingToken };
  }

  return null;
}

export async function isNetworkGovernanceReviewer(accessToken: string): Promise<boolean> {
  const supabase = createUserSupabaseClient(accessToken);
  const { data, error } = await supabase.rpc("is_network_governance_reviewer");
  if (error) return false;
  return data === true;
}

export async function linkWalletToUser(userId: string, walletAddress: string): Promise<void> {
  const admin = createServiceSupabaseClient();
  await admin.from("user_wallets").upsert(
    {
      user_id: userId,
      wallet_address: walletAddress,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,wallet_address" },
  );
}

export async function countLiveNodesForWallet(walletAddress: string): Promise<number> {
  const admin = createServiceSupabaseClient();
  const { count, error } = await admin
    .from("nodes")
    .select("id", { count: "exact", head: true })
    .eq("wallet_address", walletAddress)
    .in("status", ["pending", "approved"]);
  if (error) return Number.MAX_SAFE_INTEGER;
  return count ?? 0;
}

export async function fetchNodesForWallet(walletAddress: string): Promise<NodeRow[]> {
  const admin = createServiceSupabaseClient();
  const { data, error } = await admin
    .from("nodes")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as NodeRow[];
}

export async function fetchNodesForUser(userId: string): Promise<NodeRow[]> {
  const admin = createServiceSupabaseClient();
  const { data, error } = await admin
    .from("nodes")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as NodeRow[];
}
