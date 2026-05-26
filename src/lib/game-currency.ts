/**
 * Game economy display rules:
 * - Prices, balances, and land checkout: xBGL
 * - Acquire xBGL: pay AVAX on chain 1337 (/deposit), credited as xBGL
 */

export const GAME_CURRENCY_SYMBOL = "xBGL";
export const XBGL_ACQUISITION_SYMBOL = "AVAX";

/** True when a stored token_type / symbol refers to in-game xBGL (any legacy casing). */
export function isXbglTokenType(tokenType?: string | null): boolean {
  if (!tokenType) return false;
  const key = tokenType.trim().toLowerCase();
  return key === "xbgl" || key === "csn";
}

/** Always render xBGL with correct branding in UI copy. */
export function displayTokenSymbol(tokenType?: string | null): string {
  if (!tokenType || isXbglTokenType(tokenType)) return GAME_CURRENCY_SYMBOL;
  return tokenType;
}

export const GAME_CURRENCY_COPY = {
  landPrice: "All land prices are shown in xBGL.",
  acquire: "Pay AVAX on Deposit to receive xBGL, then spend xBGL on plots.",
  insufficient: "Insufficient xBGL — deposit AVAX on /deposit first.",
} as const;
