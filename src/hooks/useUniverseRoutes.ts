import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const UNIVERSE_ROOT = "/universe";

export const universeSystemPath = (systemId: string) =>
  `${UNIVERSE_ROOT}/system/${encodeURIComponent(systemId)}`;

export const universePlanetPath = (planetId: string) =>
  `${UNIVERSE_ROOT}/planet/${encodeURIComponent(planetId)}`;

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

  return {
    goToUniverse,
    goToSystem,
    goToPlanet,
    universeOctaviaDeepLink,
    universeSystemPath,
    universePlanetPath,
  };
}
