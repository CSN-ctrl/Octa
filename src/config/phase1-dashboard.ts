/**
 * Phase 1 dashboard scope — asset management + transfers only.
 * Set VITE_PHASE1_DASHBOARD_ONLY=false to expose market/speculative modules.
 */
export function isPhase1DashboardOnly(): boolean {
  const raw = import.meta.env.VITE_PHASE1_DASHBOARD_ONLY;
  if (typeof raw === "string" && raw.toLowerCase() === "false") return false;
  if (typeof raw === "string" && raw.toLowerCase() === "true") return true;
  return import.meta.env.PROD;
}
