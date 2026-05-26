/**
 * Currency Conversion Utility
 * Converts various cryptocurrencies to xBGL using EUR as intermediate
 * Exchange rate: 1 EUR = 1.955833 xBGL
 */

// Exchange rates to EUR (approximate - should be updated with real-time rates from API)
// USDC/USDT/DAI are pegged to USD, not EUR, so we need USD/EUR conversion
// Current approximate rates (as of late 2024):
// - 1 USD ≈ 0.92 EUR (EUR/USD ≈ 1.09)
// - 1 USDC = 1 USD (stablecoin pegged)
// So: 1 USDC ≈ 0.92 EUR

let USD_TO_EUR_RATE = 0.92; // 1 USD = 0.92 EUR (update with real-time rate)

const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  // Stablecoins (pegged to USD)
  'USDC': 1.0,  // 1 USDC = 1 USD
  'USDT': 1.0,  // 1 USDT = 1 USD
  'DAI': 1.0,   // 1 DAI ≈ 1 USD (slight variations possible)
  
  // Native tokens (approximate rates - should be fetched from API)
  'ETH': 3000.0,   // 1 ETH ≈ 3000 USD (update with real rate)
  'MATIC': 0.85,   // 1 MATIC ≈ 0.85 USD (update with real rate)
  'AVAX': 25.0,    // override via updateExchangeRate / API
  
  // Default fallback
  'DEFAULT': 1.0,
};

// xBGL conversion rate
const EUR_TO_XBGL = 1.955833; // 1 EUR = 1.955833 xBGL

/**
 * Get exchange rate for a token to USD
 */
export function getTokenToUSDRate(tokenType: string): number {
  const tokenUpper = tokenType.toUpperCase();
  
  // Check exact match first
  if (EXCHANGE_RATES_TO_USD[tokenUpper]) {
    return EXCHANGE_RATES_TO_USD[tokenUpper];
  }
  
  // Check partial matches
  for (const [key, rate] of Object.entries(EXCHANGE_RATES_TO_USD)) {
    if (tokenUpper.includes(key) || key.includes(tokenUpper)) {
      return rate;
    }
  }
  
  // Default fallback
  return EXCHANGE_RATES_TO_USD.DEFAULT;
}

/**
 * Get USD to EUR exchange rate
 */
export function getUSDToEURRate(): number {
  return USD_TO_EUR_RATE;
}

/**
 * Update USD to EUR exchange rate
 */
export function updateUSDToEURRate(rate: number): void {
  USD_TO_EUR_RATE = rate;
}

/**
 * Get exchange rate for a token to EUR
 */
export function getTokenToEURRate(tokenType: string): number {
  const usdRate = getTokenToUSDRate(tokenType);
  return usdRate * USD_TO_EUR_RATE;
}

/**
 * Convert token amount to EUR
 */
export function convertToEUR(amount: number, tokenType: string): number {
  const rate = getTokenToEURRate(tokenType);
  return amount * rate;
}

/**
 * Convert EUR to xBGL
 */
export function convertEURToXBGL(eurAmount: number): number {
  return eurAmount * EUR_TO_XBGL;
}

/**
 * Convert any token amount directly to xBGL
 */
export function convertToXBGL(amount: number, tokenType: string): number {
  const eurAmount = convertToEUR(amount, tokenType);
  return convertEURToXBGL(eurAmount);
}

/**
 * Update exchange rate for a token (in USD)
 */
export function updateExchangeRate(tokenType: string, rateToUSD: number): void {
  EXCHANGE_RATES_TO_USD[tokenType.toUpperCase()] = rateToUSD;
}

/**
 * Get all exchange rates (to USD)
 */
export function getAllExchangeRates(): Record<string, number> {
  return { ...EXCHANGE_RATES_TO_USD };
}

/**
 * Fetch real-time exchange rates from CoinGecko API (free tier)
 */
export async function fetchRealTimeRates(): Promise<{
  usdToEur: number;
  ethToUsd: number;
  maticToUsd: number;
}> {
  try {
    // Fetch USDC/EUR rate (USDC is pegged to USD, so this gives us USD/EUR)
    // USDC value in EUR = USD value in EUR
    const eurResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur');
    const eurData = await eurResponse.json();
    
    // Fetch ETH/USD rate
    const ethResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const ethData = await ethResponse.json();
    
    // Fetch MATIC/USD rate
    const maticResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
    const maticData = await maticResponse.json();
    
    // USDC is pegged to USD, so USDC/EUR = USD/EUR
    // If 1 USDC = 0.92 EUR, then 1 USD = 0.92 EUR
    const usdToEur = eurData['usd-coin']?.eur || 0.92;
    
    return {
      usdToEur,
      ethToUsd: ethData.ethereum?.usd || 3000,
      maticToUsd: maticData['matic-network']?.usd || 0.85,
    };
  } catch (error) {
    console.error('Failed to fetch real-time rates, using defaults:', error);
    return {
      usdToEur: 0.92, // Default: 1 USD = 0.92 EUR
      ethToUsd: 3000,
      maticToUsd: 0.85,
    };
  }
}

/**
 * Update all rates from real-time API
 */
export async function updateRatesFromAPI(): Promise<void> {
  const rates = await fetchRealTimeRates();
  updateUSDToEURRate(rates.usdToEur);
  updateExchangeRate('ETH', rates.ethToUsd);
  updateExchangeRate('MATIC', rates.maticToUsd);
}

/**
 * Format conversion result
 */
export interface ConversionResult {
  originalAmount: number;
  originalToken: string;
  eurAmount: number;
  xbglAmount: number;
  exchangeRate: number;
}

export function convertWithDetails(amount: number, tokenType: string): ConversionResult {
  const tokenToUSDRate = getTokenToUSDRate(tokenType);
  const usdAmount = amount * tokenToUSDRate;
  const eurAmount = usdAmount * USD_TO_EUR_RATE;
  const xbglAmount = convertEURToXBGL(eurAmount);
  
  return {
    originalAmount: amount,
    originalToken: tokenType,
    eurAmount,
    xbglAmount,
    exchangeRate: getTokenToEURRate(tokenType), // Return EUR rate for display
  };
}
