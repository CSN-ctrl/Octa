/**
 * Manual deposit assets supported on Avalanche (C-Chain / local 1337).
 * Wallet one-click swap is AVAX-only; other assets use treasury address + manual flow.
 */

export type AvalancheDepositAssetId =
  | "avax"
  | "usdc"
  | "btc"
  | "eth"
  | "xmr"
  | "xrp"
  | "sol";

export interface AvalancheDepositAsset {
  id: AvalancheDepositAssetId;
  /** Display symbol (e.g. USDC, BTC) */
  symbol: string;
  label: string;
  /** Instant wallet deposit via treasury AVAX swap */
  supportsWalletDeposit: boolean;
}

export const AVALANCHE_DEPOSIT_ASSETS: readonly AvalancheDepositAsset[] = [
  {
    id: "avax",
    symbol: "AVAX",
    label: "Avalanche (AVAX)",
    supportsWalletDeposit: true,
  },
  {
    id: "usdc",
    symbol: "USDC",
    label: "USD Coin (USDC)",
    supportsWalletDeposit: false,
  },
  {
    id: "btc",
    symbol: "BTC",
    label: "Bitcoin (BTC)",
    supportsWalletDeposit: false,
  },
  {
    id: "eth",
    symbol: "ETH",
    label: "Ethereum (ETH)",
    supportsWalletDeposit: false,
  },
  {
    id: "xmr",
    symbol: "XMR",
    label: "Monero (XMR)",
    supportsWalletDeposit: false,
  },
  {
    id: "xrp",
    symbol: "XRP",
    label: "Ripple (XRP)",
    supportsWalletDeposit: false,
  },
  {
    id: "sol",
    symbol: "SOL",
    label: "Solana (SOL)",
    supportsWalletDeposit: false,
  },
] as const;

export function getAvalancheDepositAsset(
  id: string,
): AvalancheDepositAsset | undefined {
  return AVALANCHE_DEPOSIT_ASSETS.find((asset) => asset.id === id);
}

export const DEFAULT_AVALANCHE_DEPOSIT_ASSET_ID: AvalancheDepositAssetId = "avax";
