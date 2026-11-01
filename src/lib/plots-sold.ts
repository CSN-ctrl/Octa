import { supabase } from "@/integrations/supabase/client";
import { GENESIS_PLOTS_TOTAL } from "@/lib/genesis-product-copy";
export async function fetchGenesisPlotsSold(): Promise<number> {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_ilo_stats");
    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      const taken = Number(row?.spots_taken);
      if (Number.isFinite(taken)) return taken;
    }
  } catch {
    // fall through
  }

  try {
    const { data, error } = await supabase.from("ilo_stats").select("spots_taken").eq("is_active", true).single();
    if (!error && data?.spots_taken != null) {
      return Number(data.spots_taken) || 0;
    }
  } catch {
    // fall through
  }

  return 0;
}
