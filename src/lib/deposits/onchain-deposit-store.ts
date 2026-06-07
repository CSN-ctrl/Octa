/**
 * Persist on-chain AVAX→xBGL deposits to Supabase (user-scoped, idempotent by tx_hash).
 */

import { supabase } from "@/integrations/supabase/client";
import { getPaymentChainId } from "@/config/blockchain-profile";

export type OnChainDepositRecord = {
  tx_hash: string;
  wallet_address: string;
  chain_id: number;
  avax_amount: number;
  xbgl_amount: number;
};

export async function recordOnChainDeposit(
  record: OnChainDepositRecord,
): Promise<{ ok: boolean; duplicate?: boolean }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { ok: false };
  }

  const { data, error } = await supabase.rpc("record_onchain_deposit", {
    p_tx_hash: record.tx_hash,
    p_wallet_address: record.wallet_address,
    p_chain_id: record.chain_id ?? getPaymentChainId(),
    p_avax_amount: record.avax_amount,
    p_xbgl_amount: record.xbgl_amount,
    p_user_email: session.user.email ?? "",
  });

  if (error) {
    console.debug("record_onchain_deposit failed:", error.message);
    return { ok: false };
  }

  const payload = data as { success?: boolean; duplicate?: boolean } | null;
  return {
    ok: payload?.success === true,
    duplicate: payload?.duplicate === true,
  };
}

export type OnChainDepositStatus = "pending" | "confirmed" | "failed";

export async function fetchOnChainDepositsForUser(limit = 30): Promise<
  Array<{
    tx_hash: string;
    wallet_address: string;
    avax_amount: number;
    xbgl_amount: number;
    created_at: string;
    /** undefined when the status column is not yet present in the DB schema. */
    status: OnChainDepositStatus | undefined;
  }>
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.email) return [];

  const { data, error } = await (supabase as any)
    .from("onchain_deposits")
    .select("tx_hash, wallet_address, avax_amount, xbgl_amount, created_at, status")
    .eq("user_email", session.user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.debug("fetch onchain_deposits failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    tx_hash: String(row.tx_hash),
    wallet_address: String(row.wallet_address),
    avax_amount: Number(row.avax_amount),
    xbgl_amount: Number(row.xbgl_amount),
    created_at: String(row.created_at),
    status: isValidDepositStatus(row.status) ? row.status : undefined,
  }));
}

function isValidDepositStatus(value: unknown): value is OnChainDepositStatus {
  return value === "pending" || value === "confirmed" || value === "failed";
}
