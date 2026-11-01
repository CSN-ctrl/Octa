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

export type ExpatAvailability = {
  plots_sold: number;
  plots_total: number;
  expat_open: boolean;
  temp_units_total: number;
  temp_units_allocated: number;
};

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

export type BasicResidentialEligibility = {
  eligible: boolean;
  owner_rank: number | null;
  cap: number;
  wallet_address: string | null;
};

export function parseBasicResidentialEligibility(value: unknown): BasicResidentialEligibility | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.eligible !== "boolean" || typeof o.cap !== "number") return null;
  return {
    eligible: o.eligible,
    owner_rank: typeof o.owner_rank === "number" ? o.owner_rank : o.owner_rank === null ? null : null,
    cap: o.cap,
    wallet_address: typeof o.wallet_address === "string" ? o.wallet_address : null,
  };
}
