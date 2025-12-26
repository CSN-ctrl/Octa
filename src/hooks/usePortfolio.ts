import { useState, useEffect, useCallback } from "react";
import { db, Portfolio, generateId } from "@/lib/local-db";
import { toast } from "sonner";

// Re-export Portfolio type for compatibility
export type { Portfolio };

export function usePortfolio(walletAddress?: string | null) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalROI, setTotalROI] = useState(0);

  const fetchPortfolios = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const data = await db.portfolios
        .where('owner_wallet')
        .equals(walletAddress)
        .sortBy('created_at');
      
      // Reverse to get newest first
      const sortedData = data.reverse();

      setPortfolios(sortedData);
      
      // Calculate totals
      const total = sortedData.reduce((sum, p) => sum + Number(p.current_value), 0);
      const totalInvested = sortedData.reduce((sum, p) => sum + Number(p.initial_investment), 0);
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
  }, [fetchPortfolios]);

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
      const now = new Date().toISOString();
      const id = generateId('portfolio');
      
      const portfolio: Portfolio = {
        id,
        owner_wallet: walletAddress,
        name: data.name,
        description: data.description,
        initial_investment: data.initial_investment,
        current_value: data.initial_investment,
        risk_level: data.risk_level || 'moderate',
        roi_percent: 0,
        created_at: now,
        updated_at: now,
        status: 'active',
        auto_reinvest_enabled: false,
        auto_reinvest_percent: 0,
      };

      await db.portfolios.add(portfolio);
      toast.success("Portfolio created successfully");
      await fetchPortfolios();
    } catch (error: any) {
      console.error("Error creating portfolio:", error);
      toast.error("Failed to create portfolio");
    }
  };

  const updateAutoReinvest = async (portfolioId: string, enabled: boolean, percent: number) => {
    try {
      await db.portfolios.update(portfolioId, {
        auto_reinvest_enabled: enabled,
        auto_reinvest_percent: percent,
        updated_at: new Date().toISOString(),
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
