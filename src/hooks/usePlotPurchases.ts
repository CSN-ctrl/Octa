/**
 * Hook for managing plot purchases - using Supabase
 */

import { useState, useEffect } from "react";
import { getTransactions, getPlotsByOwner } from "@/lib/supabase-service";

export interface PlotPurchase {
  plot_id: number;
  buyer_address: string;
  purchase_price: string;
  transaction_hash: string;
  timestamp: string;
}

export function usePlotPurchases(address?: string) {
  const [purchases, setPurchases] = useState<PlotPurchase[]>([]);
  const [ownedPlots, setOwnedPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setPurchases([]);
      setOwnedPlots([]);
      return;
    }

    const fetchPurchases = async () => {
      setLoading(true);
      try {
        // Get transactions for this address (plot purchases)
        const transactions = await getTransactions({
          fromAddress: address,
          limit: 1000,
        });
        
        // Filter for plot purchase transactions
        const plotPurchases = transactions
          .filter(tx => tx.transaction_type === "plot_purchase" || tx.token_type === "xBGL")
          .map(tx => ({
            plot_id: tx.plot_id || 0,
            buyer_address: address,
            purchase_price: tx.amount?.toString() || "0",
            transaction_hash: tx.transaction_hash,
            timestamp: tx.created_at || new Date().toISOString(),
          }));
        
        // Get owned plots from Supabase
        const plots = await getPlotsByOwner(address);
        
        setPurchases(plotPurchases);
        setOwnedPlots(plots);
      } catch (error) {
        console.error("Failed to fetch plot purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
    // No auto-refresh - manual refresh only
  }, [address]);

  return {
    purchases,
    ownedPlots,
    loading,
    refresh: async () => {
      if (address) {
        try {
          const transactions = await getTransactions({
            fromAddress: address,
            limit: 1000,
          });
          const plotPurchases = transactions
            .filter(tx => tx.transaction_type === "plot_purchase" || tx.token_type === "xBGL")
            .map(tx => ({
              plot_id: tx.plot_id || 0,
              buyer_address: address,
              purchase_price: tx.amount?.toString() || "0",
              transaction_hash: tx.transaction_hash,
              timestamp: tx.created_at || new Date().toISOString(),
            }));
          const plots = await getPlotsByOwner(address);
          setPurchases(plotPurchases);
          setOwnedPlots(plots);
        } catch (error) {
          console.error("Failed to refresh plot purchases:", error);
        }
      }
    },
  };
}

