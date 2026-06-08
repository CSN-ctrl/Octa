import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OCTAVIA_DISTRICT_NAME } from "@/config/universe-celestials";

export const UNIVERSE_ROOT = "/universe";

export const GALAXY_UNIVERSE_PLANET_IDS = ["sarakt-prime", "zythera"] as const;

export function resolveCityKeyFromSlug(
  districts: { name: string }[] | undefined,
  citySlug: string,
): string | null {
  if (!districts?.length) return null;

  const slug = citySlug.toLowerCase();

  if (slug === "octavia") {
    const idx = districts.findIndex((d) => d.name === OCTAVIA_DISTRICT_NAME);
    return idx >= 0 ? `city-${idx}` : null;
  }

  if (slug.startsWith("city-")) {
    const idx = Number.parseInt(slug.slice("city-".length), 10);
    return Number.isFinite(idx) && districts[idx] ? `city-${idx}` : null;
  }

  const numericIdx = Number.parseInt(slug, 10);
  if (Number.isFinite(numericIdx) && districts[numericIdx]) {
    return `city-${numericIdx}`;
  }

  const namedIdx = districts.findIndex(
    (d) => d.name.toLowerCase().replace(/\s+/g, "-") === slug,
  );
  return namedIdx >= 0 ? `city-${namedIdx}` : null;
}

export const universeSystemPath = (systemId: string) =>
  `${UNIVERSE_ROOT}/system/${encodeURIComponent(systemId)}`;

export const universePlanetPath = (planetId: string) =>
  `${UNIVERSE_ROOT}/planet/${encodeURIComponent(planetId)}`;

export const universeCityPath = (planetId: string, citySlug: string) =>
  `${UNIVERSE_ROOT}/planet/${encodeURIComponent(planetId)}/city/${encodeURIComponent(citySlug)}`;

export const universeOctaviaPath = universeCityPath("sarakt-prime", "octavia");

export const universeOctaviaDeepLink = `${UNIVERSE_ROOT}?planet=sarakt-prime&city=octavia`;

export function useUniverseRoutes() {
  const navigate = useNavigate();

  const goToUniverse = useCallback(
    (opts?: { replace?: boolean; search?: string }) => {
      const path = opts?.search ? `${UNIVERSE_ROOT}${opts.search}` : UNIVERSE_ROOT;
      navigate(path, { replace: opts?.replace });
    },
    [navigate],
  );

  const goToSystem = useCallback(
    (systemId: string, opts?: { replace?: boolean }) => {
      navigate(universeSystemPath(systemId), { replace: opts?.replace });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const goToPlanet = useCallback(
    (planetId: string, opts?: { replace?: boolean }) => {
      navigate(universePlanetPath(planetId), { replace: opts?.replace });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const goToCity = useCallback(
    (planetId: string, citySlug: string, opts?: { replace?: boolean }) => {
      navigate(universeCityPath(planetId, citySlug), { replace: opts?.replace });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  return {
    goToUniverse,
    goToSystem,
    goToPlanet,
    goToCity,
    universeOctaviaDeepLink,
    universeOctaviaPath,
    universeSystemPath,
    universePlanetPath,
    universeCityPath,
  };
}
