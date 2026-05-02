import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type PortfolioManager = Tables<"portfolio_managers">;

export function usePortfolioManagers() {
  const [managers, setManagers] = useState<PortfolioManager[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getPortfolioManagers({
        approvalStatus: 'approved',
      });
      setManagers(data);
    } catch (error: any) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to fetch portfolio managers");
      setManagers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const applyAsManager = async (data: {
    wallet_address: string;
    display_name: string;
    bio?: string;
    roi_annualized: number;
    sharpe_ratio: number;
  }) => {
    try {
      await supabaseService.createPortfolioManager({
        wallet_address: data.wallet_address,
        display_name: data.display_name,
        bio: data.bio || null,
        verified: false,
        approval_status: 'pending',
        roi_annualized: data.roi_annualized,
        sharpe_ratio: data.sharpe_ratio,
        total_followers: 0,
        performance_start_date: new Date().toISOString(),
        applied_at: new Date().toISOString(),
        management_fee_percent: 0,
      });
      toast.success("Application submitted for review");
    } catch (error: any) {
      console.error("Error applying as manager:", error);
      toast.error("Failed to submit application");
    }
  };

  const followManager = async (followerWallet: string, managerWallet: string, amount: number) => {
    try {
      await supabaseService.createPortfolioFollower({
        follower_wallet: followerWallet,
        manager_wallet: managerWallet,
        allocation_amount: amount,
        copy_percent: 100,
        active: true,
      });

      // Update follower count
      const manager = await supabaseService.getPortfolioManagerByWallet(managerWallet);
      if (manager) {
        await supabaseService.updatePortfolioManager(manager.id, {
          total_followers: (manager.total_followers || 0) + 1,
        });
      }
      
      toast.success("Successfully following manager");
      await fetchManagers();
    } catch (error: any) {
      console.error("Error following manager:", error);
      toast.error("Failed to follow manager");
    }
  };

  return {
    managers,
    loading,
    applyAsManager,
    followManager,
    refresh: fetchManagers,
  };
}
