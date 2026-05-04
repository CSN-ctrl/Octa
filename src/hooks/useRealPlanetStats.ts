import { useState, useEffect, useCallback } from "react";
import { useLandPlots } from "./useLandPlots";
import { useTreasury } from "./useTreasury";
import * as supabaseService from "@/lib/supabase-service";
import { PLANET_SARAKT_PRIME_ID, PLANET_ZYTHERA_ID } from "@/config/world-ids";

/** One UI entry per canonical planet; DB rows use UUID ids — map them to sarakt-prime / zythera keys. */
function canonicalPlanetUiKey(planet: { id: string; name?: string | null }): string {
  if (planet.id === PLANET_SARAKT_PRIME_ID) return "sarakt-prime";
  if (planet.id === PLANET_ZYTHERA_ID) return "zythera";
  const n = planet.name?.trim().toLowerCase() ?? "";
  if (n === "sarakt prime") return "sarakt-prime";
  if (n === "zythera") return "zythera";
  return planet.id;
}

export interface RealPlanetStats {
  name: string;
  status: string;
  population: number; // Based on plots sold
  coverage: number; // Based on plots sold / total plots
  tier: string;
  color: string;
  locked: boolean;
  description: string;
  districts?: any[];
  features?: string[];
  // Real blockchain data
  plotsSold: number;
  totalPlots: number;
  treasuryBalance: string;
  rpc_url?: string;
  chain_id?: number;
  subnet_id?: string;
}

/**
 * Hook to get real planet stats from blockchain contracts
 * Replaces hardcoded planetsData with actual on-chain data
 */
export function useRealPlanetStats() {
  const { plotsSold, totalPlots, plotsRemaining } = useLandPlots();
  const { balances } = useTreasury();
  const [planets, setPlanets] = useState<Record<string, RealPlanetStats>>({});
  const [loading, setLoading] = useState(true);

  const fetchRealPlanetStats = useCallback(async () => {
    setLoading(true);
    try {
      // Get Sarakt Prime stats from contracts (main planet)
      const saraktPrimeStats: RealPlanetStats = {
        name: "Sarakt Prime",
        status: "Habitable",
        population: Math.round((plotsSold / totalPlots) * 100), // Population based on plot coverage
        coverage: Math.round((plotsSold / totalPlots) * 100), // Coverage percentage
        tier: "Capital",
        color: "primary",
        locked: false,
        description: "Cliff-carved capital overlooking the Sapphire Sea. Vertical architecture, Treasury Tower, xBGL economy hub.",
        plotsSold,
        totalPlots,
        treasuryBalance: balances.avax,
        features: ["Treasury Tower", "Vertical Architecture", "Sapphire Sea Access", "Underground Mines"],
        districts: [{
          name: "Octavia Capital City",
          plots: totalPlots,
          price: 75,
          type: "Capital",
          description: "The grand capital city of Octavia, heart of the Sarakt Prime planet. Home to the Treasury Tower, vertical architecture, and the central xBGL economy hub."
        }]
      };

      // Try to get Zythera from real API/blockchain
      // For now, calculate from contracts (could be a separate subnet/contract)
      const zytheraStats: RealPlanetStats = {
        name: "Zythera",
        status: "Isolated",
        population: Math.round((plotsSold / totalPlots) * 18), // Approximate for frontier
        coverage: Math.round((plotsSold / totalPlots) * 8),
        tier: "Frontier",
        color: "destructive",
        locked: false,
        description: "Bioluminescent nanofiber ecosystem. Black market research, ShadowCoin trades, chaotic frontier.",
        plotsSold: Math.round(plotsSold * 0.18), // Approximate
        totalPlots: Math.round(totalPlots * 0.18),
        treasuryBalance: "0", // Separate treasury for frontier
        features: ["Nanofiber Web", "Bioluminescent Flora", "Black Market", "Chaos Energy"],
        districts: [{
          name: "Capital city of Zarathis",
          plots: Math.round(totalPlots * 0.18),
          price: 75,
          type: "Frontier",
          description: "Zarathis - the notorious black market capital of Zythera. A lawless frontier city where ShadowCoin flows freely and nanofiber tech deals are made in the shadows."
        }]
      };

      // Try to fetch real planets from Supabase
      try {
        const planets = await supabaseService.getPlanets();
        if (planets && Array.isArray(planets) && planets.length > 0) {
          const merged: Record<string, RealPlanetStats> = {};

          for (const planet of planets) {
            const uiKey = canonicalPlanetUiKey(planet);

            let subnetInfo = null;
            if (planet.star_system_id) {
              try {
                const system = await supabaseService.getStarSystemById(planet.star_system_id);
                if (system?.subnet_id) {
                  subnetInfo = {
                    subnet_id: system.subnet_id,
                    chain_id: system.chain_id,
                    rpc_url: system.rpc_url,
                  };
                }
              } catch (e) {
                console.warn("Could not fetch subnet info for planet:", e);
              }
            }

            const isCanonicalHabitable =
              uiKey === "sarakt-prime" ||
              planet.planet_type === "habitable" ||
              planet.planet_type === "sarakt-prime";
            const planetCoverage = isCanonicalHabitable
              ? (plotsSold / totalPlots) * 100
              : (plotsSold / totalPlots) * 18;

            const fromRow: RealPlanetStats = {
              name: planet.name,
              status: planet.status === "active" ? "Habitable" : planet.status === "deploying" ? "Deploying" : "Inactive",
              population: Math.round(planetCoverage),
              coverage: Math.round(planetCoverage),
              tier: isCanonicalHabitable ? "Capital" : planet.planet_type === "resource" ? "Resource" : "Frontier",
              color: isCanonicalHabitable ? "primary" : planet.planet_type === "resource" ? "secondary" : "destructive",
              locked: planet.status !== "active",
              description: `${planet.name} — ${planet.planet_type || "planet"} in the Sarakt system.`,
              plotsSold: Math.round(plotsSold * (isCanonicalHabitable ? 1 : 0.18)),
              totalPlots: isCanonicalHabitable ? totalPlots : Math.round(totalPlots * 0.18),
              treasuryBalance: "0",
              rpc_url: subnetInfo?.rpc_url ?? "",
              chain_id: subnetInfo?.chain_id ?? 0,
              subnet_id: subnetInfo?.subnet_id ?? "",
              features: [],
              districts: [{
                name: "Octavia Capital City",
                plots: isCanonicalHabitable ? totalPlots : Math.round(totalPlots * 0.18),
                price: 75,
                type: isCanonicalHabitable ? "Capital" : planet.planet_type === "resource" ? "Resource" : "Frontier",
                description: `The main settlement on ${planet.name}.`
              }]
            };

            const base = uiKey === "sarakt-prime" ? saraktPrimeStats : uiKey === "zythera" ? zytheraStats : null;
            merged[uiKey] = base
              ? {
                  ...base,
                  name: planet.name,
                  locked: fromRow.locked,
                  population: fromRow.population,
                  coverage: fromRow.coverage,
                  plotsSold: fromRow.plotsSold,
                  totalPlots: fromRow.totalPlots,
                  treasuryBalance: fromRow.treasuryBalance || base.treasuryBalance,
                  rpc_url: fromRow.rpc_url || base.rpc_url,
                  chain_id: fromRow.chain_id ?? base.chain_id,
                  subnet_id: fromRow.subnet_id || base.subnet_id,
                }
              : fromRow;
          }

          if (!merged["sarakt-prime"]) merged["sarakt-prime"] = saraktPrimeStats;
          if (!merged["zythera"]) merged["zythera"] = zytheraStats;

          setPlanets(merged);
        } else {
          setPlanets({
            "sarakt-prime": saraktPrimeStats,
            "zythera": zytheraStats
          });
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        // Suppress timeout errors - backend might not be available
        const isTimeoutError = err.name === "AbortError" ||
          err.name === "DOMException" ||
          err.message?.includes("timeout") ||
          err.message?.includes("Failed to fetch");
        if (!isTimeoutError) {
          console.warn("Could not fetch planets from API, using calculated stats:", error);
        } else {
          console.debug("Planets API request timed out - backend may not be available");
        }
        // Fallback to calculated stats from contracts
        setPlanets({
          "sarakt-prime": saraktPrimeStats,
          "zythera": zytheraStats
        });
      }
    } catch (error) {
      console.error("Error fetching real planet stats:", error);
      // Set empty stats on error
      setPlanets({});
    } finally {
      setLoading(false);
    }
  }, [plotsSold, totalPlots, balances.avax]);

  useEffect(() => {
    fetchRealPlanetStats();
    // No auto-refresh - manual refresh only
  }, [fetchRealPlanetStats]);

  return {
    planets,
    loading,
    refresh: fetchRealPlanetStats
  };
}
