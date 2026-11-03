import { describe, expect, it } from "vitest";
import { isExpatPathLocked, type ExpatAvailability } from "@/lib/expat-availability";

describe("isExpatPathLocked", () => {
  it("locks only when expat_open is false regardless of plots_sold", () => {
    const almostSold: ExpatAvailability = {
      plots_sold: 9999,
      plots_total: 10000,
      expat_open: false,
      temp_units_total: 100,
      temp_units_allocated: 0,
    };
    expect(isExpatPathLocked(almostSold)).toBe(true);

    const soldOutButClosed: ExpatAvailability = {
      plots_sold: 10000,
      plots_total: 10000,
      expat_open: false,
      temp_units_total: 100,
      temp_units_allocated: 100,
    };
    expect(isExpatPathLocked(soldOutButClosed)).toBe(true);

    const openEarly: ExpatAvailability = {
      plots_sold: 100,
      plots_total: 10000,
      expat_open: true,
      temp_units_total: 100,
      temp_units_allocated: 10,
    };
    expect(isExpatPathLocked(openEarly)).toBe(false);
  });
});
