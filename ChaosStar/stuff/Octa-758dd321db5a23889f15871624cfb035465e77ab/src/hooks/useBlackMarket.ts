import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";

export interface BlackMarketStatus {
  planetId: string;
  planetName: string;
  enabled: boolean;
  isMainMarket: boolean; // For Zarathis - black market is the main market
  activationCondition?: {
    type: "plot_sales";
    threshold: number;
    current: number;
    locked: boolean; // For Octavia - keep locked until user unlocks
  };
  liquidity: {
    XMR: number;
    Xen: number;
    SC?: number;
  };
  networkEnabled: boolean; // Can establish network across multiple worlds
}

/**
 * Hook to manage black market module per planet
 * Black market can be toggled based on government politics
 */
export function useBlackMarket() {
  const [blackMarkets, setBlackMarkets] = useState<Record<string, BlackMarketStatus>>({});
  const [loading, setLoading] = useState(true);

  const fetchBlackMarketStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch planets from Supabase to determine black market status
      const planets = await supabaseService.getPlanets();
      
      // Transform Supabase data to frontend format
        const markets: Record<string, BlackMarketStatus> = {};
        
      // Process planets from Supabase
      for (const planet of planets) {
        // Check if planet has black market access via invite system
        const hasAccess = await supabaseService.checkBlackMarketAccess(planet.owner_wallet);
        
        markets[planet.id] = {
          planetId: planet.id,
          planetName: planet.name,
          enabled: hasAccess,
          isMainMarket: planet.planet_type === "zythera", // Zythera is main market
          activationCondition: planet.planet_type === "sarakt-prime" ? {
              type: "plot_sales",
              threshold: 100000,
            current: 0, // Would need to fetch from plots table
            locked: !hasAccess,
          } : undefined,
            liquidity: { XMR: 0, Xen: 0 },
          networkEnabled: hasAccess,
          };
        }

      // Fallback: Default markets if no planets found
      if (Object.keys(markets).length === 0) {
        markets["zythera"] = {
            planetId: "zythera",
            planetName: "Zythera",
            enabled: true,
            isMainMarket: true,
            liquidity: { XMR: 0, Xen: 0 },
            networkEnabled: true,
        };
        markets["sarakt-prime"] = {
            planetId: "sarakt-prime",
            planetName: "Sarakt Prime",
            enabled: false,
            isMainMarket: false,
            activationCondition: {
              type: "plot_sales",
              threshold: 100000,
              current: 0,
              locked: true,
            },
            liquidity: { XMR: 0, Xen: 0 },
            networkEnabled: false,
        };
      }

      setBlackMarkets(markets);
    } catch (error) {
      console.debug("Could not fetch black market status:", error);
      // Fallback to default values
      setBlackMarkets({
        "zythera": {
          planetId: "zythera",
          planetName: "Zythera",
          enabled: true,
          isMainMarket: true,
          liquidity: { XMR: 0, Xen: 0 },
          networkEnabled: true,
        },
        "sarakt-prime": {
          planetId: "sarakt-prime",
          planetName: "Sarakt Prime",
          enabled: false,
          isMainMarket: false,
          activationCondition: {
            type: "plot_sales",
            threshold: 100000,
            current: 0,
            locked: true,
          },
          liquidity: { XMR: 0, Xen: 0 },
          networkEnabled: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlackMarketStatus();
    const interval = setInterval(fetchBlackMarketStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchBlackMarketStatus]);

  const getBlackMarketStatus = useCallback((planetId: string): BlackMarketStatus | null => {
    return blackMarkets[planetId] || null;
  }, [blackMarkets]);

  const isBlackMarketEnabled = useCallback((planetId: string): boolean => {
    const status = blackMarkets[planetId];
    if (!status) return false;
    
    // Zarathis is always enabled
    if (planetId === "zythera") return true;
    
    // For other planets, check if enabled and conditions met
    if (!status.enabled) return false;
    
    // Check activation conditions if they exist
    if (status.activationCondition) {
      if (status.activationCondition.locked) return false;
      if (status.activationCondition.current < status.activationCondition.threshold) return false;
    }
    
    return true;
  }, [blackMarkets]);

  return {
    blackMarkets,
    loading,
    getBlackMarketStatus,
    isBlackMarketEnabled,
    refresh: fetchBlackMarketStatus,
  };
}

