import {
  PERMIT_PLOT_TYPES,
  type PermitPlotType,
  isPermitPlotType,
} from "@/lib/permits-api-contract";

/** UI alias for backend permit_plot_type enum. */
export type PermitType = PermitPlotType;

export const PERMIT_TYPES = PERMIT_PLOT_TYPES;

export const PERMIT_TYPE_LABELS: Record<PermitPlotType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  mixed_use: "Mixed use",
  agricultural: "Agricultural",
  industrial: "Industrial",
  public: "Public",
};

export function isPermitType(value: string | null | undefined): value is PermitType {
  return isPermitPlotType(value);
}

export function labelForPermitType(type: PermitType | string | null | undefined): string {
  if (type && isPermitType(type)) return PERMIT_TYPE_LABELS[type];
  return type ? String(type) : "—";
}

export const PERMIT_TYPE_SELECT_OPTIONS = PERMIT_PLOT_TYPES.map((value) => ({
  value,
  label: PERMIT_TYPE_LABELS[value],
}));
