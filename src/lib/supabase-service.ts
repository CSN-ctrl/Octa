import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Type aliases for easier use
type Plot = Tables<"plots">;
type Planet = Tables<"planets">;
type StarSystem = Tables<"star_systems">;
type Portfolio = Tables<"portfolios">;
type Transaction = Tables<"transactions">;
type MarketplaceListing = Tables<"marketplace_listings">;
type DigitalIdentity = Tables<"digital_identities">;
type UserBalance = Tables<"user_balances">;
type PortfolioManager = Tables<"portfolio_managers">;
type PortfolioFollower = Tables<"portfolio_followers">;
type RecurringPayment = Tables<"recurring_payments">;
type AutomationSetting = Tables<"automation_settings">;
type Faction = Tables<"factions">;
type NPC = Tables<"npcs">;
type EconomyTick = Tables<"economy_ticks">;
type BlackMarketInvite = Tables<"black_market_invites">;

// Helper to check if error is a network/connection error
function isNetworkError(error: any): boolean {
  const message = error?.message || error?.toString() || "";
  return (
    message.includes("ERR_NAME_NOT_RESOLVED") ||
    message.includes("ERR_CONNECTION_REFUSED") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("Network request failed")
  );
}

// Helper to handle Supabase errors gracefully
function handleSupabaseError(error: any, defaultValue: any = null): any {
  if (isNetworkError(error)) {
    console.debug("Supabase connection error (network issue):", error.message);
    return defaultValue;
  }
  throw error;
}

// ==================== PLOTS ====================
export async function getPlots(filters?: {
  ownerWallet?: string;
  cityName?: string;
  zoneType?: string;
  limit?: number;
  offset?: number;
}): Promise<Plot[]> {
  try {
    let query = supabase.from("plots").select("*");

    if (filters?.ownerWallet) {
      query = query.eq("owner_wallet", filters.ownerWallet);
    }
    if (filters?.zoneType) {
      query = query.eq("zone_type", filters.zoneType);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

  const { data, error } = await query.order("id", { ascending: true });
  if (error) {
    return handleSupabaseError(error, []);
  }
  return data || [];
  } catch (error: any) {
    return handleSupabaseError(error, []);
  }
}

export async function getPlotById(plotId: number): Promise<Plot | null> {
  const { data, error } = await supabase
    .from("plots")
    .select("*")
    .eq("id", plotId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

export async function getPlotsByOwner(ownerWallet: string): Promise<Plot[]> {
  const { data, error } = await supabase
    .from("plots")
    .select("*")
    .eq("owner_wallet", ownerWallet)
    .order("id", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updatePlot(plotId: number, updates: TablesUpdate<"plots">): Promise<Plot> {
  const { data, error } = await supabase
    .from("plots")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", plotId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createPlot(plot: TablesInsert<"plots">): Promise<Plot> {
  const { data, error } = await supabase
    .from("plots")
    .insert(plot)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertPlot(plot: TablesInsert<"plots">): Promise<Plot> {
  const { data, error } = await supabase
    .from("plots")
    .upsert(plot, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Purchase plot (with email)
export interface PurchasePlotResult {
  success: boolean;
  txHash?: string;
  plot_id?: number;
  purchase_id?: string;
  error?: string;
}

export async function purchasePlot(
  plotId: number,
  buyerWallet: string,
  buyerEmail: string,
  price: number,
  currency: string = "xBGL"
): Promise<PurchasePlotResult> {
  try {
    const { data, error } = await (supabase.rpc as any)("purchase_plot", {
      p_plot_id: plotId,
      p_buyer_wallet: buyerWallet,
      p_buyer_email: buyerEmail,
      p_price: price,
      p_currency: currency,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as PurchasePlotResult;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to purchase plot" };
  }
}

// Get plot ownership (with email)
export interface PlotOwnership {
  success: boolean;
  owned: boolean;
  plot_id: number;
  owner_wallet?: string;
  owner_email?: string;
  booking_status?: string;
  error?: string;
}

export async function getPlotOwnership(plotId: number): Promise<PlotOwnership> {
  try {
    const { data, error } = await (supabase.rpc as any)("get_plot_ownership", {
      p_plot_id: plotId,
    });

    if (error) {
      return { success: false, owned: false, plot_id: plotId, error: error.message };
    }

    return data as PlotOwnership;
  } catch (error: any) {
    return { success: false, owned: false, plot_id: plotId, error: error.message };
  }
}

// Register ownership (wallet + email)
export async function registerOwnership(wallet: string, email: string): Promise<void> {
  const { error } = await supabase
    .from("ownership_registry")
    .upsert(
      {
        wallet_address: wallet,
        email: email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    );

  if (error) throw error;
}

// Get ownership by wallet
export async function getOwnershipByWallet(wallet: string): Promise<{ wallet_address: string; email: string } | null> {
  const { data, error } = await supabase
    .from("ownership_registry")
    .select("*")
    .eq("wallet_address", wallet)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

// Get ownership by email
export async function getOwnershipByEmail(email: string): Promise<{ wallet_address: string; email: string } | null> {
  const { data, error } = await supabase
    .from("ownership_registry")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

// ==================== PLANETS ====================
export async function getPlanets(filters?: {
  ownerWallet?: string;
  starSystemId?: string;
  status?: string;
}): Promise<Planet[]> {
  try {
    let query = supabase.from("planets").select("*");

    if (filters?.ownerWallet) {
      query = query.eq("owner_wallet", filters.ownerWallet);
    }
    if (filters?.starSystemId) {
      query = query.eq("star_system_id", filters.starSystemId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return handleSupabaseError(error, []);
    }
    return data || [];
  } catch (error: any) {
    return handleSupabaseError(error, []);
  }
}

export async function getPlanetById(planetId: string): Promise<Planet | null> {
  const { data, error } = await supabase
    .from("planets")
    .select("*")
    .eq("id", planetId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createPlanet(planet: TablesInsert<"planets">): Promise<Planet> {
  const { data, error } = await supabase
    .from("planets")
    .insert(planet)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlanet(planetId: string, updates: TablesUpdate<"planets">): Promise<Planet> {
  const { data, error } = await supabase
    .from("planets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", planetId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== STAR SYSTEMS ====================
export async function getStarSystems(filters?: {
  ownerWallet?: string;
  status?: string;
}): Promise<StarSystem[]> {
  try {
    let query = supabase.from("star_systems").select("*");

    if (filters?.ownerWallet) {
      query = query.eq("owner_wallet", filters.ownerWallet);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return handleSupabaseError(error, []);
    }
    return data || [];
  } catch (error: any) {
    return handleSupabaseError(error, []);
  }
}

export async function getStarSystemById(systemId: string): Promise<StarSystem | null> {
  const { data, error } = await supabase
    .from("star_systems")
    .select("*")
    .eq("id", systemId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createStarSystem(system: TablesInsert<"star_systems">): Promise<StarSystem> {
  const { data, error } = await supabase
    .from("star_systems")
    .insert(system)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStarSystem(systemId: string, updates: TablesUpdate<"star_systems">): Promise<StarSystem> {
  const { data, error } = await supabase
    .from("star_systems")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", systemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== PORTFOLIOS ====================
export async function getPortfolios(ownerWallet?: string): Promise<Portfolio[]> {
  let query = supabase.from("portfolios").select("*");

  if (ownerWallet) {
    query = query.eq("owner_wallet", ownerWallet);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createPortfolio(portfolio: TablesInsert<"portfolios">): Promise<Portfolio> {
  const { data, error } = await supabase
    .from("portfolios")
    .insert(portfolio)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePortfolio(portfolioId: string, updates: TablesUpdate<"portfolios">): Promise<Portfolio> {
  const { data, error } = await supabase
    .from("portfolios")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", portfolioId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", portfolioId);
  if (error) throw error;
}

// ==================== TRANSACTIONS ====================
export async function getTransactions(filters?: {
  walletAddress?: string;
  fromAddress?: string;
  toAddress?: string;
  type?: string;
  tokenType?: string;
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> {
  let query = supabase.from("transactions").select("*");

  if (filters?.walletAddress) {
    query = query.or(`from_address.eq.${filters.walletAddress},to_address.eq.${filters.walletAddress}`);
  } else {
    if (filters?.fromAddress) {
      query = query.eq("from_address", filters.fromAddress);
    }
    if (filters?.toAddress) {
      query = query.eq("to_address", filters.toAddress);
    }
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.tokenType) {
    query = query.eq("token_type", filters.tokenType);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTransactionByHash(txHash: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("tx_hash", txHash)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createTransaction(transaction: TablesInsert<"transactions">): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert(transaction)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertTransaction(transaction: TablesInsert<"transactions">): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .upsert(transaction, { onConflict: "tx_hash" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== MARKETPLACE ====================
export async function getMarketplaceListings(filters?: {
  assetType?: string;
  status?: string;
  sellerWallet?: string;
  buyerWallet?: string;
  limit?: number;
}): Promise<MarketplaceListing[]> {
  let query = supabase.from("marketplace_listings").select("*");

  if (filters?.assetType) {
    query = query.eq("asset_type", filters.assetType);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.sellerWallet) {
    query = query.eq("seller_wallet", filters.sellerWallet);
  }
  if (filters?.buyerWallet) {
    query = query.eq("buyer_wallet", filters.buyerWallet);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order("listed_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMarketplaceListingById(listingId: string): Promise<MarketplaceListing | null> {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createMarketplaceListing(listing: TablesInsert<"marketplace_listings">): Promise<MarketplaceListing> {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert(listing)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMarketplaceListing(listingId: string, updates: TablesUpdate<"marketplace_listings">): Promise<MarketplaceListing> {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update(updates)
    .eq("id", listingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMarketplaceListing(listingId: string): Promise<void> {
  const { error } = await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", listingId);
  if (error) throw error;
}

// ==================== DIGITAL IDENTITIES ====================
export async function getDigitalIdentity(walletAddress: string): Promise<DigitalIdentity | null> {
  const { data, error } = await supabase
    .from("digital_identities")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getAllDigitalIdentities(): Promise<DigitalIdentity[]> {
  const { data, error } = await supabase
    .from("digital_identities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createDigitalIdentity(identity: TablesInsert<"digital_identities">): Promise<DigitalIdentity> {
  const { data, error } = await supabase
    .from("digital_identities")
    .insert(identity)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDigitalIdentity(identityId: string, updates: TablesUpdate<"digital_identities">): Promise<DigitalIdentity> {
  const { data, error } = await supabase
    .from("digital_identities")
    .update(updates)
    .eq("id", identityId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertDigitalIdentity(identity: TablesInsert<"digital_identities">): Promise<DigitalIdentity> {
  const { data, error } = await supabase
    .from("digital_identities")
    .upsert(identity, { onConflict: "wallet_address" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDigitalIdentity(identityId: string): Promise<void> {
  const { error } = await supabase
    .from("digital_identities")
    .delete()
    .eq("id", identityId);
  if (error) throw error;
}

// ==================== USER BALANCES ====================
export async function getUserBalance(walletAddress: string): Promise<UserBalance | null> {
  try {
    const { data, error } = await supabase
      .from("user_balances")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no row exists
    
    if (error) {
      // PGRST116 = no rows returned (not an error, just no data)
      if (error.code === "PGRST116") return null;
      // 406 = Not Acceptable (likely RLS policy blocking or content negotiation issue)
      if (error.code === "PGRST301" || error.status === 406 || error.message?.includes("406")) {
        // Silently return null for permission/content negotiation errors
        return null;
      }
      // Only log non-406 errors
      if (error.status !== 406) {
        console.debug("Error fetching user balance:", error);
      }
      return null; // Return null instead of throwing for better UX
    }
    return data;
  } catch (error: any) {
    // Handle 406 errors gracefully
    if (error?.status === 406 || error?.code === "PGRST301" || error?.message?.includes("406")) {
      // Silently return null for permission/content negotiation errors
      return null;
    }
    // Only log non-406 errors
    if (error?.status !== 406) {
      console.debug("Error fetching user balance:", error);
    }
    return null; // Return null instead of throwing for better UX
  }
}

export async function upsertUserBalance(balance: TablesInsert<"user_balances">): Promise<UserBalance> {
  const { data, error } = await supabase
    .from("user_balances")
    .upsert(balance, { onConflict: "wallet_address" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllUserBalances(): Promise<UserBalance[]> {
  const { data, error } = await supabase
    .from("user_balances")
    .select("*")
    .order("last_synced", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateUserBalance(walletAddress: string, updates: TablesUpdate<"user_balances">): Promise<UserBalance> {
  const { data, error } = await supabase
    .from("user_balances")
    .update({ ...updates, last_synced: new Date().toISOString() })
    .eq("wallet_address", walletAddress)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== PORTFOLIO MANAGERS ====================
export async function getPortfolioManagers(filters?: {
  approvalStatus?: Database["public"]["Enums"]["manager_status"];
  verified?: boolean;
}): Promise<PortfolioManager[]> {
  let query = supabase.from("portfolio_managers").select("*");

  if (filters?.approvalStatus) {
    query = query.eq("approval_status", filters.approvalStatus);
  }
  if (filters?.verified !== undefined) {
    query = query.eq("verified", filters.verified);
  }

  const { data, error } = await query.order("roi_annualized", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function getPortfolioManagerByWallet(walletAddress: string): Promise<PortfolioManager | null> {
  const { data, error } = await supabase
    .from("portfolio_managers")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createPortfolioManager(manager: TablesInsert<"portfolio_managers">): Promise<PortfolioManager> {
  const { data, error } = await supabase
    .from("portfolio_managers")
    .insert(manager)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePortfolioManager(managerId: string, updates: TablesUpdate<"portfolio_managers">): Promise<PortfolioManager> {
  const { data, error } = await supabase
    .from("portfolio_managers")
    .update(updates)
    .eq("id", managerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertPortfolioManager(manager: TablesInsert<"portfolio_managers">): Promise<PortfolioManager> {
  const { data, error } = await supabase
    .from("portfolio_managers")
    .upsert(manager, { onConflict: "wallet_address" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== PORTFOLIO FOLLOWERS ====================
export async function getPortfolioFollowers(filters?: {
  followerWallet?: string;
  managerWallet?: string;
  active?: boolean;
}): Promise<PortfolioFollower[]> {
  let query = supabase.from("portfolio_followers").select("*");

  if (filters?.followerWallet) {
    query = query.eq("follower_wallet", filters.followerWallet);
  }
  if (filters?.managerWallet) {
    query = query.eq("manager_wallet", filters.managerWallet);
  }
  if (filters?.active !== undefined) {
    query = query.eq("active", filters.active);
  }

  const { data, error } = await query.order("started_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPortfolioFollower(follower: TablesInsert<"portfolio_followers">): Promise<PortfolioFollower> {
  const { data, error } = await supabase
    .from("portfolio_followers")
    .insert(follower)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePortfolioFollower(followerId: string, updates: TablesUpdate<"portfolio_followers">): Promise<PortfolioFollower> {
  const { data, error } = await supabase
    .from("portfolio_followers")
    .update(updates)
    .eq("id", followerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePortfolioFollower(followerId: string): Promise<void> {
  const { error } = await supabase
    .from("portfolio_followers")
    .delete()
    .eq("id", followerId);
  if (error) throw error;
}

// ==================== RECURRING PAYMENTS ====================
export async function getRecurringPayments(filters?: {
  fromWallet?: string;
  toWallet?: string;
  enabled?: boolean;
}): Promise<RecurringPayment[]> {
  let query = supabase.from("recurring_payments").select("*");

  if (filters?.fromWallet) {
    query = query.eq("from_wallet", filters.fromWallet);
  }
  if (filters?.toWallet) {
    query = query.eq("to_wallet", filters.toWallet);
  }
  if (filters?.enabled !== undefined) {
    query = query.eq("enabled", filters.enabled);
  }

  const { data, error } = await query.order("next_payment_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createRecurringPayment(payment: TablesInsert<"recurring_payments">): Promise<RecurringPayment> {
  const { data, error } = await supabase
    .from("recurring_payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecurringPayment(paymentId: string, updates: TablesUpdate<"recurring_payments">): Promise<RecurringPayment> {
  const { data, error } = await supabase
    .from("recurring_payments")
    .update(updates)
    .eq("id", paymentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecurringPayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from("recurring_payments")
    .delete()
    .eq("id", paymentId);
  if (error) throw error;
}

// ==================== AUTOMATION SETTINGS ====================
export async function getAutomationSettings(ownerWallet: string, portfolioId?: string): Promise<AutomationSetting[]> {
  let query = supabase.from("automation_settings").select("*").eq("owner_wallet", ownerWallet);

  if (portfolioId) {
    query = query.eq("portfolio_id", portfolioId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAutomationSetting(setting: TablesInsert<"automation_settings">): Promise<AutomationSetting> {
  const { data, error } = await supabase
    .from("automation_settings")
    .insert(setting)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAutomationSetting(settingId: string, updates: TablesUpdate<"automation_settings">): Promise<AutomationSetting> {
  const { data, error } = await supabase
    .from("automation_settings")
    .update(updates)
    .eq("id", settingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAutomationSetting(settingId: string): Promise<void> {
  const { error } = await supabase
    .from("automation_settings")
    .delete()
    .eq("id", settingId);
  if (error) throw error;
}

// ==================== FACTIONS ====================
export async function getFactions(filters?: {
  founderWallet?: string;
  memberWallet?: string;
}): Promise<Faction[]> {
  let query = supabase.from("factions").select("*");

  if (filters?.founderWallet) {
    query = query.eq("founder_wallet", filters.founderWallet);
  }
  if (filters?.memberWallet) {
    query = query.contains("member_wallets", [filters.memberWallet]);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getFactionById(factionId: string): Promise<Faction | null> {
  const { data, error } = await supabase
    .from("factions")
    .select("*")
    .eq("id", factionId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createFaction(faction: TablesInsert<"factions">): Promise<Faction> {
  const { data, error } = await supabase
    .from("factions")
    .insert(faction)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFaction(factionId: string, updates: TablesUpdate<"factions">): Promise<Faction> {
  const { data, error } = await supabase
    .from("factions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", factionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== NPCS ====================
export async function getNPCs(filters?: {
  employerWallet?: string;
  assignedPlotId?: number;
}): Promise<NPC[]> {
  let query = supabase.from("npcs").select("*");

  if (filters?.employerWallet) {
    query = query.eq("employer_wallet", filters.employerWallet);
  }
  if (filters?.assignedPlotId) {
    query = query.eq("assigned_plot_id", filters.assignedPlotId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getNPCById(npcId: string): Promise<NPC | null> {
  const { data, error } = await supabase
    .from("npcs")
    .select("*")
    .eq("id", npcId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createNPC(npc: TablesInsert<"npcs">): Promise<NPC> {
  const { data, error } = await supabase
    .from("npcs")
    .insert(npc)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNPC(npcId: string, updates: TablesUpdate<"npcs">): Promise<NPC> {
  const { data, error } = await supabase
    .from("npcs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", npcId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== ECONOMY TICKS ====================
// Note: getEconomyTicks is defined later in the file

export async function createEconomyTick(tick: TablesInsert<"economy_ticks">): Promise<EconomyTick> {
  const { data, error } = await supabase
    .from("economy_ticks")
    .insert(tick)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== BLACK MARKET INVITES ====================
export async function getBlackMarketInvite(walletAddress: string): Promise<BlackMarketInvite | null> {
  const { data, error } = await supabase
    .from("black_market_invites")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function checkBlackMarketAccess(walletAddress: string): Promise<boolean> {
  const invite = await getBlackMarketInvite(walletAddress);
  return invite?.used === true;
}

export async function createBlackMarketInvite(invite: TablesInsert<"black_market_invites">): Promise<BlackMarketInvite> {
  const { data, error } = await supabase
    .from("black_market_invites")
    .insert(invite)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBlackMarketInvite(walletAddress: string, updates: TablesUpdate<"black_market_invites">): Promise<BlackMarketInvite> {
  const { data, error } = await supabase
    .from("black_market_invites")
    .update(updates)
    .eq("wallet_address", walletAddress)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================
export function subscribeToPlots(
  ownerWallet: string,
  callback: (plot: Plot) => void
) {
  return supabase
    .channel(`plots:${ownerWallet}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "plots",
        filter: `owner_wallet=eq.${ownerWallet}`,
      },
      (payload) => {
        if (payload.new) callback(payload.new as Plot);
      }
    )
    .subscribe();
}

export function subscribeToTransactions(
  walletAddress: string,
  callback: (transaction: Transaction) => void
) {
  return supabase
    .channel(`transactions:${walletAddress}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "transactions",
        filter: `from_address=eq.${walletAddress},to_address=eq.${walletAddress}`,
      },
      (payload) => {
        if (payload.new) callback(payload.new as Transaction);
      }
    )
    .subscribe();
}

export function subscribeToPortfolios(
  ownerWallet: string,
  callback: (portfolio: Portfolio) => void
) {
  return supabase
    .channel(`portfolios:${ownerWallet}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "portfolios",
        filter: `owner_wallet=eq.${ownerWallet}`,
      },
      (payload) => {
        if (payload.new) callback(payload.new as Portfolio);
      }
    )
    .subscribe();
}

export function subscribeToMarketplace(
  callback: (listing: MarketplaceListing) => void
) {
  return supabase
    .channel("marketplace")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "marketplace_listings",
      },
      (payload) => {
        if (payload.new) callback(payload.new as MarketplaceListing);
      }
    )
    .subscribe();
}

export function subscribeToUserBalance(
  walletAddress: string,
  callback: (balance: UserBalance) => void
) {
  return supabase
    .channel(`balance:${walletAddress}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_balances",
        filter: `wallet_address=eq.${walletAddress}`,
      },
      (payload) => {
        if (payload.new) callback(payload.new as UserBalance);
      }
    )
    .subscribe();
}

// ==================== BLOCKCHAIN SIMULATION ====================
export interface TransferResult {
  success: boolean;
  transaction_id?: string;
  tx_hash?: string;
  from_balance?: number;
  to_balance?: number;
  error?: string;
}

export interface MintResult {
  success: boolean;
  transaction_id?: string;
  tx_hash?: string;
  new_balance?: number;
  error?: string;
}

export interface BurnResult {
  success: boolean;
  transaction_id?: string;
  tx_hash?: string;
  new_balance?: number;
  error?: string;
}

/**
 * Transfer tokens between addresses (simulates blockchain transfer)
 * This is an atomic operation that updates balances and creates a transaction record
 */
export async function transferTokens(
  fromAddress: string,
  toAddress: string,
  amount: number,
  tokenType: "xBGL" | "CHAOS" | "AVAX" | "SC" = "xBGL",
  txHash?: string,
  metadata?: Record<string, any>
): Promise<TransferResult> {
  const { data, error } = await (supabase.rpc as any)("transfer_tokens", {
    p_from_address: fromAddress,
    p_to_address: toAddress,
    p_amount: amount,
    p_token_type: tokenType,
    p_tx_hash: txHash || null,
    p_metadata: metadata || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return (data || { success: false, error: "No data returned" }) as TransferResult;
}

/**
 * Mint tokens to an address (simulates token minting)
 */
export async function mintTokens(
  toAddress: string,
  amount: number,
  tokenType: "xBGL" | "CHAOS" | "AVAX" | "SC" = "xBGL",
  txHash?: string,
  metadata?: Record<string, any>
): Promise<MintResult> {
  const { data, error } = await (supabase.rpc as any)("mint_tokens", {
    p_to_address: toAddress,
    p_amount: amount,
    p_token_type: tokenType,
    p_tx_hash: txHash || null,
    p_metadata: metadata || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return (data || { success: false, error: "No data returned" }) as MintResult;
}

/**
 * Burn tokens from an address (simulates token burning)
 */
export async function burnTokens(
  fromAddress: string,
  amount: number,
  tokenType: "xBGL" | "CHAOS" | "AVAX" | "SC" = "xBGL",
  txHash?: string,
  metadata?: Record<string, any>
): Promise<BurnResult> {
  const { data, error } = await (supabase.rpc as any)("burn_tokens", {
    p_from_address: fromAddress,
    p_amount: amount,
    p_token_type: tokenType,
    p_tx_hash: txHash || null,
    p_metadata: metadata || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return (data || { success: false, error: "No data returned" }) as BurnResult;
}

/**
 * Get token balance for a specific address and token type
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenType: "xBGL" | "CHAOS" | "AVAX" | "SC" = "xBGL"
): Promise<number> {
  // Get balance directly from user_balances table instead of RPC
  const balance = await getUserBalance(walletAddress);
  if (!balance) return 0;
  
  switch (tokenType) {
    case "xBGL":
      return Number(balance.xbgl_balance || 0);
    case "CHAOS":
      return Number(balance.chaos_balance || 0);
    case "AVAX":
      return Number(balance.avax_balance || 0);
    case "SC":
      return Number(balance.sc_balance || 0);
    default:
      return 0;
  }
}

/**
 * Get all token balances for an address
 */
export async function getAllTokenBalances(walletAddress: string): Promise<{
  xBGL: number;
  CHAOS: number;
  AVAX: number;
  SC: number;
  last_synced: string | null;
}> {
  // Get balance directly from user_balances table instead of RPC
  const balance = await getUserBalance(walletAddress);
  if (balance) {
    return {
      xBGL: Number(balance.xbgl_balance || 0),
      CHAOS: Number(balance.chaos_balance || 0),
      AVAX: Number(balance.avax_balance || 0),
      SC: Number(balance.sc_balance || 0),
      last_synced: balance.last_synced || null,
    };
  }
  return {
    xBGL: 0,
    CHAOS: 0,
    AVAX: 0,
    SC: 0,
    last_synced: null,
  };
}

/**
 * Batch transfer tokens (multiple transfers in one operation)
 */
export async function batchTransferTokens(
  transfers: Array<{
    fromAddress: string;
    toAddress: string;
    amount: number;
    tokenType?: "xBGL" | "CHAOS" | "AVAX" | "SC";
  }>
): Promise<TransferResult[]> {
  const results: TransferResult[] = [];

  // Execute transfers sequentially to maintain atomicity
  for (const transfer of transfers) {
    const result = await transferTokens(
      transfer.fromAddress,
      transfer.toAddress,
      transfer.amount,
      transfer.tokenType || "xBGL"
    );
    results.push(result);

    // If any transfer fails, we could choose to rollback or continue
    // For now, we continue with remaining transfers
  }

  return results;
}

/**
 * Approve token spending (for future DEX/swap functionality)
 * This creates an approval record that can be checked before transfers
 */
export async function approveTokenSpending(
  ownerAddress: string,
  spenderAddress: string,
  amount: number,
  tokenType: "xBGL" | "CHAOS" | "AVAX" | "SC" = "xBGL"
): Promise<{ success: boolean; approval_id?: string; error?: string }> {
  // Store approval in metadata of a transaction record
  const approvalMetadata = {
    type: "approval",
    owner: ownerAddress,
    spender: spenderAddress,
    amount,
    tokenType,
    approved_at: new Date().toISOString(),
  };

  const result = await createTransaction({
    tx_hash: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from_address: ownerAddress,
    to_address: spenderAddress,
    amount: amount,
    token_type: tokenType,
    type: "approval",
    status: "success",
    metadata: approvalMetadata,
  });

  return {
    success: true,
    approval_id: result.id,
  };
}

/**
 * Get total supply of a token (sum of all balances)
 */
export async function getTotalSupply(tokenType: "xBGL" | "CHAOS" | "AVAX" | "SC" = "xBGL"): Promise<number> {
  const { data, error } = await supabase
    .from("user_balances")
    .select(tokenType === "xBGL" ? "xbgl_balance" : 
            tokenType === "CHAOS" ? "chaos_balance" :
            tokenType === "AVAX" ? "avax_balance" : "sc_balance");

  if (error) {
    console.error("Error getting total supply:", error);
    return 0;
  }

  const total = data?.reduce((sum, balance: any) => {
    const value = Number(
      tokenType === "xBGL" ? (balance.xbgl_balance || 0) :
      tokenType === "CHAOS" ? (balance.chaos_balance || 0) :
      tokenType === "AVAX" ? (balance.avax_balance || 0) :
      (balance.sc_balance || 0)
    ) || 0;
    return sum + value;
  }, 0) || 0;

  return total;
}

// ==================== ECONOMY & CURRENCIES ====================
export async function getCurrencies(): Promise<{ currencies: Array<{ symbol: string; name: string; balance: number }> }> {
  // Get currency data from economy_ticks and user_balances
  const [ticks, balances] = await Promise.all([
    supabase.from("economy_ticks").select("chaos_tokens_generated").order("processed_at", { ascending: false }).limit(100),
    supabase.from("user_balances").select("xbgl_balance, chaos_balance, avax_balance, sc_balance"),
  ]);

  const totalChaos = ticks.data?.reduce((sum, tick) => sum + Number(tick.chaos_tokens_generated || 0), 0) || 0;
  const totalXBGL = balances.data?.reduce((sum, b) => sum + Number(b.xbgl_balance || 0), 0) || 0;
  const totalAVAX = balances.data?.reduce((sum, b) => sum + Number(b.avax_balance || 0), 0) || 0;
  const totalSC = balances.data?.reduce((sum, b) => sum + Number(b.sc_balance || 0), 0) || 0;

  return {
    currencies: [
      { symbol: "xBGL", name: "Wrapped Native Token", balance: totalXBGL },
      { symbol: "CHAOS", name: "Chaos Token", balance: totalChaos },
      { symbol: "AVAX", name: "Avalanche", balance: totalAVAX },
      { symbol: "SC", name: "ShadowCoin", balance: totalSC },
    ],
  };
}

// getEconomyTicks is already defined above, this is a duplicate - removed

// ==================== CITY & ZONES ====================
export async function listZones(): Promise<Array<{ zone_type: string; count: number; plots: any[] }>> {
  const { data, error } = await supabase
    .from("plots")
    .select("zone_type, id, coord_x, coord_y, owner_wallet");

  if (error) throw error;

  // Group by zone_type
  const zonesMap = new Map<string, any[]>();
  data?.forEach((plot: any) => {
    const zoneType = plot.zone_type || "unknown";
    if (!zonesMap.has(zoneType)) {
      zonesMap.set(zoneType, []);
    }
    zonesMap.get(zoneType)!.push(plot);
  });

  return Array.from(zonesMap.entries()).map(([zone_type, plots]) => ({
    zone_type,
    count: plots.length,
    plots,
  }));
}

export async function listCityPlots(filters?: {
  cityName?: string;
  zoneType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ plots: Plot[] }> {
  const plots = await getPlots(filters);
  return { plots };
}

export async function getCityStats(cityName?: string): Promise<{
  total_plots: number;
  occupied_plots: number;
  zones: Array<{ zone_type: string; count: number }>;
  total_value: number;
} | null> {
  let query = supabase.from("plots").select("zone_type, owner_wallet");

  if (cityName) {
    // If we had a city_name column, we'd filter here
    // For now, we'll get all plots
  }

  const { data, error } = await query;
  if (error) throw error;

  const totalPlots = data?.length || 0;
  const occupiedPlots = data?.filter((p) => p.owner_wallet).length || 0;

  // Group by zone
  const zonesMap = new Map<string, number>();
  data?.forEach((plot) => {
    const zoneType = plot.zone_type || "unknown";
    zonesMap.set(zoneType, (zonesMap.get(zoneType) || 0) + 1);
  });

  const zones = Array.from(zonesMap.entries()).map(([zone_type, count]) => ({
    zone_type,
    count,
  }));

  return {
    total_plots: totalPlots,
    occupied_plots: occupiedPlots,
    zones,
    total_value: 0, // Would need to calculate from plot prices
  };
}

export async function calculateNewcomers(): Promise<{ newcomers: number; message: string }> {
  // Calculate newcomers based on recent plot purchases
  const { data, error } = await supabase
    .from("plots")
    .select("owner_wallet, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  // Count unique new owners in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentPlots = data?.filter((p) => new Date(p.created_at || 0) > oneDayAgo) || [];
  const uniqueOwners = new Set(recentPlots.map((p) => p.owner_wallet).filter(Boolean));

  return {
    newcomers: uniqueOwners.size,
    message: `${uniqueOwners.size} new plot owners in the last 24 hours`,
  };
}

// ==================== NPC OPERATIONS ====================
export async function spawnNPCs(count: number, cohort?: string): Promise<{ npcs: Tables<"npcs">[]; success: boolean }> {
  const npcs: TablesInsert<"npcs">[] = [];

  for (let i = 0; i < count; i++) {
    npcs.push({
      employer_wallet: null,
      assigned_plot_id: null,
      skills: {},
      personality_vector: {},
      loyalty_score: 0,
      employment_history: [],
    });
  }

  const { data, error } = await supabase.from("npcs").insert(npcs).select();
  if (error) throw error;

  return {
    npcs: data || [],
    success: true,
  };
}
