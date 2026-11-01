import { GENESIS_PLOTS_TOTAL, EXPAT_TEMP_UNITS_TOTAL } from "@/lib/genesis-product-copy";
import { isOnboardingApiLive } from "@/lib/onboarding-api-config";
import { fetchExpatAvailability, type ExpatAvailability } from "@/lib/permits";

export type { ExpatAvailability } from "@/lib/permits-api-contract";

const DEFAULT_MOCK: ExpatAvailability = {
  plots_sold: 0,
  plots_total: GENESIS_PLOTS_TOTAL,
  expat_open: false,
  temp_units_total: EXPAT_TEMP_UNITS_TOTAL,
  temp_units_allocated: 0,
};

/** UI lock — only the server-provided flag (never derive from plot counts client-side). */
export function isExpatPathLocked(availability: ExpatAvailability): boolean {
  return !availability.expat_open;
}

async function getExpatAvailabilityMock(): Promise<ExpatAvailability> {
  const { fetchGenesisPlotsSold } = await import("@/lib/plots-sold");
  const plotsSold = await fetchGenesisPlotsSold();
  const expatOpenFromEnv =
    String(import.meta.env.VITE_MOCK_EXPAT_OPEN || "").toLowerCase() === "true";

  return {
    plots_sold: plotsSold,
    plots_total: GENESIS_PLOTS_TOTAL,
    expat_open: expatOpenFromEnv,
    temp_units_total: EXPAT_TEMP_UNITS_TOTAL,
    temp_units_allocated: 0,
    temp_units_available: EXPAT_TEMP_UNITS_TOTAL,
    temp_units: Array.from({ length: Math.min(5, EXPAT_TEMP_UNITS_TOTAL) }, (_, i) => ({
      unit_number: i + 1,
      label: `Unit ${i + 1}`,
      is_active: true,
      is_allocated: false,
    })),
  };
}

export function expatPathLockedBody(availability: ExpatAvailability): string {
  return `${availability.plots_sold.toLocaleString()} / ${availability.plots_total.toLocaleString()} Genesis plots sold. The Worker/Expat path stays closed until the platform marks it open. Before any user building, Sarakt government provides up to ${availability.temp_units_total.toLocaleString()} temporary living/work units for expats to rent once the path opens.`;
}

export async function getExpatAvailability(): Promise<ExpatAvailability> {
  if (isOnboardingApiLive()) {
    const live = await fetchExpatAvailability();
    if (live) return live;
    return DEFAULT_MOCK;
  }
  return getExpatAvailabilityMock();
}
