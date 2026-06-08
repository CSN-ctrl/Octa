/**
 * Galaxy viewport renderer toggle.
 * Default: legacy GalaxyVisualization (original spiral simulation).
 * Set VITE_USE_R3F_UNIVERSE=true to use R3F UniverseGalaxyScene on the landing galaxy only.
 * City/planet 3D previews (OctaviaCapitalCity, etc.) always use R3F regardless of this flag.
 */
export function isR3fUniverseEnabled(): boolean {
  const raw = import.meta.env.VITE_USE_R3F_UNIVERSE;
  if (typeof raw === "string" && raw.toLowerCase() === "true") return true;
  return false;
}
