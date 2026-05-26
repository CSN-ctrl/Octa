/**
 * Exchange Rate Management for USDC → xBGL Conversion
 */

import { supabase } from "@/integrations/supabase/client";

export interface ExchangeRate {
  from_token: string;
  to_token: string;
  rate: number;
  updated_at: string;
}

// Exchange rates
// 1 EUR = 1.955833 xBGL (fixed rate)
const EUR_TO_XBGL_RATE = 1.955833;
// Default EUR/USDC equivalent. Can be updated by admin in exchange_rates table.
const DEFAULT_EUR_TO_USDC_RATE = 1.0;

/**
 * Get current EUR to USDC exchange rate
 */
export async function getEURToUSDCRate(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_token", "EUR")
      .eq("to_token", "USDC")
      .single();

    if (error || !data) {
      // Return default rate if not found
      return DEFAULT_EUR_TO_USDC_RATE;
    }

    return data.rate || DEFAULT_EUR_TO_USDC_RATE;
  } catch (error) {
    console.error("Failed to fetch EUR/USDC rate:", error);
    return DEFAULT_EUR_TO_USDC_RATE;
  }
}

/**
 * Get EUR to xBGL rate (fixed: 1 EUR = 1.955833 xBGL)
 */
export function getEURToXBGLRate(): number {
  return EUR_TO_XBGL_RATE;
}

/**
 * Convert USDC amount to xBGL equivalent
 * Calculation: USDC → EUR → xBGL
 * Formula: (USDC / EUR_USDC_RATE) * EUR_XBGL_RATE
 */
export async function convertUSDCToXBGL(usdcAmount: number): Promise<number> {
  const eurToUsdcRate = await getEURToUSDCRate();
  // Convert USDC to EUR, then EUR to xBGL
  const eurAmount = usdcAmount / eurToUsdcRate;
  const xbglAmount = eurAmount * EUR_TO_XBGL_RATE;
  return xbglAmount;
}

/** AVAX → EUR (via USD) → xBGL; aligned with plot AVAX price on 1337. */
export async function convertAvaxToXBGL(avaxAmount: number): Promise<number> {
  const { convertAvaxAmountToXBGL } = await import("@/lib/xbgl-avax-pricing");
  return convertAvaxAmountToXBGL(avaxAmount);
}

export async function getAvaxToXBGLRate(): Promise<number> {
  return convertAvaxToXBGL(1);
}

/** Inverse of getAvaxToXBGLRate — AVAX required to receive `xbglAmount`. */
export async function convertXBGLToAvax(xbglAmount: number): Promise<number> {
  const rate = await getAvaxToXBGLRate();
  if (rate <= 0) return 0;
  return xbglAmount / rate;
}

/**
 * Get current USDC to xBGL exchange rate (for display)
 */
export async function getUSDCToXBGLRate(): Promise<number> {
  const eurToUsdcRate = await getEURToUSDCRate();
  // Calculate: 1 USDC = (1 / EUR_USDC_RATE) * EUR_XBGL_RATE xBGL
  return (1 / eurToUsdcRate) * EUR_TO_XBGL_RATE;
}

/**
 * Convert xBGL amount to USDC equivalent
 */
export async function convertXBGLToUSDC(xbglAmount: number): Promise<number> {
  const rate = await getUSDCToXBGLRate();
  return xbglAmount / rate;
}

/**
 * Update exchange rate (admin only)
 */
export async function updateExchangeRate(
  fromToken: string,
  toToken: string,
  rate: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("exchange_rates")
      .upsert({
        from_token: fromToken,
        to_token: toToken,
        rate: rate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "from_token,to_token"
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to update exchange rate:", error);
    return false;
  }
}

/**
 * Get plot price in xBGL (fixed at 100 EUR equivalent)
 * 100 EUR * 1.955833 = 195.5833 xBGL
 */
export function getPlotPriceInXBGL(): number {
  const PLOT_PRICE_EUR = 100;
  return PLOT_PRICE_EUR * EUR_TO_XBGL_RATE; // 195.5833 xBGL
}
