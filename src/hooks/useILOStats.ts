import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ILOStats {
  totalSpots: number;
  spotsTaken: number;
  spotsRemaining: number;
  totalRaisedUSDC: number;
  totalRaisedEUR: number;
  participantsCount: number;
  progressPercentage: number;
  isActive: boolean;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
}

const DEFAULT_STATS: ILOStats = {
  totalSpots: 10000,
  spotsTaken: 0,
  spotsRemaining: 10000,
  totalRaisedUSDC: 0,
  totalRaisedEUR: 0,
  participantsCount: 0,
  progressPercentage: 0,
  isActive: true,
  campaignStartDate: null,
  campaignEndDate: null,
};

export function useILOStats() {
  const [stats, setStats] = useState<ILOStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try RPC function first (bypasses schema cache issues)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_ilo_stats");
      
      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const row = rpcData[0];
        setStats({
          totalSpots: row.total_spots || 10000,
          spotsTaken: row.spots_taken || 0,
          spotsRemaining: row.spots_remaining || 10000,
          totalRaisedUSDC: Number(row.total_raised_usdc) || 0,
          totalRaisedEUR: Number(row.total_raised_eur) || 0,
          participantsCount: row.participants_count || 0,
          progressPercentage: Number(row.progress_percentage) || 0,
          isActive: row.is_active ?? true,
          campaignStartDate: null,
          campaignEndDate: null,
        });
        return;
      }

      // Fallback to direct table access
      const { data, error: fetchError } = await supabase
        .from("ilo_stats")
        .select("*")
        .eq("is_active", true)
        .single();

      if (fetchError) {
        // Return default stats if table doesn't exist or no data
        // Note: Schema cache may need time to update after table creation
        if (fetchError.code !== "PGRST205") {
          console.error("Failed to fetch ILO stats:", fetchError.message);
        }
        setStats(DEFAULT_STATS);
        return;
      }
      
      if (data) {
        const totalSpots = data.total_spots || 10000;
        const spotsTaken = data.spots_taken || 0;
        const spotsRemaining = totalSpots - spotsTaken;
        const progressPercentage = totalSpots > 0 ? (spotsTaken / totalSpots) * 100 : 0;

        setStats({
          totalSpots,
          spotsTaken,
          spotsRemaining,
          totalRaisedUSDC: data.total_raised_usdc || 0,
          totalRaisedEUR: data.total_raised_eur || 0,
          participantsCount: data.participants_count || 0,
          progressPercentage,
          isActive: data.is_active ?? true,
          campaignStartDate: data.campaign_start_date,
          campaignEndDate: data.campaign_end_date,
        });
      }
    } catch (err: any) {
      console.error("Error fetching ILO stats:", err);
      setError(err.message);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Poll for updates every 30 seconds (simpler and more reliable than realtime)
  useEffect(() => {
    const pollInterval = setInterval(fetchStats, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

// Admin function to update ILO stats manually
export async function updateILOStats(updates: Partial<{
  total_spots: number;
  spots_taken: number;
  total_raised_usdc: number;
  total_raised_eur: number;
  participants_count: number;
  is_active: boolean;
}>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("ilo_stats")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("is_active", true);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Failed to update ILO stats:", err);
    return false;
  }
}

// Function to increment stats (used when deposit is confirmed)
export async function incrementILOStats(
  usdcAmount: number,
  isNewParticipant: boolean = false
): Promise<boolean> {
  try {
    // Get current stats
    const { data: current, error: fetchError } = await supabase
      .from("ilo_stats")
      .select("*")
      .eq("is_active", true)
      .single();

    if (fetchError) throw fetchError;

    const eurAmount = usdcAmount / 1.1; // Convert USDC to EUR

    const { error: updateError } = await supabase
      .from("ilo_stats")
      .update({
        spots_taken: (current?.spots_taken || 0) + 1,
        total_raised_usdc: (current?.total_raised_usdc || 0) + usdcAmount,
        total_raised_eur: (current?.total_raised_eur || 0) + eurAmount,
        participants_count: isNewParticipant 
          ? (current?.participants_count || 0) + 1 
          : current?.participants_count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("is_active", true);

    if (updateError) throw updateError;
    return true;
  } catch (err) {
    console.error("Failed to increment ILO stats:", err);
    return false;
  }
}
