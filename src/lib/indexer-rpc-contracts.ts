/**
 * Typed parsers for Supabase RPC responses used by Fuji indexers and the deposit UI.
 * Keeps edge-function ↔ client contracts explicit and testable.
 */

export type IndexerRpcResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

function asObject(data: unknown): Record<string, unknown> | null {
  return data !== null && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

export function parseRecordOnchainDepositResponse(
  data: unknown,
): IndexerRpcResult<{ duplicate?: boolean }> {
  const obj = asObject(data);
  if (!obj) return { success: false, error: "invalid response" };
  if (obj.success === false) {
    return { success: false, error: String(obj.error ?? "unknown error") };
  }
  if (obj.success !== true) return { success: false, error: "missing success flag" };
  return {
    success: true,
    duplicate: obj.duplicate === true,
  };
}

export function parseRecordOnchainDepositServiceResponse(
  data: unknown,
): IndexerRpcResult<{ duplicate?: boolean; user_email?: string; status?: string }> {
  const obj = asObject(data);
  if (!obj) return { success: false, error: "invalid response" };
  if (obj.success === false) {
    return { success: false, error: String(obj.error ?? "unknown error") };
  }
  if (obj.success !== true) return { success: false, error: "missing success flag" };
  return {
    success: true,
    duplicate: obj.duplicate === true,
    user_email: typeof obj.user_email === "string" ? obj.user_email : undefined,
    status: typeof obj.status === "string" ? obj.status : undefined,
  };
}

export function parseSyncChainPlotOwnershipResponse(
  data: unknown,
): IndexerRpcResult<{ plot_id?: number; new_wallet?: string; tx_hash?: string }> {
  const obj = asObject(data);
  if (!obj) return { success: false, error: "invalid response" };
  if (obj.success === false) {
    return { success: false, error: String(obj.error ?? "unknown error") };
  }
  if (obj.success !== true) return { success: false, error: "missing success flag" };
  return {
    success: true,
    plot_id: typeof obj.plot_id === "number" ? obj.plot_id : undefined,
    new_wallet: typeof obj.new_wallet === "string" ? obj.new_wallet : undefined,
    tx_hash: typeof obj.tx_hash === "string" ? obj.tx_hash : undefined,
  };
}

export function parseConfirmOnchainDepositResponse(
  data: unknown,
): IndexerRpcResult<{ status?: string; credited?: boolean }> {
  const obj = asObject(data);
  if (!obj) return { success: false, error: "invalid response" };
  if (obj.success === false) {
    return { success: false, error: String(obj.error ?? "unknown error") };
  }
  if (obj.success !== true) return { success: false, error: "missing success flag" };
  return {
    success: true,
    status: typeof obj.status === "string" ? obj.status : undefined,
    credited: obj.credited === true,
  };
}

export function parseCreditOnchainDepositResponse(
  data: unknown,
): IndexerRpcResult<{ tx_hash?: string; xbgl_amount?: number }> {
  const obj = asObject(data);
  if (!obj) return { success: false, error: "invalid response" };
  if (obj.success === false) {
    return { success: false, error: String(obj.error ?? "unknown error") };
  }
  if (obj.success !== true) return { success: false, error: "missing success flag" };
  return {
    success: true,
    tx_hash: typeof obj.tx_hash === "string" ? obj.tx_hash : undefined,
    xbgl_amount: typeof obj.xbgl_amount === "number" ? obj.xbgl_amount : undefined,
  };
}

/** Expected RPC arg shape for record_onchain_deposit (client-side). */
export function buildRecordOnchainDepositArgs(record: {
  tx_hash: string;
  wallet_address: string;
  chain_id: number;
  avax_amount: number;
  xbgl_amount: number;
  user_email?: string;
}) {
  return {
    p_tx_hash: record.tx_hash,
    p_wallet_address: record.wallet_address,
    p_chain_id: record.chain_id,
    p_avax_amount: record.avax_amount,
    p_xbgl_amount: record.xbgl_amount,
    p_user_email: record.user_email ?? "",
  };
}

/** Expected RPC arg shape for sync_chain_plot_ownership (indexer). */
export function buildSyncChainPlotOwnershipArgs(input: {
  plot_id: number;
  owner_wallet: string;
  tx_hash: string;
}) {
  return {
    p_plot_id: input.plot_id,
    p_owner_wallet: input.owner_wallet,
    p_tx_hash: input.tx_hash,
  };
}
