/**
 * Registry Sync Functions
 * Syncs plot data from blockchain registry to local database
 */

import { ethers } from "ethers";
import { db, PlotRegistry, PlotPurchase, generateId, initLocalDB } from "./local-db";
// RPC provider removed - using Supabase only
import { getPlotRegistryContract } from "./contracts";

/**
 * Sync a single plot from registry to database
 */
export async function syncPlotFromRegistry(plotId: number): Promise<PlotRegistry | null> {
  try {
    // RPC provider removed - using Supabase only
    // Registry sync disabled - using Supabase as registry
    console.debug("Registry sync disabled - using Supabase only");
    return null;

    const contract = getPlotRegistryContract();
    if (!contract) {
      console.debug("Plot registry contract not available");
      return null;
    }

    // Fetch plot metadata from contract
    const metadata = await contract.getPlotMetadata(plotId);
    const isPurchased = await contract.isPlotPurchased(plotId);

    // Try to get owner address if purchased
    let ownerAddress: string | undefined;
    if (isPurchased) {
      // For ERC1155, we need to check balanceOf for known addresses
      // This is a limitation - we can't easily get owner without checking all addresses
      // We'll leave it undefined and update it when we detect a purchase
    }

    const plotData: PlotRegistry = {
      id: `plot_${plotId}`,
      plot_id: plotId,
      x: Number(metadata.x),
      y: Number(metadata.y),
      level: Number(metadata.level),
      issued: metadata.issued,
      purchased: isPurchased,
      price: metadata.price.toString(),
      price_formatted: Number(ethers.formatEther(metadata.price)),
      planet_id: metadata.planetId,
      owner_address: ownerAddress,
      last_synced: new Date().toISOString(),
      metadata: {
        raw: {
          x: metadata.x.toString(),
          y: metadata.y.toString(),
          level: metadata.level.toString(),
          issued: metadata.issued,
          price: metadata.price.toString(),
          planetId: metadata.planetId,
        }
      }
    };

    // Upsert to database
    await db.plotRegistry.put(plotData);

    return plotData;
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

    const contract = getPlotRegistryContract();
    if (!contract) {
      console.debug("Plot registry contract not available");
      return 0;
    }

    // Get total plots
    const totalPlots = await contract.totalPlots();
    const totalCount = Number(totalPlots);

    console.log(`Syncing ${totalCount} plots from registry...`);

    // Query PlotIssued events to get all issued plots
    const filter = contract.filters.PlotIssued();
    const events = await contract.queryFilter(filter, 0, "latest");
    
    const plotIds = new Set<number>();
    events.forEach((event) => {
      if (event.args && event.args.plotId) {
        plotIds.add(Number(event.args.plotId));
      }
    });

    // Also check TransferSingle events for purchased plots
    const transferFilter = contract.filters.TransferSingle();
    const transferEvents = await contract.queryFilter(transferFilter, 0, "latest");
    transferEvents.forEach((event) => {
      if (event.args && event.args.id) {
        plotIds.add(Number(event.args.id));
      }
    });

    const uniquePlotIds = Array.from(plotIds).sort((a, b) => a - b);
    console.log(`Found ${uniquePlotIds.length} unique plots from events`);

    // Sync all plots
    const synced = await syncPlotsFromRegistry(uniquePlotIds);
    console.log(`Synced ${synced.length} plots to database`);

    return synced.length;
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
    return null;

    const contract = getPlotRegistryContract();
    if (!contract) {
      console.debug("Plot registry contract not available");
      return null;
    }

    // Get plot metadata
    const metadata = await contract.getPlotMetadata(plotId);
    
    // Get transaction details
    let timestamp = new Date().toISOString();
    if (blockNumber) {
      try {
        const block = await provider.getBlock(blockNumber);
        if (block) {
          timestamp = new Date(block.timestamp * 1000).toISOString();
        }
      } catch (error) {
        console.debug("Could not get block timestamp:", error);
      }
    }

    const purchase: PlotPurchase = {
      id: generateId("purchase"),
      plot_id: plotId,
      buyer_address: buyerAddress,
      purchase_price: purchasePrice.toString(),
      purchase_price_formatted: Number(ethers.formatEther(purchasePrice)),
      currency,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      timestamp,
      coordinates: {
        x: Number(metadata.x),
        y: Number(metadata.y),
      },
      planet_id: metadata.planetId,
      level: Number(metadata.level),
      metadata: {
        raw: {
          x: metadata.x.toString(),
          y: metadata.y.toString(),
          level: metadata.level.toString(),
          price: purchasePrice.toString(),
          planetId: metadata.planetId,
        }
      }
    };

    // Save purchase record
    await db.plotPurchases.add(purchase);

    // Update registry entry
    const registryEntry: PlotRegistry = {
      id: `plot_${plotId}`,
      plot_id: plotId,
      x: Number(metadata.x),
      y: Number(metadata.y),
      level: Number(metadata.level),
      issued: metadata.issued,
      purchased: true,
      price: purchasePrice.toString(),
      price_formatted: Number(ethers.formatEther(purchasePrice)),
      planet_id: metadata.planetId,
      owner_address: buyerAddress,
      last_synced: new Date().toISOString(),
      metadata: {
        purchase_transaction: transactionHash,
        purchase_timestamp: timestamp,
      }
    };

    await db.plotRegistry.put(registryEntry);

    return purchase;
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
    
    // Dexie doesn't support .and() on where queries, use filter instead
    const allPlots = await db.plotRegistry
      .where("purchased")
      .equals(false)
      .toArray();
    
    // Filter for issued plots
    const availablePlots = allPlots
      .filter(plot => plot.issued === true)
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

