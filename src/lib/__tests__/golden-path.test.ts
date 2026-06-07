import { describe, expect, it } from "vitest";
import { goldenPathStepFromState } from "@/lib/golden-path";
import { getPlotPriceInXBGL } from "@/lib/exchange-rates";

describe("goldenPathStepFromState", () => {
  const plotPrice = getPlotPriceInXBGL();

  it("returns wallet when not connected", () => {
    expect(
      goldenPathStepFromState({ walletConnected: false, xbglBalance: 0, plotCount: 0 })
    ).toBe("wallet");
  });

  it("returns deposit when connected but under plot price", () => {
    expect(
      goldenPathStepFromState({
        walletConnected: true,
        xbglBalance: plotPrice - 1,
        plotCount: 0,
      })
    ).toBe("deposit");
  });

  it("returns plot when funded but no plots", () => {
    expect(
      goldenPathStepFromState({
        walletConnected: true,
        xbglBalance: plotPrice,
        plotCount: 0,
      })
    ).toBe("plot");
  });

  it("returns complete when user owns plots", () => {
    expect(
      goldenPathStepFromState({
        walletConnected: true,
        xbglBalance: plotPrice,
        plotCount: 1,
      })
    ).toBe("complete");
  });
});
