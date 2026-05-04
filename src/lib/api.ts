// Simplified API - All functions use Supabase only
// Backend API calls removed - using Supabase exclusively

export interface BackendPlot {
  wallet: string;
  token_id: string | number;
  metadata?: any;
}

// Fetch plots from Supabase
export async function fetchPlots(address: string): Promise<BackendPlot[]> {
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
    const { logger } = await import("@/lib/logger");
    logger.debug("Failed to fetch plots from Supabase:", error.message);
    return [];
  }
}

// Save plot to Supabase
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
    const { logger } = await import("@/lib/logger");
    logger.debug("Failed to save plot to Supabase:", error.message);
  }
}

// Pending purchases - now using Supabase plot_purchases table
export interface PendingPurchase {
  plotId: number;
  buyer: string;
  amount: number;
  paymentToken: string;
  timestamp: number;
}

export async function fetchPendingPurchases(): Promise<PendingPurchase[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("plot_purchases")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      const { logger } = await import("@/lib/logger");
      logger.debug("Failed to fetch pending purchases:", error.message);
      return [];
    }

    return (data || []).map((purchase) => ({
      plotId: purchase.plot_id,
      buyer: purchase.buyer_wallet,
      amount: Number(purchase.purchase_price),
      paymentToken: purchase.currency || "xBGL",
      timestamp: new Date(purchase.created_at ?? 0).getTime(),
    }));
  } catch (error: any) {
    const { logger } = await import("@/lib/logger");
    logger.debug("Failed to fetch pending purchases:", error.message);
    return [];
  }
}

// Activate plot - now using Supabase purchase_plot function
export async function activatePlot(plotId: number, recipient?: string): Promise<{ txHash: string; status: number }> {
  try {
    // This function is deprecated - use purchasePlot from supabase-service instead
    // Keeping for backward compatibility
    const { logger } = await import("@/lib/logger");
    logger.warn("activatePlot is deprecated, use purchasePlot from supabase-service");
    return { txHash: "", status: 0 };
  } catch (error: any) {
    throw new Error(`Activation failed: ${error.message}`);
  }
}

// Registry API functions - all use Supabase
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
  wallet?: string | null;
}

export interface RegistryStats {
  totalPlots: number;
  issuedPlots: number;
  purchasedPlots: number;
}

export async function getRegistryStats(): Promise<RegistryStats> {
  try {
    const { getPlots } = await import("@/lib/supabase-service");
    const allPlots = await getPlots();
    
    return {
      totalPlots: allPlots.length,
      issuedPlots: allPlots.filter(p => p.owner_wallet).length,
      purchasedPlots: allPlots.filter(p => p.owner_wallet && p.booking_status === 'purchased').length,
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
      level: 1,
      issued: !!plot.owner_wallet,
      price: "0",
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
    
    if (addresses && addresses.length > 0) {
      plots = plots.filter(p => p.owner_wallet && addresses.includes(p.owner_wallet));
    }
    
    return plots
      .filter(p => p.owner_wallet)
      .map(plot => ({
        plotId: plot.id,
        owner: plot.owner_wallet!,
        wallet: plot.owner_wallet!,
        x: plot.coord_x || 0,
        y: plot.coord_y || 0,
        level: 1,
        issued: true,
        price: "0",
        planetId: plot.planet_id || "",
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
    
    await updatePlot(plotId, {
      owner_wallet: wallet,
      metadata_cid: txHash || plot.metadata_cid,
    });
    
    return { success: true, plotId, wallet };
  } catch (error: any) {
    const { logger } = await import("@/lib/logger");
    logger.debug("Failed to register plot to portfolio:", error.message);
    return null;
  }
}

// Avalanche Subnet API functions (stubs for backward compatibility)
export interface AvalancheSubnet {
  name: string;
  subnet_id?: string;
  blockchain_id?: string;
  rpc_url?: string;
}

export interface AvalancheSubnetsResponse {
  subnets: AvalancheSubnet[];
}

export async function listAvalancheSubnets(): Promise<AvalancheSubnetsResponse> {
  // Stub function - returns empty list since we're using Supabase
  // This maintains backward compatibility with SubnetContext
  return {
    subnets: [
      {
        name: "ChaosStarNetwork",
        blockchain_id: "ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy",
        rpc_url: "http://127.0.0.1:24362/ext/bc/ChaosStar/rpc",
      },
    ],
  };
}

export interface AvalancheSubnetDetails {
  name: string;
  subnet_id?: string;
  blockchain_id?: string;
  rpc_url?: string;
  chain_id?: number;
}

export async function describeAvalancheSubnet(subnetName: string): Promise<AvalancheSubnetDetails> {
  // Stub function - returns default ChaosStar network info
  return {
    name: subnetName,
    blockchain_id: "ZgQsbJYPaujPcQpF6k8Kfw1GRpnwoaAfVkf435C4R2MRBXLgy",
    rpc_url: "http://127.0.0.1:24362/ext/bc/ChaosStar/rpc",
    chain_id: 8088,
  };
}

/** Wallet list for admin / diagnostics (Supabase-only stack — empty by default). */
export async function getAllWalletBalances(): Promise<{
  success: boolean;
  rpc_url?: string;
  total_wallets?: number;
  total_balance?: string;
  wallets?: Array<{
    address: string;
    name: string;
    source: "avalanche_cli" | "database";
    balance: string;
    balance_wei: string;
    csn_balance?: string;
    isMainFunded?: boolean;
    account_id?: string;
    account_type?: string;
    error?: string;
  }>;
  error?: string;
}> {
  return { success: true, wallets: [] };
}

/** Custom subnet metadata for settings UI (stub). */
export async function getCustomSubnetInfo(): Promise<{
  success: boolean;
  error?: string;
  subnet_name?: string;
  rpc_url?: string;
  custom_subnet_id?: string;
  avalanche_subnet_id?: string;
  avalanche_blockchain_id?: string;
}> {
  return {
    success: true,
    subnet_name: "ChaosStarNetwork",
    rpc_url: "http://127.0.0.1:24362/ext/bc/ChaosStar/rpc",
  };
}

/** City plot list from backend (stub — use Supabase getPlots in UI when needed). */
export async function listCityPlots(): Promise<{ plots: BackendPlot[] }> {
  return { plots: [] };
}

/** Re-export city stats from Supabase service for `@/lib/api` consumers. */
export async function getCityStats(cityName?: string) {
  const { getCityStats: fromDb } = await import("@/lib/supabase-service");
  return fromDb(cityName);
}

// ---------------------------------------------------------------------------
// Compatibility exports (Supabase-first stack — stubs and thin wrappers)
// ---------------------------------------------------------------------------

export interface Account {
  id: string;
  name: string;
  wallet_address: string;
  type?: string;
  owner_wallet?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  wallet_key_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function listAccounts(_wallet: string): Promise<{ accounts: Account[] }> {
  return { accounts: [] };
}

export async function createAccount(_body: Partial<Account>): Promise<{ id: string }> {
  return { id: "stub-account" };
}

export async function listClusters(_wallet: string): Promise<{ clusters: unknown[] }> {
  return { clusters: [] };
}

export async function updateAccount(_id: string, _updates: unknown): Promise<void> {}

export async function deleteAccount(_id: string): Promise<void> {}

export function getApiBase(): string {
  const base = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL;
  return (base || "").replace(/\/+$/, "") || "http://localhost:5001";
}

export async function getTreasury(): Promise<{
  balances?: Record<string, string | number>;
  exchange_rates?: Record<string, number>;
}> {
  return { balances: {}, exchange_rates: {} };
}

export async function upsertPortfolio(_payload: {
  wallet: string;
  holdings?: unknown[];
  recurring_investment_monthly?: number;
  manager_id?: string | null;
  portfolio_type?: string;
}): Promise<void> {}

export async function getPortfolio(_wallet: string): Promise<{ holdings?: unknown[] } | null> {
  return { holdings: [] };
}

export async function listNpcs(): Promise<{ npcs: unknown[] }> {
  return { npcs: [] };
}

export async function spawnNpcs(_count?: number, _kind?: string): Promise<{ ok: boolean }> {
  void _count;
  void _kind;
  return { ok: false };
}

export async function listZones(): Promise<{ zones: Record<string, unknown> }> {
  return { zones: {} };
}

export async function listFactions(): Promise<{ factions: unknown[] }> {
  return { factions: [] };
}

export async function listPlanets(_systemId?: string): Promise<{ planets: unknown[] }> {
  return { planets: [] };
}

export async function getPlanet(_id: string): Promise<unknown | null> {
  return null;
}

export async function updatePlanetStatus(
  _planetId: string,
  _status: "active" | "deploying" | "inactive"
): Promise<void> {}
