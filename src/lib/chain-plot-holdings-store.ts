/**
 * Indexed on-chain plot holdings — query chain_plot_holdings table by owner wallet.
 * Falls back to undefined (caller should run the 200-plot scan) when the table is
 * unavailable or empty.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ChainPlotHoldingRow {
  plot_id: number;
  status: "minted" | "pending";
}

/**
 * Query the `chain_plot_holdings` index table for plots owned by `walletAddress`.
 *
 * Returns `null` when the table doesn't exist or the query fails — callers should
 * fall back to the full contract scan in that case.
 *
 * Returns an empty array when the table exists but has no rows for the wallet —
 * this is a valid zero-holding result (no fallback needed unless
 * `VITE_FORCE_CHAIN_PLOT_SCAN` is set).
 */
export async function fetchChainPlotHoldingsFromDB(
  walletAddress: string
): Promise<ChainPlotHoldingRow[] | null> {
  if (!walletAddress) return null;

  try {
    const { data, error } = await (supabase as any)
      .from("chain_plot_holdings")
      .select("plot_id, status")
      .eq("owner_wallet", walletAddress.toLowerCase());

    if (error) {
      // Table might not exist yet — treat as unavailable
      console.debug("chain_plot_holdings query failed:", error.message);
      return null;
    }

    if (!Array.isArray(data)) return null;

    return data.map((row: { plot_id: number; status?: string }) => ({
      plot_id: Number(row.plot_id),
      status: row.status === "pending" ? "pending" : "minted",
    }));
  } catch (err) {
    console.debug("chain_plot_holdings unavailable:", err);
    return null;
  }
}

/** True when a full contract scan is forced via env flag. */
export function isChainPlotScanForced(): boolean {
  return import.meta.env.VITE_FORCE_CHAIN_PLOT_SCAN?.toString().toLowerCase() === "true";
}
