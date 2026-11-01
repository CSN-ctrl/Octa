/** Must match Postgres enum public.permit_plot_type and src/lib/permits-api-contract.ts */
export const PERMIT_PLOT_TYPES = [
  "residential",
  "commercial",
  "mixed_use",
  "agricultural",
  "industrial",
  "public",
] as const;

export type PermitPlotType = (typeof PERMIT_PLOT_TYPES)[number];

export function isPermitPlotType(value: unknown): value is PermitPlotType {
  return typeof value === "string" && (PERMIT_PLOT_TYPES as readonly string[]).includes(value);
}
