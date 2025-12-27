import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Portfolio = Tables<"portfolios">;

export function usePortfolio(walletAddress?: string | null) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalROI, setTotalROI] = useState(0);

  const fetchPortfolios = useCallback(async () => {
    if (!walletAddress) {
      setPortfolios([]);
      setTotalValue(0);
      setTotalROI(0);
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseService.getPortfolios(walletAddress);
      setPortfolios(data);
      
      // Calculate totals
      const total = data.reduce((sum, p) => sum + Number(p.current_value || 0), 0);
      const totalInvested = data.reduce((sum, p) => sum + Number(p.initial_investment || 0), 0);
      const avgROI = totalInvested > 0 ? ((total - totalInvested) / totalInvested) * 100 : 0;
      
      setTotalValue(total);
      setTotalROI(avgROI);
    } catch (error: any) {
      console.error("Error fetching portfolios:", error);
      toast.error("Failed to fetch portfolios");
      setPortfolios([]);
      setTotalValue(0);
      setTotalROI(0);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPortfolios();

    // Subscribe to real-time updates
    if (walletAddress) {
      const subscription = supabaseService.subscribeToPortfolios(walletAddress, (portfolio) => {
        setPortfolios((prev) => {
          const index = prev.findIndex((p) => p.id === portfolio.id);
          if (index >= 0) {
            return prev.map((p) => (p.id === portfolio.id ? portfolio : p));
          }
          return [...prev, portfolio];
        });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [walletAddress, fetchPortfolios]);

  const createPortfolio = async (data: {
    name: string;
    description?: string;
    initial_investment: number;
    risk_level?: string;
  }) => {
    if (!walletAddress) {
      toast.error("Connect wallet first");
      return;
    }

    try {
      await supabaseService.createPortfolio({
        name: data.name,
        owner_wallet: walletAddress,
        description: data.description || null,
        initial_investment: data.initial_investment,
        current_value: data.initial_investment,
        risk_level: data.risk_level || 'moderate',
        roi_percent: 0,
        status: 'active',
        auto_reinvest_enabled: false,
        auto_reinvest_percent: 0,
      });
      toast.success("Portfolio created successfully");
      await fetchPortfolios();
    } catch (error: any) {
      console.error("Error creating portfolio:", error);
      toast.error("Failed to create portfolio");
    }
  };

  const updateAutoReinvest = async (portfolioId: string, enabled: boolean, percent: number) => {
    try {
      await supabaseService.updatePortfolio(portfolioId, {
        auto_reinvest_enabled: enabled,
        auto_reinvest_percent: percent,
      });
      toast.success("Auto-reinvest settings updated");
      await fetchPortfolios();
    } catch (error: any) {
      console.error("Error updating auto-reinvest:", error);
      toast.error("Failed to update settings");
    }
  };

  return {
    portfolios,
    loading,
    totalValue,
    totalROI,
    createPortfolio,
    updateAutoReinvest,
    refresh: fetchPortfolios,
  };
}
