import { getApiUrl } from "@/env";

export interface BackendPlot {
  wallet: string;
  token_id: string | number;
  metadata?: any;
}

// Use getApiUrl from env.ts for consistency
export function getApiBase(): string {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/\/+$/, "");
}

export function getRegistryApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_REGISTRY_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  // Default to Registry API on port 8000
  return "http://localhost:8000";
}

export async function fetchPlots(address: string): Promise<BackendPlot[]> {
  // Try registry API first (port 8000)
  const registryBase = getRegistryApiBase();
  try {
    const res = await fetch(`${registryBase}/registry/owner/${address}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const plotIds: number[] = await res.json();
      // Fetch detailed metadata for each plot
      const plotsWithMetadata = await Promise.all(
        plotIds.slice(0, 100).map(async (plotId) => {
          try {
            const plotRes = await fetch(`${registryBase}/registry/plot/${plotId}`, {
              signal: AbortSignal.timeout(3000),
            });
            if (plotRes.ok) {
              const plotData = await plotRes.json();
              return {
                wallet: address,
                token_id: plotId,
                metadata: {
                  plotId,
                  x: plotData.x,
                  y: plotData.y,
                  level: plotData.level,
                  issued: plotData.issued,
                  price: plotData.price,
                  planetId: plotData.planetId,
                  owner: address,
                  source: "registry"
                }
              };
            }
          } catch (e) {
            // Skip if individual plot fetch fails
          }
          return {
            wallet: address,
            token_id: plotId,
            metadata: { plotId, owner: address, source: "registry" }
          };
        })
      );
      if (plotsWithMetadata.length > 0) {
        console.log(`✅ Fetched ${plotsWithMetadata.length} plots from Registry API`);
        return plotsWithMetadata;
      }
    }
  } catch (error: any) {
    // Registry API not available - try backend
    console.debug("Registry API not available, trying backend:", error.message);
  }

  // Try backend (port 5001)
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/plots/owned/${address}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.plots || [];
    }
  } catch (error: any) {
    // Backend not available - fall back to contract
    const isConnectionError = error.name === 'AbortError' || 
                             error.name === 'TypeError' ||
                             error.message?.includes('Failed to fetch') ||
                             error.message?.includes('ERR_CONNECTION_REFUSED');
    if (isConnectionError) {
      // Fall back to contract query
      return fetchPlotsFromContract(address);
    }
    throw error;
  }
  
  // If we get here, backend returned an error status
  // Fall back to contract
  return fetchPlotsFromContract(address);
}

/**
 * Fetch plots directly from the contract
 */
async function fetchPlotsFromContract(address: string): Promise<BackendPlot[]> {
  try {
    const { fetchOwnedPlots } = await import("@/lib/plotUtils");
    const plotIds = await fetchOwnedPlots(address, 1000);
    
    // Convert to BackendPlot format
    return plotIds.map(plotId => ({
      wallet: address,
      token_id: plotId,
      metadata: {
        plotId,
        owner: address,
      }
    }));
  } catch (error) {
    console.debug("Failed to fetch plots from contract:", error);
    return [];
  }
}

export async function savePlot(wallet: string, tokenId: number | string, metadata: any): Promise<void> {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/plots/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: wallet,
        token_id: tokenId,
        metadata: metadata
      }),
    });
    if (!res.ok) {
      // Don't throw - backend might not be available, but plot is still on blockchain
      const errorText = await res.text().catch(() => res.statusText);
      console.debug("Failed to save plot to backend:", errorText);
    }
  } catch (error: any) {
    // Don't throw - backend might not be available, but plot is still on blockchain
    console.debug("Failed to save plot to backend:", error.message);
  }
}

export interface PendingPurchase {
  plotId: number;
  buyer: string;
  amount: number;
  paymentToken: string; // address(0) for xBGL (native)
  timestamp: number;
}

export async function fetchPendingPurchases(): Promise<PendingPurchase[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/contracts/pending`);
  if (!res.ok) {
    throw new Error(`Failed to fetch pending purchases: ${res.status}`);
  }
  const data = await res.json();
  return data?.pending || [];
}

export async function activatePlot(plotId: number, recipient?: string): Promise<{ txHash: string; status: number }> {
  const base = getApiBase();
  const body = recipient ? { plotId, recipient } : { plotId };
  const res = await fetch(`${base}/api/contracts/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Activation failed: ${res.status}`);
  }
  const data = await res.json();
  return { txHash: data.txHash, status: data.status };
}

// Economy APIs
export async function getCurrencies() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/economy/currencies`);
  if (!res.ok) throw new Error(`Failed to fetch currencies`);
  return res.json();
}

export async function getTreasury() {
  const base = getApiBase();
  try {
  const res = await fetch(`${base}/api/treasury`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch treasury: ${res.statusText}`);
  return res.json();
  } catch (error: any) {
    // Handle connection errors gracefully
    const isConnectionError = error.name === 'AbortError' || 
                             error.name === 'TypeError' ||
                             error.message?.includes('Failed to fetch') ||
                             error.message?.includes('ERR_CONNECTION_REFUSED');
    if (isConnectionError) {
      throw new Error('Backend not available');
    }
    throw error;
  }
}

// NPC APIs
export async function listNpcs() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/npcs/`);
  if (!res.ok) throw new Error(`Failed to fetch NPCs`);
  return res.json();
}

export async function spawnNpcs(count: number, cohort?: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/npcs/spawn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, cohort }),
  });
  if (!res.ok) throw new Error(`Failed to spawn NPCs`);
  return res.json();
}

// City APIs
export async function listZones() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/city/zones`);
  if (!res.ok) throw new Error(`Failed to fetch zones`);
  return res.json();
}

export async function listCityPlots(limit?: number, offset?: number) {
  const base = getApiBase();
  try {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (offset) params.append("offset", offset.toString());
  const url = `${base}/api/city/plots${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    if (!res.ok) {
      // If backend is not available, return empty plots instead of throwing
      if (res.status === 503 || res.status === 0) {
        console.debug("Backend not available for city plots");
        return { plots: [] };
      }
      throw new Error(`Failed to fetch city plots: ${res.statusText}`);
    }
  return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return empty plots instead of throwing
    if (error.name === "AbortError" || error.name === "TypeError") {
      console.debug("Backend not available for city plots");
      return { plots: [] };
    }
    throw error;
  }
}

export async function getCityStats(cityName?: string) {
  const base = getApiBase();
  try {
  const params = new URLSearchParams();
  if (cityName) params.append("city_name", cityName);
  const url = `${base}/api/city/stats${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    if (!res.ok) {
      // If backend is not available, return null instead of throwing
      if (res.status === 503 || res.status === 0) {
        console.debug("Backend not available for city stats");
        return null;
      }
      throw new Error(`Failed to fetch city stats: ${res.statusText}`);
    }
  return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return null instead of throwing
    if (error.name === "AbortError" || error.name === "TypeError") {
      console.debug("Backend not available for city stats");
      return null;
    }
    throw error;
  }
}

export async function calculateNewcomers() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/city/newcomers/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to calculate newcomers`);
  return res.json();
}

// Governance APIs
export async function listFactions() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/governance/factions`);
  if (!res.ok) throw new Error(`Failed to fetch factions`);
  return res.json();
}

export async function getBlackMarket() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/governance/black-market`);
  if (!res.ok) throw new Error(`Failed to fetch black market`);
  return res.json();
}

// Portfolio APIs
export async function getPortfolio(wallet: string, portfolioType?: "primary" | "secondary") {
  const base = getApiBase();
  const url = portfolioType 
    ? `${base}/api/portfolio/${wallet}?portfolio_type=${portfolioType}`
    : `${base}/api/portfolio/${wallet}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // If backend returns 404 or is not available, return null (frontend will use local DB)
      if (res.status === 404 || res.status === 503 || res.status === 0) {
        console.debug("Backend portfolio endpoint not available, frontend will use local database");
        return null;
      }
      throw new Error(`Failed to fetch portfolio: ${res.statusText}`);
    }
    return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return null (frontend will use local DB)
    const isConnectionError = error.name === "AbortError" || 
                             error.name === "TypeError" ||
                             error.message?.includes("Failed to fetch") ||
                             error.message?.includes("ERR_CONNECTION_REFUSED") ||
                             error.message?.includes("404");
    if (isConnectionError) {
      console.debug("Backend not available for portfolio, frontend will use local database");
      return null;
    }
    throw error;
  }
}

export async function getPortfolioFromRegistry(wallet: string, portfolioType?: "primary" | "secondary") {
  const base = getRegistryApiBase();
  try {
    const url = portfolioType 
      ? `${base}/registry/portfolio/${wallet}?portfolio_type=${portfolioType}`
      : `${base}/registry/portfolio/${wallet}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.debug("Registry API not available for portfolio");
      return null;
    }
    const portfolio = await res.json();
    // Wrap in the same format as backend API
    return {
      portfolio: portfolio
    };
  } catch (error: any) {
    console.debug("Registry API not available for portfolio:", error.message);
    return null;
  }
}

export async function getLoanEligibility(wallet: string) {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/portfolio/${wallet}/loans`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      if (res.status === 503 || res.status === 0) {
        console.debug("Backend not available for loan eligibility");
        return null;
      }
      throw new Error(`Failed to fetch loan eligibility: ${res.statusText}`);
    }
    return res.json();
  } catch (error: any) {
    const isConnectionError = error.name === "AbortError" || 
                             error.name === "TypeError" ||
                             error.message?.includes("Failed to fetch") ||
                             error.message?.includes("ERR_CONNECTION_REFUSED");
    if (isConnectionError) {
      console.debug("Backend not available for loan eligibility");
      return null;
    }
    throw error;
  }
}

export async function upsertPortfolio(input: {
  wallet: string;
  holdings?: Array<{ asset_type: string; identifier: string; cost_basis?: number; yield_annual?: number; metadata?: any }>;
  recurring_investment_monthly?: number;
  manager_id?: string | null;
  portfolio_type?: "primary" | "secondary";
}) {
  // Always save to local database first (primary source)
  try {
    const { db, generateId } = await import("@/lib/local-db");
    
    // Check if portfolio exists
    const existing = await db.portfolios
      .where('owner_wallet')
      .equals(input.wallet)
      .filter(p => (p.portfolio_type || 'primary') === (input.portfolio_type || 'primary'))
      .first();
    
    const now = new Date().toISOString();
    const totalValue = (input.holdings || []).reduce((sum, h) => sum + (h.cost_basis || 0), 0);
    const initialInvestment = existing?.initial_investment || totalValue;
    const currentValue = totalValue;
    const roiPercent = initialInvestment > 0 ? ((currentValue - initialInvestment) / initialInvestment) * 100 : 0;
    
    if (existing) {
      // Update existing portfolio
      await db.portfolios.update(existing.id!, {
        holdings: input.holdings || existing.holdings || [],
        total_value: totalValue,
        current_value: currentValue,
        recurring_investment_monthly: input.recurring_investment_monthly ?? existing.recurring_investment_monthly ?? 0,
        roi_percent: roiPercent,
        updated_at: now,
      });
    } else {
      // Create new portfolio
      const id = generateId('portfolio');
      await db.portfolios.add({
        id,
        owner_wallet: input.wallet,
        name: `${input.portfolio_type || 'primary'} Portfolio`,
        description: `Portfolio for ${input.wallet}`,
        initial_investment: initialInvestment,
        current_value: currentValue,
        roi_percent: roiPercent,
        created_at: now,
        updated_at: now,
        status: 'active',
        risk_level: 'moderate',
        auto_reinvest_enabled: false,
        auto_reinvest_percent: 0,
        portfolio_type: input.portfolio_type || 'primary',
        holdings: input.holdings || [],
        total_value: totalValue,
        recurring_investment_monthly: input.recurring_investment_monthly || 0,
        wallet: input.wallet,
      });
    }
    
    console.debug("Portfolio saved to local database");
  } catch (error: any) {
    console.error("Failed to save portfolio to local database:", error);
    // Continue to try backend as fallback
  }
  
  // Try backend as optional sync (non-blocking)
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/portfolio/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      console.debug("Portfolio synced to backend");
      return res.json();
    }
  } catch (error: any) {
    // Backend sync is optional, just log
    console.debug("Backend sync failed (optional):", error.message);
  }
  
  // Return local database format
  return {
    portfolio: {
      wallet: input.wallet,
      portfolio_type: input.portfolio_type || 'primary',
      holdings: input.holdings || [],
      total_value: (input.holdings || []).reduce((sum, h) => sum + (h.cost_basis || 0), 0),
      recurring_investment_monthly: input.recurring_investment_monthly || 0,
    }
  };
}

export async function projectPortfolio(input: { wallet: string; years?: number; expected_annual_return?: number }) {
  const base = getApiBase();
  const body = {
    wallet: input.wallet,
    years: input.years ?? 5,
    expected_annual_return: input.expected_annual_return ?? 0.07,
  };
  try {
    const res = await fetch(`${base}/api/portfolio/project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      // If backend is not available (404, 503, etc), return null instead of throwing
      if (res.status === 404 || res.status === 503 || res.status === 0) {
        console.debug("Backend not available for portfolio projection");
        return null;
      }
      const t = await res.text();
      throw new Error(t || "Failed to project portfolio");
    }
    return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return null instead of throwing
    const isConnectionError = error.name === "AbortError" || 
                             error.name === "TypeError" ||
                             error.message?.includes("Failed to fetch") ||
                             error.message?.includes("ERR_CONNECTION_REFUSED");
    if (isConnectionError) {
      console.debug("Backend not available for portfolio projection");
      return null;
    }
    throw error;
  }
}

// Celestial Forge APIs - Native ChaosStar blockchain integration
export async function spawnStarSystem(input: {
  name: string;
  owner_wallet: string;
  tribute_percent?: number;
  mock?: boolean;
}) {
  const base = getApiBase();
  const url = `${base}/api/celestial-forge/star-systems/create`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        owner_wallet: input.owner_wallet,
        tribute_percent: input.tribute_percent ?? 5,
      }),
    });
    
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Failed to spawn star system (${res.status})`);
    }
    
    return res.json();
  } catch (error: any) {
    // Improve network error messages
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new TypeError(
        `Cannot connect to ChaosStar backend at ${base}.\n\n` +
        `Please start the backend server:\n` +
        `  cd chaosstarvm && ./build/chaosstar-backend\n\n` +
        `Or build and run: cd chaosstarvm/backend && go build -o ../build/chaosstar-backend . && ../build/chaosstar-backend`
      );
    }
    throw error;
  }
}

export async function spawnPlanet(input: {
  name: string;
  star_system_id: string;
  star_system_name?: string;
  owner_wallet: string;
  planet_type?: string;
  mock?: boolean;
}) {
  const base = getApiBase();
  const url = `${base}/api/celestial-forge/planets/create`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        star_system_id: input.star_system_id,
        owner_wallet: input.owner_wallet,
        planet_type: input.planet_type ?? "habitable",
      }),
    });
    
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Failed to spawn planet (${res.status})`);
    }
    
    return res.json();
  } catch (error: any) {
    // Improve network error messages
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new TypeError(
        `Cannot connect to ChaosStar backend at ${base}.\n\n` +
        `Please start the backend server:\n` +
        `  cd chaosstarvm && ./build/chaosstar-backend\n\n` +
        `Or build and run: cd chaosstarvm/backend && go build -o ../build/chaosstar-backend . && ../build/chaosstar-backend`
      );
    }
    throw error;
  }
}

export async function getSubnetStatus(subnet_name: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/subnet/${subnet_name}/status`);
  if (!res.ok) throw new Error(`Failed to get subnet status`);
  return res.json();
}

export async function listCelestialForgeSubnets() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/subnets`);
  if (!res.ok) throw new Error(`Failed to list subnets`);
  return res.json();
}

export async function listCelestialForgeNodes() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/nodes`);
  if (!res.ok) throw new Error(`Failed to list nodes`);
  return res.json();
}

export async function assignSubnetToStarSystem(systemId: string, subnetName: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/star-systems/${systemId}/assign-subnet?subnet_name=${encodeURIComponent(subnetName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Failed to assign subnet`);
  }
  return res.json();
}

export async function assignNodeToPlanet(planetId: string, nodeId: string, subnetName?: string) {
  const base = getApiBase();
  // Use the new assign-node endpoint for node assignment
  const res = await fetch(`${base}/api/celestial-forge/planets/${planetId}/assign-node`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ node_id: nodeId, subnet_name: subnetName }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Failed to assign node`);
  }
  return res.json();
}

export async function assignSubnetAndNodeToPlanet(planetId: string, subnetName: string, nodeId?: string) {
  const base = getApiBase();
  // Use assign-subnet endpoint for subnet assignment (can include node_id)
  const params = new URLSearchParams();
  params.append("subnet_name", subnetName);
  if (nodeId) {
    params.append("node_id", nodeId);
  }
  const res = await fetch(`${base}/api/celestial-forge/planets/${planetId}/assign-subnet?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Failed to assign subnet`);
  }
  return res.json();
}

// Star System and Planet Interaction APIs
export async function listStarSystems(owner_wallet?: string) {
  const base = getApiBase();
  const url = owner_wallet 
    ? `${base}/api/celestial-forge/star-systems?owner=${owner_wallet}`
    : `${base}/api/celestial-forge/star-systems`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to list star systems`);
  return res.json();
}

export async function getStarSystem(system_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/star-systems/${system_id}`);
  if (!res.ok) throw new Error(`Failed to get star system`);
  return res.json();
}

export async function listPlanets(star_system_id?: string, owner_wallet?: string) {
  const base = getApiBase();
  const params = new URLSearchParams();
  if (star_system_id) params.append("star_system_id", star_system_id);
  if (owner_wallet) params.append("owner_wallet", owner_wallet);
  const url = `${base}/api/celestial-forge/planets${params.toString() ? "?" + params.toString() : ""}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    if (!res.ok) {
      // If backend is not available, return empty result instead of throwing
      if (res.status === 503 || res.status === 0) {
        console.debug("Backend not available, returning empty planets list");
        return { planets: [] };
      }
      throw new Error(`Failed to list planets: ${res.statusText}`);
    }
    return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return empty result
    if (error.name === "AbortError" || error.name === "TypeError") {
      console.debug("Backend not available, returning empty planets list");
      return { planets: [] };
    }
    throw error;
  }
}

export async function getPlanet(planet_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/planets/${planet_id}`);
  if (!res.ok) throw new Error(`Failed to get planet`);
  return res.json();
}

export async function updateStarSystemStatus(system_id: string, status: "active" | "deploying" | "inactive") {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/star-systems/${system_id}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update star system status`);
  return res.json();
}

export async function updatePlanetStatus(planet_id: string, status: "active" | "deploying" | "inactive") {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/planets/${planet_id}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update planet status`);
  return res.json();
}

export async function deployStarSystem(system_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/star-systems/${system_id}/deploy`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to deploy star system`);
  return res.json();
}

export async function deploySubnet(subnet_name: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/subnet/${subnet_name}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to deploy subnet");
  }
  return res.json();
}

export async function runSubnet(subnet_name: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/subnet/${subnet_name}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to run subnet");
  }
  return res.json();
}

export async function getForgeToolsStatus() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/tools-status`);
  if (!res.ok) throw new Error(`Failed to get tools status`);
  return res.json();
}

export async function getCelestialForgeStats() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/celestial-forge/stats`);
  if (!res.ok) throw new Error(`Failed to get celestial forge stats`);
  return res.json();
}

// Account Management APIs
export interface Account {
  id: string;
  name: string;
  wallet_address: string;
  type: "personal" | "cluster" | "joint" | "business" | "sub";
  parent_id?: string;
  owner_wallet: string;
  description?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members?: any[];
  business_details?: any;
  sub_accounts?: any[];
  balance?: any;
  wallet_key_name?: string; // Name of ChaosStar CLI key assigned to this account
}

export async function listAccounts(owner_wallet?: string, account_type?: string, include_inactive?: boolean) {
  const base = getApiBase();
  try {
    const params = new URLSearchParams();
    if (owner_wallet) params.append("owner_wallet", owner_wallet);
    if (account_type) params.append("account_type", account_type);
    if (include_inactive) params.append("include_inactive", "true");
    const url = `${base}/api/accounts${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    if (!res.ok) {
      // If backend is not available or Supabase not configured, return empty result instead of throwing
      if (res.status === 503 || res.status === 0) {
        const errorText = await res.text().catch(() => "");
        if (errorText.includes("Supabase not configured")) {
          console.debug("Supabase not configured, using blockchain-only mode for accounts");
        } else {
        console.debug("Backend not available, returning empty accounts list");
        }
        return { accounts: [] };
      }
      throw new Error(`Failed to list accounts: ${res.statusText}`);
    }
    return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return empty result
    if (error.name === "AbortError" || error.name === "TypeError") {
      console.debug("Backend not available, returning empty accounts list");
      return { accounts: [] };
    }
    throw error;
  }
}

export async function getAccount(account_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}`);
  if (!res.ok) throw new Error(`Failed to get account`);
  return res.json();
}

export async function createAccount(account: {
  name: string;
  wallet_address: string;
  type: "personal" | "cluster" | "joint" | "business" | "sub";
  parent_id?: string;
  owner_wallet: string;
  description?: string;
  metadata?: Record<string, any>;
  wallet_key_name?: string;
}) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!res.ok) {
    const t = await res.text();
    // If Supabase is not configured, that's okay - we're using blockchain
    if (res.status === 503 && t.includes("Supabase not configured")) {
      // Return a mock response for blockchain-only mode
      return {
        account: {
          id: "blockchain-only",
          name: account.name,
          wallet_address: account.wallet_address,
          type: account.type,
          owner_wallet: account.owner_wallet,
          description: account.description,
          message: "Account created on blockchain only. Supabase not configured."
        }
      };
    }
    throw new Error(t || "Failed to create account");
  }
  return res.json();
}

export async function updateAccount(account_id: string, updates: {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
  is_active?: boolean;
  wallet_key_name?: string;
}) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to update account");
  }
  return res.json();
}

export async function deleteAccount(account_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to delete account");
  }
  return res.json();
}

export async function addJointMember(account_id: string, member: { member_wallet: string; permissions: string[] }) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to add member");
  }
  return res.json();
}

export async function removeJointMember(account_id: string, member_wallet: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}/members/${member_wallet}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to remove member");
  }
  return res.json();
}

export async function setBusinessDetails(account_id: string, details: {
  business_name: string;
  registration_number?: string;
  tax_id?: string;
  business_type?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: Record<string, any>;
}) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}/business`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to set business details");
  }
  return res.json();
}

export async function createCluster(cluster: {
  name: string;
  owner_wallet: string;
  description?: string;
  account_ids: string[];
}) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/clusters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cluster),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to create cluster");
  }
  return res.json();
}

export async function listClusters(owner_wallet?: string) {
  const base = getApiBase();
  try {
    const url = owner_wallet
      ? `${base}/api/accounts/clusters?owner_wallet=${owner_wallet}`
      : `${base}/api/accounts/clusters`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    if (!res.ok) {
      // If backend is not available, return empty result instead of throwing
      if (res.status === 503 || res.status === 0) {
        console.debug("Backend not available, returning empty clusters list");
        return { clusters: [] };
      }
      throw new Error(`Failed to list clusters: ${res.statusText}`);
    }
    return res.json();
  } catch (error: any) {
    // Network errors or timeouts - return empty result
    if (error.name === "AbortError" || error.name === "TypeError") {
      console.debug("Backend not available, returning empty clusters list");
      return { clusters: [] };
    }
    throw error;
  }
}

export async function deleteCluster(cluster_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/clusters/${cluster_id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to delete cluster");
  }
  return res.json();
}

export async function linkSubAccount(link: {
  parent_account_id: string;
  child_account_id: string;
  relationship_type?: string;
}) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/sub-accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(link),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to link sub-account");
  }
  return res.json();
}

export async function getSubAccounts(account_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/${account_id}/sub-accounts`);
  if (!res.ok) throw new Error(`Failed to get sub-accounts`);
  return res.json();
}

export async function unlinkSubAccount(link_id: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/accounts/sub-accounts/${link_id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to unlink sub-account");
  }
  return res.json();
}

// ChaosStar CLI Info APIs (endpoints use avalanche-info for backend compatibility)
export async function listChaosStarSubnets() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/avalanche-info/subnets`);
  if (!res.ok) throw new Error(`Failed to list subnets`);
  return res.json();
}

export async function describeChaosStarSubnet(subnet_name: string) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/avalanche-info/subnet/${subnet_name}/describe`);
  if (!res.ok) throw new Error(`Failed to describe subnet`);
  return res.json();
}

export async function getChaosStarNetworkStatus() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/avalanche-info/network/status`);
  if (!res.ok) throw new Error(`Failed to get network status`);
  return res.json();
}

export async function listChaosStarKeys() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/avalanche-info/keys`);
  if (!res.ok) throw new Error(`Failed to list keys`);
  return res.json();
}

// Aliases for backward compatibility
export const listAvalancheSubnets = listChaosStarSubnets;
export const describeAvalancheSubnet = describeChaosStarSubnet;
export const getAvalancheNetworkStatus = getChaosStarNetworkStatus;
export const listAvalancheKeys = listChaosStarKeys;

export async function getSubnetStats(subnet_name: string, network?: string) {
  const base = getApiBase();
  const params = new URLSearchParams();
  if (network) params.append("network", network);
  const url = `${base}/api/avalanche-info/subnet/${subnet_name}/stats${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get subnet stats`);
  return res.json();
}

export async function getKeyBalance(key_name: string) {
  const base = getApiBase();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(`${base}/api/avalanche-info/keys/${key_name}/balance`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      // If backend returns error, return a structure indicating failure
      if (res.status === 404) {
        return { success: false, error: "Key not found" };
      }
      if (res.status === 503 || res.status === 0) {
        return { success: false, error: "Backend unavailable" };
      }
      const errorText = await res.text().catch(() => "Unknown error");
      return { success: false, error: errorText };
    }
    
    return res.json();
  } catch (error: any) {
    // Network errors or timeouts
    if (error.name === "AbortError") {
      return { success: false, error: "Request timeout" };
    }
    if (error.name === "TypeError") {
      return { success: false, error: "Backend unavailable" };
    }
    return { success: false, error: error.message || "Failed to get key balance" };
  }
}

export async function getKeyAddresses(key_name: string) {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/avalanche-info/keys/${key_name}/addresses`);
    if (!res.ok) throw new Error(`Failed to get key addresses`);
    return res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get key addresses" };
  }
}

export async function getCustomSubnetInfo() {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/avalanche-info/custom-subnet/info`);
    if (!res.ok) throw new Error(`Failed to get custom subnet info`);
    return res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get custom subnet info" };
  }
}

export async function getKeyPrivateKey(key_name: string) {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/avalanche-info/keys/${key_name}/private-key`);
    if (!res.ok) throw new Error(`Failed to get private key`);
    return res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get private key" };
  }
}

export async function getAllWalletBalances() {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/avalanche-info/wallets/balances`);
    if (!res.ok) throw new Error(`Failed to get wallet balances`);
    return res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get wallet balances", wallets: [] };
  }
}

// Registry API functions
export interface RegistryPlot {
  plotId: number;
  x: number;
  y: number;
  level: number;
  issued: boolean;
  price: string;
  planetId: string;
  owner?: string | null;
  balance?: string | null;
}

export interface PlotWithOwner extends RegistryPlot {
  wallet?: string | null; // Wallet that purchased the plot
}

export interface RegistryStats {
  totalPlots: number;
  issuedPlots: number;
  purchasedPlots: number;
}

export async function getRegistryStats(): Promise<RegistryStats> {
  const base = getRegistryApiBase();
  try {
    const res = await fetch(`${base}/registry/stats`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Failed to get registry stats`);
    return res.json();
  } catch (error: any) {
    throw new Error(`Failed to get registry stats: ${error.message}`);
  }
}

export async function getRegistryPlot(plotId: number): Promise<RegistryPlot> {
  const base = getRegistryApiBase();
  try {
    const res = await fetch(`${base}/registry/plot/${plotId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // If Registry API not available, return null instead of throwing
      const isConnectionError = res.status === 0 || 
                               res.status === 404 ||
                               res.status === 503;
      if (isConnectionError) {
        console.debug(`Registry API not available for plot ${plotId}`);
        throw new Error("Registry API not available");
      }
      throw new Error(`Failed to get plot ${plotId}: ${res.statusText}`);
    }
    return res.json();
  } catch (error: any) {
    // Check if it's a connection error
    const isConnectionError = error.name === "AbortError" || 
                             error.name === "TypeError" ||
                             error.message?.includes("Failed to fetch") ||
                             error.message?.includes("ERR_CONNECTION_REFUSED") ||
                             error.message?.includes("Registry API not available");
    if (isConnectionError) {
      console.debug(`Registry API not available for plot ${plotId}, will use contract fallback`);
      throw error; // Let caller handle fallback
    }
    throw new Error(`Failed to get plot ${plotId}: ${error.message}`);
  }
}

export async function getRegistryPlotsByOwner(address: string): Promise<number[]> {
  const base = getRegistryApiBase();
  try {
    const res = await fetch(`${base}/registry/owner/${address}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // If Registry API returns error, fall back to contract
      throw new Error(`Registry API returned ${res.status}`);
    }
    return res.json();
  } catch (error: any) {
    // Registry API not available - fall back to contract query
    const isConnectionError = error.name === "AbortError" || 
                             error.name === "TypeError" ||
                             error.message?.includes("Failed to fetch") ||
                             error.message?.includes("ERR_CONNECTION_REFUSED") ||
                             error.message?.includes("404");
    if (isConnectionError) {
      console.debug("Registry API not available, falling back to contract:", error.message);
      // Fall back to contract query
      const { fetchOwnedPlots } = await import("@/lib/plotUtils");
      return fetchOwnedPlots(address, 1000);
    }
    throw error;
  }
}

export async function getRegistryPlots(limit: number = 100, offset: number = 0): Promise<RegistryPlot[]> {
  const base = getRegistryApiBase();
  try {
    const res = await fetch(`${base}/registry/plots?limit=${limit}&offset=${offset}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Failed to get plots`);
    return res.json();
  } catch (error: any) {
    throw new Error(`Failed to get plots: ${error.message}`);
  }
}

export async function getRegistryPlotsWithOwners(
  limit: number = 100, 
  offset: number = 0, 
  addresses?: string[]
): Promise<PlotWithOwner[]> {
  const base = getRegistryApiBase();
  try {
    let url = `${base}/registry/plots/with-owners?limit=${limit}&offset=${offset}`;
    if (addresses && addresses.length > 0) {
      url += `&addresses=${addresses.join(',')}`;
    }
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Failed to get plots with owners`);
    return res.json();
  } catch (error: any) {
    throw new Error(`Failed to get plots with owners: ${error.message}`);
  }
}

export async function registerPlotToPortfolio(plotId: number, wallet: string, price?: string, txHash?: string): Promise<any> {
  const base = getRegistryApiBase();
  try {
    const params = new URLSearchParams();
    params.append("plot_id", plotId.toString());
    params.append("wallet", wallet);
    if (price) params.append("price", price);
    if (txHash) params.append("tx_hash", txHash);
    
    const res = await fetch(`${base}/registry/portfolio/register?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `Failed to register plot to portfolio`);
    }
    return res.json();
  } catch (error: any) {
    console.debug("Failed to register plot to portfolio via registry:", error.message);
    return null;
  }
}


