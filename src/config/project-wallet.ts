/**
 * Main project treasury EOA — manual deposits, hot-wallet fallbacks, and ledger fund flows.
 * On-chain AVAX→xBGL uses the SaraktTreasury contract (VITE_TREASURY_ADDRESS), not this wallet.
 */
export const PROJECT_WALLET =
  import.meta.env.VITE_PROJECT_WALLET?.toString().trim() ||
  "0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33";

export const PROJECT_WALLET_LOWER = PROJECT_WALLET.toLowerCase();
