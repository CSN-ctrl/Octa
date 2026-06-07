/**
 * Payment rail profiles.
 *
 * Phase 1 default: fuji-testnet — AVAX deposits on Avalanche Fuji (43113),
 * settled via on-chain treasury.
 *
 * Phase 2 (disabled): mainnet-usdc — USDC deposits on supported EVM mainnets,
 * settled via ingest-treasury-deposits edge function.
 * Enable by setting VITE_MAINNET_USDC_RAIL=true once the backend is ready.
 */

export type PaymentRailId = "fuji-testnet" | "mainnet-usdc";

export interface PaymentRail {
  /** Unique identifier for this rail. */
  id: PaymentRailId;
  /** Chain IDs accepted by this rail. */
  chainIds: number[];
  /** Native deposit asset on this rail. */
  nativeAsset: "AVAX" | "USDC";
  /** How treasury crediting is handled. */
  treasuryMode: "on-chain" | "ingest-treasury-deposits";
  /** Whether the rail is enabled in the current build. */
  enabled: boolean;
}

const FUJI_RAIL: PaymentRail = {
  id: "fuji-testnet",
  chainIds: [43113],
  nativeAsset: "AVAX",
  treasuryMode: "on-chain",
  enabled: true,
};

const MAINNET_USDC_RAIL: PaymentRail = {
  id: "mainnet-usdc",
  chainIds: [1, 43114, 137, 56, 42161, 10, 8453],
  nativeAsset: "USDC",
  treasuryMode: "ingest-treasury-deposits",
  enabled: import.meta.env.VITE_MAINNET_USDC_RAIL?.toString().toLowerCase() === "true",
};

export const PAYMENT_RAILS: PaymentRail[] = [FUJI_RAIL, MAINNET_USDC_RAIL];

/** Returns the currently active payment rail (fuji-testnet by default). */
export function getActivePaymentRail(): PaymentRail {
  return FUJI_RAIL;
}

/**
 * True when the mainnet USDC deposit rail is enabled.
 * Disabled by default in Phase 1; enable via VITE_MAINNET_USDC_RAIL=true.
 */
export function isMainnetUsdcRailEnabled(): boolean {
  return MAINNET_USDC_RAIL.enabled;
}

/** True when on the Fuji testnet rail (default Phase 1 state). */
export function isFujiRailActive(): boolean {
  return getActivePaymentRail().id === "fuji-testnet";
}
