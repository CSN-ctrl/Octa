import { ethers } from "ethers";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";
import { isOnChainCryptoMode } from "@/lib/chain-network";
import {
  getPaymentLandContract,
  hasPaymentLandContract,
  loadPaymentContractAddresses,
} from "@/lib/payment-contracts";
import * as supabaseService from "@/lib/supabase-service";

export const CHAIN_LAND_SCAN_MAX_PLOT_ID = 200;

export interface ChainLandHoldings {
  mintedPlotIds: number[];
  pendingPlotIds: number[];
  salesActive: boolean;
  phase1PriceWei: bigint;
  contractOwner: string | null;
}

/** True when land sales/ownership are read and settled on-chain (not Supabase ledger). */
export function isOnChainLandMode(): boolean {
  return isOnChainCryptoMode() && hasPaymentLandContract();
}

/** Async: land sales on payment rail (1337). */
export async function isOnChainLandModeAsync(): Promise<boolean> {
  if (!isOnChainCryptoMode()) return false;
  await loadPaymentContractAddresses();
  return hasPaymentLandContract();
}

export function zoneTypeForPlotId(plotId: number): string {
  const coordX = (plotId % 100) - 50;
  const coordY = Math.floor(plotId / 100) - 50;
  const distance = Math.sqrt(coordX * coordX + coordY * coordY);
  if (distance < 5) return "Central District";
  if (distance < 15) return "Inner Ring - Commercial";
  if (distance < 25) return "Residential Zone";
  if (distance < 35) return "Mixed Use";
  if (distance < 45) return "Industrial Zone";
  return "Outer Frontier";
}

export function chainPlotIdToDashboardRow(plotId: number, ownerWallet: string) {
  const coordX = (plotId % 100) - 50;
  const coordY = Math.floor(plotId / 100) - 50;
  return {
    id: plotId,
    coord_x: coordX,
    coord_y: coordY,
    zone_type: zoneTypeForPlotId(plotId),
    booking_status: "purchased",
    owner_wallet: ownerWallet.toLowerCase(),
    source: "chain" as const,
  };
}

export function chainPlotIdsToDashboardRows(plotIds: number[], ownerWallet: string) {
  return plotIds.map((id) => chainPlotIdToDashboardRow(id, ownerWallet));
}

/** Merge Supabase plots with on-chain minted plots (by plot id). */
export function mergeDashboardPlots<T extends { id: number }>(
  supabasePlots: T[],
  chainRows: ReturnType<typeof chainPlotIdToDashboardRow>[]
): (T | ReturnType<typeof chainPlotIdToDashboardRow>)[] {
  const byId = new Map<number, T | ReturnType<typeof chainPlotIdToDashboardRow>>();
  for (const p of supabasePlots) byId.set(p.id, p);
  for (const row of chainRows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

export async function fetchChainLandHoldings(
  walletAddress: string
): Promise<ChainLandHoldings> {
  const empty: ChainLandHoldings = {
    mintedPlotIds: [],
    pendingPlotIds: [],
    salesActive: false,
    phase1PriceWei: 0n,
    contractOwner: null,
  };
  await loadPaymentContractAddresses();
  if (!hasPaymentLandContract() || !walletAddress) return empty;

  const contract = getPaymentLandContract();
  if (!contract) return empty;

  const [active, priceUsdc, owner] = await Promise.all([
    contract.salesActive().catch(() => false),
    contract.phase1PriceUSDC().catch(() => 0n),
    contract.owner().catch(() => null),
  ]);
  const price =
    priceUsdc > 0n ? priceUsdc : ethers.parseEther(getPlotPriceInXBGL().toString());

  const addr = walletAddress.toLowerCase();
  const minted: number[] = [];
  const pending: number[] = [];

  const checks = await Promise.all(
    Array.from({ length: CHAIN_LAND_SCAN_MAX_PLOT_ID }, (_, i) => i + 1).map(async (plotId) => {
      const [bal, buyer, mintedFlag] = await Promise.all([
        contract.balanceOf(walletAddress, plotId).catch(() => 0n),
        contract.pendingBuyer(plotId).catch(() => ethers.ZeroAddress),
        contract.plotMinted(plotId).catch(() => false),
      ]);
      return { plotId, bal, buyer, mintedFlag };
    })
  );

  for (const row of checks) {
    if (row.bal > 0n) minted.push(row.plotId);
    if (
      row.buyer &&
      row.buyer !== ethers.ZeroAddress &&
      row.buyer.toLowerCase() === addr &&
      !row.mintedFlag
    ) {
      pending.push(row.plotId);
    }
  }

  return {
    mintedPlotIds: minted,
    pendingPlotIds: pending,
    salesActive: active,
    phase1PriceWei: price,
    contractOwner: owner,
  };
}

/** Dashboard rows for plots paid on-chain but not yet activated. */
export function chainPendingPlotToDashboardRow(plotId: number, ownerWallet: string) {
  return {
    ...chainPlotIdToDashboardRow(plotId, ownerWallet),
    booking_status: "pending_activation",
  };
}

/**
 * Supabase plots (if any) merged with on-chain minted + pending holdings.
 */
export async function loadMergedOwnedPlots(
  ownerWallet?: string | null,
  ownerEmail?: string | undefined
): Promise<ReturnType<typeof chainPlotIdToDashboardRow>[]> {
  const chainOnlyPlots = isOnChainCryptoMode() && isOnChainLandMode();
  const supabasePlots =
    chainOnlyPlots || !(ownerWallet || ownerEmail)
      ? []
      : (await supabaseService.getPlots({
          ownerWallet: ownerWallet || undefined,
          ownerEmail,
        })) || [];

  if (!ownerWallet || !isOnChainLandMode()) {
    return supabasePlots as ReturnType<typeof chainPlotIdToDashboardRow>[];
  }

  const chain = await fetchChainLandHoldings(ownerWallet);
  const minted = chainPlotIdsToDashboardRows(chain.mintedPlotIds, ownerWallet);
  const pending = chain.pendingPlotIds.map((id) =>
    chainPendingPlotToDashboardRow(id, ownerWallet)
  );

  let merged = mergeDashboardPlots(supabasePlots, minted);
  merged = mergeDashboardPlots(merged, pending);
  return merged as ReturnType<typeof chainPlotIdToDashboardRow>[];
}
