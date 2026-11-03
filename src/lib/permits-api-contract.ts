/** Locked plot type enum — Octa Investment Group Sarakt/Octa permits (Postgres permit_plot_type). */
export const PERMIT_PLOT_TYPES = [
  "residential",
  "commercial",
  "mixed_use",
  "agricultural",
  "industrial",
  "public",
] as const;

export type PermitPlotType = (typeof PERMIT_PLOT_TYPES)[number];

export const PERMIT_APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;

export type PermitApplicationStatus = (typeof PERMIT_APPLICATION_STATUSES)[number];

export type PermitPlotLocation = {
  id: number;
  display_label: string;
  coord_x: number;
  coord_y: number;
  zone_type: string | null;
};

export type PermitApplicationRecord = {
  id: string;
  plot_id: number;
  applicant_user_id: string;
  status: PermitApplicationStatus;
  requested_type: PermitPlotType | null;
  assigned_type: PermitPlotType | null;
  rejection_reason: string | null;
  location_confirmed: boolean;
  location_confirmed_at: string | null;
  confirmed_plot_id: number | null;
  confirmed_coord_x: number | null;
  confirmed_coord_y: number | null;
  location_notes: Record<string, unknown>;
  reviewer_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  plot: PermitPlotLocation;
};

export function isPermitPlotType(value: unknown): value is PermitPlotType {
  return typeof value === "string" && (PERMIT_PLOT_TYPES as readonly string[]).includes(value);
}

export function isPermitApplicationStatus(value: unknown): value is PermitApplicationStatus {
  return typeof value === "string" && (PERMIT_APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function parsePermitApplication(value: unknown): PermitApplicationRecord | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.plot_id !== "number") return null;
  if (!isPermitApplicationStatus(o.status)) return null;
  const plot = o.plot;
  if (!plot || typeof plot !== "object") return null;
  const p = plot as Record<string, unknown>;
  if (typeof p.id !== "number" || typeof p.coord_x !== "number" || typeof p.coord_y !== "number") {
    return null;
  }
  return value as PermitApplicationRecord;
}

export type BasicResidentialPlotEligibility = {
  plot_id: number;
  sale_rank: number;
  eligible: boolean;
  approved_residential_permit: boolean;
  claimed: boolean;
};

export type BasicResidentialEligibility = {
  cap: number;
  wallet_address: string | null;
  plots: BasicResidentialPlotEligibility[];
};

export function parseBasicResidentialEligibility(value: unknown): BasicResidentialEligibility | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.cap !== "number") return null;
  const plotsRaw = o.plots;
  const plots: BasicResidentialPlotEligibility[] = [];
  if (Array.isArray(plotsRaw)) {
    for (const item of plotsRaw) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      if (typeof p.plot_id !== "number" || typeof p.sale_rank !== "number") continue;
      plots.push({
        plot_id: p.plot_id,
        sale_rank: p.sale_rank,
        eligible: Boolean(p.eligible),
        approved_residential_permit: Boolean(p.approved_residential_permit),
        claimed: Boolean(p.claimed),
      });
    }
  }
  return {
    cap: o.cap,
    wallet_address: typeof o.wallet_address === "string" ? o.wallet_address : null,
    plots,
  };
}

export function parseExpatAvailability(value: unknown): ExpatAvailability | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (
    typeof o.plots_sold !== "number" ||
    typeof o.plots_total !== "number" ||
    typeof o.expat_open !== "boolean" ||
    typeof o.temp_units_total !== "number" ||
    typeof o.temp_units_allocated !== "number"
  ) {
    return null;
  }
  return o as ExpatAvailability;
}

export type ExpatTempUnitSummary = {
  unit_number: number;
  label: string;
  is_active: boolean;
  is_allocated: boolean;
};

export type ExpatAvailability = {
  plots_sold: number;
  plots_total: number;
  expat_open: boolean;
  temp_units_total: number;
  temp_units_allocated: number;
  temp_units_available?: number;
  rent_currency_default?: string;
  rent_period_default?: string;
  temp_units?: ExpatTempUnitSummary[];
};
