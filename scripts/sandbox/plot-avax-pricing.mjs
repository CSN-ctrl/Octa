/**
 * Phase-1 plot pricing: 100 EUR notional via 1 EUR = 1.955833 xBGL and EUR→USD→AVAX bridge.
 */

export const EUR_TO_XBGL = 1.955833;
export const PLOT_PRICE_EUR = 100;
/** USDC (≈ USD) per 1 EUR — matches supabase seed EUR→USDC 1.1 */
export const DEFAULT_EUR_TO_USDC = 1.1;
export const DEFAULT_AVAX_USD = 25;

export function plotPriceXbglHuman(plotEur = PLOT_PRICE_EUR) {
  return plotEur * EUR_TO_XBGL;
}

export function plotPriceXbglWei(plotEur = PLOT_PRICE_EUR) {
  const whole = BigInt(Math.round(plotPriceXbglHuman(plotEur) * 1e6));
  return (whole * 10n ** 12n).toString();
}

/**
 * AVAX for the same EUR notional as xBGL plot price.
 * plotEur × (USDC per EUR) / (USD per AVAX)
 */
export function plotPriceAvaxHuman(plotEur, eurToUsdc, avaxUsd) {
  return (plotEur * eurToUsdc) / avaxUsd;
}

export function plotPriceAvaxWei(plotEur, eurToUsdc, avaxUsd) {
  const avax = plotPriceAvaxHuman(plotEur, eurToUsdc, avaxUsd);
  const whole = BigInt(Math.round(avax * 1e9));
  return (whole * 10n ** 9n).toString();
}

export async function fetchAvaxUsd() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd",
    );
    const data = await res.json();
    const px = data?.["avalanche-2"]?.usd;
    if (typeof px === "number" && px > 0) return px;
  } catch {
    /* fallback */
  }
  return DEFAULT_AVAX_USD;
}

export async function resolvePlotPrices(env = {}) {
  const plotEur = Number(env.PLOT_PRICE_EUR || PLOT_PRICE_EUR);
  const eurToUsdc = Number(env.EUR_TO_USDC_RATE || DEFAULT_EUR_TO_USDC);
  const avaxUsd =
    env.AVAX_USD_PRICE != null && env.AVAX_USD_PRICE !== ""
      ? Number(env.AVAX_USD_PRICE)
      : await fetchAvaxUsd();

  const xbglWei = env.PHASE1_PRICE_XBGL_WEI || plotPriceXbglWei(plotEur);
  const avaxWei =
    env.PHASE1_PRICE_AVAX_WEI || plotPriceAvaxWei(plotEur, eurToUsdc, avaxUsd);

  const xbglHuman = plotPriceXbglHuman(plotEur);
  const avaxHuman = plotPriceAvaxHuman(plotEur, eurToUsdc, avaxUsd);
  const xbglPerAvax = avaxHuman > 0 ? xbglHuman / avaxHuman : 0;

  return {
    plotEur,
    eurToUsdc,
    avaxUsd,
    xbglHuman,
    avaxHuman,
    xbglPerAvax,
    xbglWei,
    avaxWei,
  };
}
