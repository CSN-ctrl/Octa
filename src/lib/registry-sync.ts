/**
 * Registry Sync Functions
 * Syncs plot data from blockchain registry to local database
 */

import { db, PlotRegistry, PlotPurchase, initLocalDB } from "./local-db";

/**
 * Sync a single plot from registry to database
 */
export async function syncPlotFromRegistry(plotId: number): Promise<PlotRegistry | null> {
  try {
    // RPC provider removed - using Supabase only
    // Registry sync disabled - using Supabase as registry
    console.debug("Registry sync disabled - using Supabase only");
    return null;
  } catch (error: any) {
    console.error(`Failed to sync plot ${plotId} from registry:`, error);
    return null;
  }
}

/**
 * Sync multiple plots from registry (batch)
 */
export async function syncPlotsFromRegistry(plotIds: number[]): Promise<PlotRegistry[]> {
  const results: PlotRegistry[] = [];
  
  // Process in batches of 50 to avoid overwhelming the RPC
  const batchSize = 50;
  for (let i = 0; i < plotIds.length; i += batchSize) {
    const batch = plotIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(plotId => syncPlotFromRegistry(plotId))
    );
    results.push(...batchResults.filter((p): p is PlotRegistry => p !== null));
  }

  return results;
}

/**
 * Sync all plots from registry events
 */
export async function syncAllPlotsFromRegistry(): Promise<number> {
  try {
    // RPC provider removed - using Supabase only
    // Registry sync disabled - using Supabase as registry
    console.debug("Registry sync disabled - using Supabase only");
    return 0;
  } catch (error: any) {
    console.error("Failed to sync all plots from registry:", error);
    return 0;
  }
}

/**
 * Record a plot purchase in the database
 */
export async function recordPlotPurchase(
  plotId: number,
  buyerAddress: string,
  transactionHash: string,
  purchasePrice: bigint,
  currency: string = "xBGL",
  blockNumber?: number
): Promise<PlotPurchase | null> {
  try {
    // RPC provider removed - using Supabase only
    // Registry sync disabled - using Supabase as registry
    console.debug("Registry sync disabled - using Supabase only");
    void plotId;
    void buyerAddress;
    void transactionHash;
    void purchasePrice;
    void currency;
    void blockNumber;
    return null;
  } catch (error: any) {
    console.error(`Failed to record purchase for plot ${plotId}:`, error);
    return null;
  }
}

/**
 * Get all purchases for an address
 */
export async function getPurchasesByAddress(address: string): Promise<PlotPurchase[]> {
  try {
    // Ensure database is initialized
    if (!db.isOpen()) {
      await initLocalDB();
    }
    
    return await db.plotPurchases
      .where("buyer_address")
      .equals(address)
      .sortBy("timestamp");
  } catch (error: any) {
    // Handle database not initialized
    if (error.name === 'DexieError' || 
        error.message?.includes('not found') ||
        error.message?.includes('No such table')) {
      console.debug("Plot purchases table not initialized yet");
      return [];
    }
    console.error("Failed to get purchases by address:", error);
    return [];
  }
}

/**
 * Get all plots owned by an address (from registry)
 */
export async function getOwnedPlotsFromRegistry(address: string): Promise<PlotRegistry[]> {
  try {
    // Ensure database is initialized
    if (!db.isOpen()) {
      await initLocalDB();
    }
    
    // Dexie doesn't support .and() on where queries, use filter instead
    const plots = await db.plotRegistry
      .where("owner_address")
      .equals(address)
      .toArray();
    
    // Filter for purchased plots
    return plots.filter(plot => plot.purchased === true);
  } catch (error: any) {
    // Handle database not initialized or table doesn't exist
    if (error.name === 'DexieError' || 
        error.message?.includes('not found') ||
        error.message?.includes('No such table') ||
        error.message?.includes('Table does not exist')) {
      console.debug("Plot registry table not initialized yet:", error.message);
      return [];
    }
    console.error("Failed to get owned plots from registry:", error);
    return [];
  }
}

/**
 * Get available plots (not purchased)
 */
export async function getAvailablePlots(limit: number = 1000): Promise<PlotRegistry[]> {
  try {
    // Ensure database is initialized
    try {
      if (!db.isOpen()) {
        await initLocalDB();
      }
    } catch (initError: any) {
      // Database initialization failed - return empty array
      console.debug("Database initialization failed:", initError.message);
      return [];
    }
    
    // Check if table exists by trying to count records
    try {
      const count = await db.plotRegistry.count();
      if (count === 0) {
        // Table exists but is empty
        return [];
      }
    } catch (countError: any) {
      // Table doesn't exist or query failed
      console.debug("Plot registry table not available:", countError.message);
      return [];
    }
    
    const allPlots = await db.plotRegistry.toArray();
    const availablePlots = allPlots
      .filter((plot) => plot.purchased === false && plot.issued === true)
      .slice(0, limit);
    
    return availablePlots;
  } catch (error: any) {
    // Handle all database errors gracefully
    if (error.name === 'DexieError' || 
        error.name === 'DatabaseClosedError' ||
        error.message?.includes('not found') ||
        error.message?.includes('No such table') ||
        error.message?.includes('Table does not exist') ||
        error.message?.includes('Database not open')) {
      console.debug("Plot registry table not available:", error.message || error.name);
      return [];
    }
    // Log unexpected errors but still return empty array
    console.warn("Unexpected error getting available plots:", error.message || error);
    return [];
  }
}

/**
 * Get plot from registry by ID
 */
export async function getPlotFromRegistry(plotId: number): Promise<PlotRegistry | null> {
  try {
    // Ensure database is initialized
    if (!db.isOpen()) {
      await initLocalDB();
    }
    
    const plot = await db.plotRegistry.get(`plot_${plotId}`);
    if (plot) {
      return plot;
    }
    
    // If not in database, sync from blockchain
    return await syncPlotFromRegistry(plotId);
  } catch (error: any) {
    // Handle database not initialized
    if (error.name === 'DexieError' || 
        error.message?.includes('not found') ||
        error.message?.includes('No such table')) {
      console.debug(`Plot registry table not initialized, syncing plot ${plotId} from blockchain`);
      return await syncPlotFromRegistry(plotId);
    }
    console.error(`Failed to get plot ${plotId} from registry:`, error);
    return null;
  }
}

