import { createHash, randomBytes } from "node:crypto";
import { createServiceSupabaseClient } from "./supabase-admin";

export type NodeInviteRow = {
  id: string;
  code_hash: string;
  created_by: string | null;
  expires_at: string;
  max_uses: number;
  uses: number;
  auto_approve: boolean;
  created_at: string;
};

export function normalizeInviteCode(code: string): string {
  return code.trim();
}

export function hashInviteCode(code: string): string {
  return createHash("sha256").update(normalizeInviteCode(code), "utf8").digest("hex");
}

export function generateInviteCode(): string {
  return `octa_${randomBytes(16).toString("hex")}`;
}

export async function findValidInviteByCode(code: string): Promise<NodeInviteRow | null> {
  const admin = createServiceSupabaseClient();
  const hash = hashInviteCode(code);
  const { data } = await admin
    .from("node_invites")
    .select("*")
    .eq("code_hash", hash)
    .maybeSingle();
  if (!data) return null;
  const row = data as NodeInviteRow;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  if (row.uses >= row.max_uses) return null;
  return row;
}

export async function inviteAutoApproveForJoinRequest(joinRequestId: string): Promise<boolean> {
  const admin = createServiceSupabaseClient();
  const { data: jr } = await admin
    .from("node_join_requests")
    .select("invite_id")
    .eq("id", joinRequestId)
    .maybeSingle();
  if (!jr?.invite_id) return false;
  const { data: invite } = await admin
    .from("node_invites")
    .select("auto_approve")
    .eq("id", jr.invite_id)
    .maybeSingle();
  return Boolean((invite as { auto_approve?: boolean } | null)?.auto_approve);
}
