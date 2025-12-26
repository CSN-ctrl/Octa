/**
 * Hook for managing plot purchases
 */

import { useState, useEffect } from "react";
import { getPurchasesByAddress, getOwnedPlotsFromRegistry } from "@/lib/registry-sync";
import { PlotPurchase, PlotRegistry } from "@/lib/local-db";

export function usePlotPurchases(address?: string) {
  const [purchases, setPurchases] = useState<PlotPurchase[]>([]);
  const [ownedPlots, setOwnedPlots] = useState<PlotRegistry[]>([]);
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
        const [purchaseData, ownedData] = await Promise.all([
          getPurchasesByAddress(address),
          getOwnedPlotsFromRegistry(address),
        ]);
        
        setPurchases(purchaseData);
        setOwnedPlots(ownedData);
      } catch (error) {
        console.error("Failed to fetch plot purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPurchases, 30000);
    return () => clearInterval(interval);
  }, [address]);

  return {
    purchases,
    ownedPlots,
    loading,
    refresh: () => {
      if (address) {
        Promise.all([
          getPurchasesByAddress(address),
          getOwnedPlotsFromRegistry(address),
        ]).then(([purchaseData, ownedData]) => {
          setPurchases(purchaseData);
          setOwnedPlots(ownedData);
        });
      }
    },
  };
}

