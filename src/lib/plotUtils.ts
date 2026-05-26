/**
 * Utility functions for fetching plot data
 */

import { ethers } from "ethers";
import { getLandContract, hasLandContract } from "./contracts";
import {
  CHAIN_LAND_SCAN_MAX_PLOT_ID,
  fetchChainLandHoldings,
} from "./chain-land-holdings";

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
    const scanMax = Math.min(maxPlots, CHAIN_LAND_SCAN_MAX_PLOT_ID);
    const holdings = await fetchChainLandHoldings(address);
    return holdings.mintedPlotIds.filter((id) => id <= scanMax).sort((a, b) => a - b);
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
    const scanMax = Math.min(maxPlots, CHAIN_LAND_SCAN_MAX_PLOT_ID);
    const holdings = await fetchChainLandHoldings(address);
    const contract = getLandContract();
    if (!contract) return [];

    const plotIds = [
      ...new Set([
        ...holdings.mintedPlotIds,
        ...holdings.pendingPlotIds,
      ]),
    ].filter((id) => id <= scanMax);

    const ownedPlots: OwnedPlot[] = await Promise.all(
      plotIds.map(async (plotId) => {
        const balance = await contract.balanceOf(address, plotId).catch(() => 0n);
        return {
          plotId,
          balance,
          pending: holdings.pendingPlotIds.includes(plotId),
        };
      })
    );

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

