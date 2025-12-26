/**
 * Utility functions for fetching plot data
 */

import { ethers } from "ethers";
import { getLandContract, hasLandContract } from "./contracts";
import { getRpcProvider } from "./wallet";

export interface OwnedPlot {
  plotId: number;
  balance: bigint;
  pending?: boolean;
}

/**
 * Fetch all plots owned by an address
 * @param address - The address to check
 * @param maxPlots - Maximum number of plots to check (default: 1000)
 * @returns Array of plot IDs owned by the address
 */
export async function fetchOwnedPlots(
  address: string,
  maxPlots: number = 1000
): Promise<number[]> {
  if (!address || !ethers.isAddress(address)) {
    throw new Error("Invalid address");
  }

  if (!hasLandContract()) {
    console.debug("Land contract not available");
    return [];
  }

  try {
    // Check if RPC provider is available first
    const provider = getRpcProvider();
    if (!provider) {
      console.debug("RPC provider not available");
      return [];
    }
    
    const contract = getLandContract();
    if (!contract) {
      console.debug("Contract instance is null");
      return [];
    }

    // First, try to get total plots to know the range
    let totalPlots = maxPlots;
    try {
      const total = await contract.TOTAL_PLOTS();
      totalPlots = Math.min(Number(total), maxPlots);
    } catch (error) {
      console.debug("Could not get TOTAL_PLOTS, using default:", error);
    }

    const ownedPlots: number[] = [];
    const batchSize = 100;

    // Check ownership in batches
    for (let i = 1; i <= totalPlots; i += batchSize) {
      const ids = Array.from(
        { length: Math.min(batchSize, totalPlots - i + 1) },
        (_, idx) => i + idx
      );
      const accounts = new Array(ids.length).fill(address);

      try {
        const balances = await contract.balanceOfBatch(accounts, ids);
        balances.forEach((balance: bigint, index: number) => {
          if (balance > 0n) {
            ownedPlots.push(ids[index]);
          }
        });
      } catch (error: any) {
        // Check if this is an RPC connection error (expected when node isn't running)
        const isRpcError = error?.message?.includes('404') || 
                          error?.message?.includes('Not Found') ||
                          error?.code === 'NETWORK_ERROR' ||
                          error?.code === 'SERVER_ERROR' ||
                          error?.status === 404;
        
        if (isRpcError) {
          // RPC node not available - this is expected if local node isn't running
          console.debug("RPC node not available, skipping plot checks");
          return [];
        }
        
        // If batch fails, try individual checks
        console.debug(`Batch check failed for plots ${i}-${i + batchSize - 1}, trying individual:`, error.message);
        for (const plotId of ids) {
          try {
            const balance = await contract.balanceOf(address, plotId);
            if (balance > 0n) {
              ownedPlots.push(plotId);
            }
          } catch (individualError: any) {
            // Check if individual call also failed due to RPC
            const isIndividualRpcError = individualError?.message?.includes('404') || 
                                         individualError?.message?.includes('Not Found') ||
                                         individualError?.code === 'NETWORK_ERROR';
            if (isIndividualRpcError) {
              // RPC not available, stop trying
              return [];
            }
            // Skip this plot for other errors
          }
        }
      }
    }

    return ownedPlots.sort((a, b) => a - b);
  } catch (error) {
    console.error("Failed to fetch owned plots:", error);
    return [];
  }
}

/**
 * Fetch plots with detailed information (balance, pending status)
 * @param address - The address to check
 * @param maxPlots - Maximum number of plots to check (default: 1000)
 * @returns Array of owned plots with details
 */
export async function fetchOwnedPlotsDetailed(
  address: string,
  maxPlots: number = 1000
): Promise<OwnedPlot[]> {
  if (!address || !ethers.isAddress(address)) {
    throw new Error("Invalid address");
  }

  if (!hasLandContract()) {
    console.debug("Land contract not available");
    return [];
  }

  try {
    const contract = getLandContract();
    if (!contract) {
      return [];
    }

    const ownedPlots: OwnedPlot[] = [];
    const batchSize = 100;

    // Check ownership in batches
    for (let i = 1; i <= maxPlots; i += batchSize) {
      const ids = Array.from(
        { length: Math.min(batchSize, maxPlots - i + 1) },
        (_, idx) => i + idx
      );
      const accounts = new Array(ids.length).fill(address);

      try {
        const balances = await contract.balanceOfBatch(accounts, ids);
        balances.forEach((balance: bigint, index: number) => {
          if (balance > 0n) {
            ownedPlots.push({
              plotId: ids[index],
              balance,
            });
          }
        });
      } catch (error: any) {
        // Check if this is an RPC connection error
        const isRpcError = error?.message?.includes('404') || 
                          error?.message?.includes('Not Found') ||
                          error?.code === 'NETWORK_ERROR' ||
                          error?.status === 404;
        
        if (isRpcError) {
          // RPC node not available - return what we have so far
          console.debug("RPC node not available, returning partial results");
          return ownedPlots.sort((a, b) => a.plotId - b.plotId);
        }
        
        console.debug(`Failed to check plots ${i}-${i + batchSize - 1}:`, error);
        // Continue with next batch
      }
    }

    // Check for pending purchases
    for (const plot of ownedPlots) {
      try {
        const pendingBuyer = await contract.pendingBuyer(plot.plotId);
        const isMinted = await contract.plotMinted(plot.plotId);
        if (pendingBuyer && pendingBuyer.toLowerCase() === address.toLowerCase() && !isMinted) {
          plot.pending = true;
        }
      } catch (error) {
        // Skip if check fails
      }
    }

    return ownedPlots.sort((a, b) => a.plotId - b.plotId);
  } catch (error) {
    console.error("Failed to fetch owned plots:", error);
    return [];
  }
}

/**
 * Check if an address owns a specific plot
 * @param address - The address to check
 * @param plotId - The plot ID to check
 * @returns Balance of the plot (0 if not owned)
 */
export async function checkPlotOwnership(
  address: string,
  plotId: number
): Promise<bigint> {
  if (!address || !ethers.isAddress(address)) {
    throw new Error("Invalid address");
  }

  if (!hasLandContract()) {
    return 0n;
  }

  try {
    // Check if RPC provider is available first
    const provider = getRpcProvider();
    if (!provider) {
      return 0n;
    }
    
    const contract = getLandContract();
    if (!contract) {
      return 0n;
    }

    const balance = await contract.balanceOf(address, plotId);
    return balance;
  } catch (error: any) {
    // Check if this is an RPC connection error (expected when node isn't running)
    const isRpcError = error?.message?.includes('404') || 
                      error?.message?.includes('Not Found') ||
                      error?.code === 'NETWORK_ERROR' ||
                      error?.status === 404;
    
    if (isRpcError) {
      // RPC node not available - this is expected
      console.debug(`RPC node not available for plot ${plotId} ownership check`);
      return 0n;
    }
    
    console.error(`Failed to check ownership of plot ${plotId}:`, error);
    return 0n;
  }
}

