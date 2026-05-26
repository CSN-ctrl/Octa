/**
 * Plot + deposit pricing: EUR → xBGL (1.955833) and EUR → AVAX via USD bridge.
 */

import { getEURToUSDCRate, getEURToXBGLRate, getPlotPriceInXBGL } from "@/lib/exchange-rates";

export const PLOT_PRICE_EUR = 100;
export const DEFAULT_AVAX_USD = 25;

let cachedAvaxUsd: { value: number; at: number } | null = null;
const CACHE_MS = 60_000;

export async function fetchAvaxUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedAvaxUsd && now - cachedAvaxUsd.at < CACHE_MS) {
    return cachedAvaxUsd.value;
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

/** xBGL credited for `avaxAmount` at the same EUR bridge as plot pricing. */
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
    /** 1 AVAX → xBGL at same bridge */
    xbglPerAvax: await convertAvaxAmountToXBGL(1),
  };
}
