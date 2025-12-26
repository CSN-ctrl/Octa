import { useState, useEffect, useCallback } from "react";
import { db, PortfolioManager, PortfolioFollower, generateId } from "@/lib/local-db";
import { toast } from "sonner";

// Re-export types for compatibility
export type { PortfolioManager };

export function usePortfolioManagers() {
  const [managers, setManagers] = useState<PortfolioManager[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.portfolioManagers
        .where('approval_status')
        .equals('approved')
        .sortBy('roi_annualized');
      
      // Reverse to get highest ROI first
      setManagers(data.reverse());
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
      const id = generateId('manager');
      const now = new Date().toISOString();
      
      const manager: PortfolioManager = {
        id,
        wallet_address: data.wallet_address,
        display_name: data.display_name,
        bio: data.bio,
        verified: false,
        approval_status: 'pending',
        roi_annualized: data.roi_annualized,
        sharpe_ratio: data.sharpe_ratio,
        total_followers: 0,
        performance_start_date: now,
        applied_at: now,
        management_fee_percent: 0,
      };

      await db.portfolioManagers.add(manager);
      toast.success("Application submitted for review");
    } catch (error: any) {
      console.error("Error applying as manager:", error);
      toast.error("Failed to submit application");
    }
  };

  const followManager = async (followerWallet: string, managerWallet: string, amount: number) => {
    try {
      const id = generateId('follower');
      const now = new Date().toISOString();
      
      const follower: PortfolioFollower = {
        id,
        follower_wallet: followerWallet,
        manager_wallet: managerWallet,
        allocation_amount: amount,
        copy_percent: 100,
        active: true,
        created_at: now,
      };

      await db.portfolioFollowers.add(follower);

      // Update follower count
      const managers = await db.portfolioManagers
        .where('wallet_address')
        .equals(managerWallet)
        .toArray();
      
      if (managers.length > 0) {
        const manager = managers[0];
        await db.portfolioManagers.update(manager.id!, {
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
