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

// Registry API removed - using Supabase as registry

export async function fetchPlots(address: string): Promise<BackendPlot[]> {
  // Use Supabase as the only source (registry)
  try {
    const { getPlotsByOwner } = await import("@/lib/supabase-service");
    const plots = await getPlotsByOwner(address);
    return plots.map((plot) => ({
      wallet: address,
      token_id: plot.id,
      metadata: {
        plotId: plot.id,
        x: plot.coord_x,
        y: plot.coord_y,
        zoneType: plot.zone_type,
        owner: address,
        source: "supabase"
      }
    }));
  } catch (error: any) {
    console.debug("Failed to fetch plots from Supabase:", error.message);
    return [];
  }
}

export async function savePlot(wallet: string, tokenId: number | string, metadata: any): Promise<void> {
  try {
    const { upsertPlot } = await import("@/lib/supabase-service");
    await upsertPlot({
      id: Number(tokenId),
      owner_wallet: wallet,
      coord_x: metadata.x || metadata.coord_x || 0,
      coord_y: metadata.y || metadata.coord_y || 0,
      zone_type: metadata.zoneType || metadata.zone_type || null,
      metadata_cid: metadata.metadata_cid || null,
    });
  } catch (error: any) {
    // Don't throw - Supabase might not be available, but plot is still on blockchain
    console.debug("Failed to save plot to Supabase:", error.message);
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
  const { getCurrencies: getCurrenciesFromSupabase } = await import("@/lib/supabase-service");
  return getCurrenciesFromSupabase();
}

export async function getTreasury() {
  const { getAllUserBalances, getTotalSupply } = await import("@/lib/supabase-service");
  const balances = await getAllUserBalances();
  const [xBGL, CHAOS, AVAX, SC] = await Promise.all([
    getTotalSupply("xBGL"),
    getTotalSupply("CHAOS"),
    getTotalSupply("AVAX"),
    getTotalSupply("SC"),
  ]);
  
  return {
    balances: {
      xBGL: { balance: xBGL, symbol: "xBGL" },
      CHAOS: { balance: CHAOS, symbol: "CHAOS" },
      AVAX: { balance: AVAX, symbol: "AVAX" },
      SC: { balance: SC, symbol: "SC" },
    },
    total_value: xBGL + CHAOS + AVAX + SC,
  };
}

// NPC APIs
export async function listNpcs() {
  const { getNPCs } = await import("@/lib/supabase-service");
  const npcs = await getNPCs();
  return { npcs };
}

export async function spawnNpcs(count: number, cohort?: string) {
  const { spawnNPCs } = await import("@/lib/supabase-service");
  return spawnNPCs(count, cohort);
}

// City APIs
export async function listZones() {
  const { listZones: listZonesFromSupabase } = await import("@/lib/supabase-service");
  return listZonesFromSupabase();
}

export async function listCityPlots(limit?: number, offset?: number) {
  const { listCityPlots: listCityPlotsFromSupabase } = await import("@/lib/supabase-service");
  return listCityPlotsFromSupabase({ limit, offset });
}

export async function getCityStats(cityName?: string) {
  const { getCityStats: getCityStatsFromSupabase } = await import("@/lib/supabase-service");
  return getCityStatsFromSupabase(cityName);
}

export async function calculateNewcomers() {
  const { calculateNewcomers: calculateNewcomersFromSupabase } = await import("@/lib/supabase-service");
  return calculateNewcomersFromSupabase();
}

// Governance APIs
export async function listFactions() {
  const { getFactions } = await import("@/lib/supabase-service");
  const factions = await getFactions();
  return { factions };
}

export async function getBlackMarket() {
  const { checkBlackMarketAccess } = await import("@/lib/supabase-service");
  // Return black market status - would need wallet address from context
  return { 
    accessible: false, // Will be checked per wallet
    message: "Black market access requires invite"
  };
}

// Portfolio APIs
export async function getPortfolio(wallet: string, portfolioType?: "primary" | "secondary") {
  try {
    const { getPortfolios } = await import("@/lib/supabase-service");
    const portfolios = await getPortfolios(wallet);
    if (portfolios && portfolios.length > 0) {
      const portfolio = portfolios.find(p => p.status === 'active') || portfolios[0];
      return {
        wallet,
        portfolio: {
          id: portfolio.id,
          name: portfolio.name,
          owner_wallet: portfolio.owner_wallet,
          current_value: Number(portfolio.current_value || 0),
          holdings: [], // Would need to join with plots or other assets
        },
        portfolio_type: portfolioType || "primary",
      };
    }
    return null;
  } catch (error: any) {
    console.debug("Supabase not available for portfolio:", error.message);
    return null;
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
  try {
    const { getPortfolios, createPortfolio, updatePortfolio } = await import("@/lib/supabase-service");
    const portfolios = await getPortfolios(input.wallet);
    const portfolioType = input.portfolio_type || "primary";
    
    const totalValue = (input.holdings || []).reduce((sum, h) => sum + (h.cost_basis || 0), 0);
    const existing = portfolios.find(p => p.status === 'active');
    
    if (existing) {
      const updated = await updatePortfolio(existing.id, {
        current_value: totalValue,
        auto_reinvest_enabled: input.recurring_investment_monthly ? true : false,
      });
      return {
        success: true,
        portfolio: updated,
      };
    } else {
      const created = await createPortfolio({
        name: `${portfolioType} Portfolio`,
        owner_wallet: input.wallet,
        initial_investment: totalValue,
        current_value: totalValue,
        status: 'active',
        risk_level: 'moderate',
      });
      return {
        success: true,
        portfolio: created,
      };
    }
  } catch (error: any) {
    console.error("Failed to save portfolio to Supabase:", error);
    throw error;
  }
  
  // Return format
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
  const { getStarSystems } = await import("@/lib/supabase-service");
  const systems = await getStarSystems(owner_wallet);
  return { star_systems: systems };
}

export async function getStarSystem(system_id: string) {
  const { getStarSystemById } = await import("@/lib/supabase-service");
  const system = await getStarSystemById(system_id);
  if (!system) {
    throw new Error(`Star system not found: ${system_id}`);
  }
  return { success: true, star_system: system };
}

export async function listPlanets(star_system_id?: string, owner_wallet?: string) {
  const { getPlanets } = await import("@/lib/supabase-service");
  const filters: any = {};
  if (star_system_id) filters.starSystemId = star_system_id;
  if (owner_wallet) filters.ownerWallet = owner_wallet;
  const planets = await getPlanets(filters);
  return { planets };
}

export async function getPlanet(planet_id: string) {
  const { getPlanetById } = await import("@/lib/supabase-service");
  const planet = await getPlanetById(planet_id);
  if (!planet) {
    throw new Error(`Planet not found: ${planet_id}`);
  }
  return { success: true, planet };
}

export async function updateStarSystemStatus(system_id: string, status: "active" | "deploying" | "inactive") {
  const { updateStarSystem } = await import("@/lib/supabase-service");
  const updated = await updateStarSystem(system_id, { status });
  return { success: true, star_system: updated };
}

export async function updatePlanetStatus(planet_id: string, status: "active" | "deploying" | "inactive") {
  const { updatePlanet } = await import("@/lib/supabase-service");
  const updated = await updatePlanet(planet_id, { status });
  return { success: true, planet: updated };
}

export async function deployStarSystem(system_id: string) {
  const { updateStarSystem } = await import("@/lib/supabase-service");
  const updated = await updateStarSystem(system_id, { status: "deploying" });
  return { success: true, message: "Deployment initiated", star_system: updated };
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
  try {
    const { getPlots, getTotalSupply } = await import("@/lib/supabase-service");
    const allPlots = await getPlots();
    const totalSupply = await getTotalSupply("xBGL");
    
    return {
      totalPlots: allPlots.length,
      issuedPlots: allPlots.filter(p => p.owner_wallet).length,
      purchasedPlots: allPlots.filter(p => p.owner_wallet).length,
    };
  } catch (error: any) {
    throw new Error(`Failed to get registry stats: ${error.message}`);
  }
}

export async function getRegistryPlot(plotId: number): Promise<RegistryPlot> {
  try {
    const { getPlotById } = await import("@/lib/supabase-service");
    const plot = await getPlotById(plotId);
    if (!plot) {
      throw new Error(`Plot ${plotId} not found`);
    }
    
    return {
      plotId: plot.id,
      x: plot.coord_x || 0,
      y: plot.coord_y || 0,
      level: 1, // Default level
      issued: !!plot.owner_wallet,
      price: "0", // Price stored in plots table if needed
      planetId: plot.planet_id || "",
      owner: plot.owner_wallet || "",
    };
  } catch (error: any) {
    throw new Error(`Failed to get plot ${plotId}: ${error.message}`);
  }
}

export async function getRegistryPlotsByOwner(address: string): Promise<number[]> {
  try {
    const { getPlotsByOwner } = await import("@/lib/supabase-service");
    const plots = await getPlotsByOwner(address);
    return plots.map(p => p.id);
  } catch (error: any) {
    throw new Error(`Failed to get plots: ${error.message}`);
  }
}

export async function getRegistryPlots(limit: number = 100, offset: number = 0): Promise<RegistryPlot[]> {
  try {
    const { getPlots } = await import("@/lib/supabase-service");
    const plots = await getPlots({ limit, offset });
    return plots.map(plot => ({
      plotId: plot.id,
      x: plot.coord_x || 0,
      y: plot.coord_y || 0,
      level: 1,
      issued: !!plot.owner_wallet,
      price: "0",
      planetId: plot.planet_id || "",
      owner: plot.owner_wallet || "",
    }));
  } catch (error: any) {
    throw new Error(`Failed to get plots: ${error.message}`);
  }
}

export async function getRegistryPlotsWithOwners(
  limit: number = 100, 
  offset: number = 0, 
  addresses?: string[]
): Promise<PlotWithOwner[]> {
  try {
    const { getPlots } = await import("@/lib/supabase-service");
    let plots = await getPlots({ limit, offset });
    
    // Filter by addresses if provided
    if (addresses && addresses.length > 0) {
      plots = plots.filter(p => p.owner_wallet && addresses.includes(p.owner_wallet));
    }
    
    return plots
      .filter(p => p.owner_wallet)
      .map(plot => ({
        plotId: plot.id,
        owner: plot.owner_wallet!,
        x: plot.coord_x || 0,
        y: plot.coord_y || 0,
      }));
  } catch (error: any) {
    throw new Error(`Failed to get plots with owners: ${error.message}`);
  }
}

export async function registerPlotToPortfolio(plotId: number, wallet: string, price?: string, txHash?: string): Promise<any> {
  try {
    const { getPlotById, updatePlot } = await import("@/lib/supabase-service");
    const plot = await getPlotById(plotId);
    if (!plot) {
      throw new Error(`Plot ${plotId} not found`);
    }
    
    // Update plot with portfolio registration info
    await updatePlot(plotId, {
      owner_wallet: wallet,
      metadata_cid: txHash || plot.metadata_cid,
    });
    
    return { success: true, plotId, wallet };
  } catch (error: any) {
    console.debug("Failed to register plot to portfolio:", error.message);
    return null;
  }
}


