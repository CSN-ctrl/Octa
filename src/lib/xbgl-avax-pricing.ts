/**
 * Plot + deposit pricing: EUR → xBGL (1:1) and EUR → AVAX via USD bridge.
 */

import { getEURToUSDCRate, getEURToXBGLRate, getPlotPriceInXBGL } from "@/lib/exchange-rates";

export const PLOT_PRICE_EUR = 100;
export const DEFAULT_AVAX_USD = 9.4;

let cachedAvaxUsd: { value: number; at: number } | null = null;
const CACHE_MS = 60_000;

function avaxUsdFromEnv(): number | null {
  const raw = import.meta.env.VITE_AVAX_USD_PRICE?.toString().trim();
  if (!raw) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Sync xBGL/AVAX when treasury rate and CoinGecko are unavailable (1 EUR = 1 xBGL). */
export function estimateXbglPerAvax(avaxUsd = avaxUsdFromEnv() ?? DEFAULT_AVAX_USD): number {
  return avaxUsd * getEURToXBGLRate();
}

export async function fetchAvaxUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedAvaxUsd && now - cachedAvaxUsd.at < CACHE_MS) {
    return cachedAvaxUsd.value;
  }

  const envPrice = avaxUsdFromEnv();
  if (envPrice) {
    cachedAvaxUsd = { value: envPrice, at: now };
    return envPrice;
  }

  if (import.meta.env.PROD) {
    cachedAvaxUsd = { value: DEFAULT_AVAX_USD, at: now };
    return DEFAULT_AVAX_USD;
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd",
    );
    const data = await res.json();
    const px = data?.["avalanche-2"]?.usd;
    if (typeof px === "number" && px > 0) {
      cachedAvaxUsd = { value: px, at: now };
      return px;
    }
  } catch {
    /* use fallback */
  }
  cachedAvaxUsd = { value: DEFAULT_AVAX_USD, at: now };
  return DEFAULT_AVAX_USD;
}

/** AVAX for `plotEur` EUR at current EUR/USDC and AVAX/USD assumptions. */
export async function getPlotPriceInAVAX(plotEur = PLOT_PRICE_EUR): Promise<number> {
  const eurToUsdc = await getEURToUSDCRate();
  const avaxUsd = await fetchAvaxUsdPrice();
  return (plotEur * eurToUsdc) / avaxUsd;
}

export async function getPlotPriceInAVAXWei(plotEur = PLOT_PRICE_EUR): Promise<bigint> {
  const avax = await getPlotPriceInAVAX(plotEur);
  const { ethers } = await import("ethers");
  return ethers.parseEther(avax.toFixed(9));
}

/** xBGL credited for `avaxAmount` — 1 EUR = 1 xBGL via USD bridge. */
export async function convertAvaxAmountToXBGL(avaxAmount: number): Promise<number> {
  const avaxUsd = await fetchAvaxUsdPrice();
  const eurToUsdc = await getEURToUSDCRate();
  const eur = (avaxAmount * avaxUsd) / eurToUsdc;
  return eur * getEURToXBGLRate();
}

/** Human-readable breakdown for UI / ops. */
export async function getPlotPricingBreakdown(plotEur = PLOT_PRICE_EUR) {
  const eurToUsdc = await getEURToUSDCRate();
  const avaxUsd = await fetchAvaxUsdPrice();
  const xbgl = getPlotPriceInXBGL();
  const avax = (plotEur * eurToUsdc) / avaxUsd;
  return {
    plotEur,
    eurToXbgl: getEURToXBGLRate(),
    eurToUsdc,
    avaxUsd,
    xbgl,
    avax,
    xbglPerAvax: await convertAvaxAmountToXBGL(1),
  };
}
