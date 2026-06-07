/**
 * Toggle React Three Fiber universe renderer (no Blender — procedural + drei).
 * Set VITE_USE_R3F_UNIVERSE=false to fall back to legacy GalaxyVisualization.
 */
export function isR3fUniverseEnabled(): boolean {
  const raw = import.meta.env.VITE_USE_R3F_UNIVERSE;
  if (typeof raw === "string" && raw.toLowerCase() === "false") return false;
  return true;
}
