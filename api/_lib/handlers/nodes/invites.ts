import type { ApiRequest, ApiResponse } from "../../types";
import { readJsonBody, methodNotAllowed, requireBearerToken, unauthorized } from "../../http";
import { jsonError, jsonSuccess } from "../../node-http";
import { isNetworkGovernanceReviewer, resolveSupabaseUser } from "../../node-auth";
import { createServiceSupabaseClient } from "../../supabase-admin";
import { generateInviteCode, hashInviteCode, normalizeInviteCode } from "../../node-invites";

export async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const token = requireBearerToken(req);
  if (!token) {
    unauthorized(res);
    return;
  }

  const supabaseUser = await resolveSupabaseUser(req);
  if (!supabaseUser) {
    jsonError(res, 401, "unauthorized");
    return;
  }

  const reviewer = await isNetworkGovernanceReviewer(supabaseUser.accessToken);
  if (!reviewer) {
    jsonError(res, 403, "forbidden");
    return;
  }

  const body = readJsonBody<{
    code?: string;
    expires_at?: string;
    max_uses?: number;
    auto_approve?: boolean;
  }>(req);

  const expiresAtRaw = body.expires_at?.trim();
  if (!expiresAtRaw || Number.isNaN(new Date(expiresAtRaw).getTime())) {
    jsonError(res, 400, "bad_request", "expires_at must be a valid ISO8601 timestamp");
    return;
  }

  const maxUsesRaw = body.max_uses ?? 1;
  const maxUses = Number.parseInt(String(maxUsesRaw), 10);
  if (!Number.isFinite(maxUses) || maxUses < 1) {
    jsonError(res, 400, "bad_request", "max_uses must be a positive integer");
    return;
  }

  const code = body.code?.trim() ? normalizeInviteCode(body.code) : generateInviteCode();
  if (code.length < 8) {
    jsonError(res, 400, "bad_request", "code must be at least 8 characters when provided");
    return;
  }

  const autoApprove = body.auto_approve === true;

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (e) {
    jsonError(res, 503, "service_unconfigured", (e as Error).message);
    return;
  }

  const { data, error } = await admin
    .from("node_invites")
    .insert({
      code_hash: hashInviteCode(code),
      created_by: supabaseUser.userId,
      expires_at: new Date(expiresAtRaw).toISOString(),
      max_uses: maxUses,
      uses: 0,
      auto_approve: autoApprove,
    })
    .select("id, expires_at, max_uses, auto_approve, created_at")
    .single();

  if (error || !data) {
    jsonError(res, 500, "internal_error", error?.message ?? "Failed to create invite");
    return;
  }

  jsonSuccess(res, 201, {
    invite: {
      id: data.id,
      code,
      expires_at: data.expires_at,
      max_uses: data.max_uses,
      auto_approve: data.auto_approve,
      created_at: data.created_at,
    },
  });
}
