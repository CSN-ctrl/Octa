import { useAutoscale } from "@/hooks/useAutoscale";
import { isR3fUniverseEnabled } from "@/config/r3f-universe";
import { UNIVERSE_CAMERA_POSITION, type UniversePlanetId } from "@/config/universe-celestials";
import { GalaxyVisualization } from "@/components/GalaxyVisualization";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { UniverseGalaxyScene } from "@/components/three/UniverseGalaxyScene";

type UniverseVisualizationProps = {
  onSelectPlanet?: (planetId: UniversePlanetId) => void;
  onSelectCity?: (planetId: UniversePlanetId) => void;
};

/**
 * Landing galaxy viewport — legacy GalaxyVisualization by default (original spiral).
 * Set VITE_USE_R3F_UNIVERSE=true for the R3F Sarakt system scene on this view only.
 */
export function UniverseVisualization({ onSelectPlanet, onSelectCity }: UniverseVisualizationProps = {}) {
  const useR3f = isR3fUniverseEnabled();

  const {
    getFOV,
    getPixelRatio,
    getParticleMultiplier,
    shouldReduceQuality,
  } = useAutoscale({
    baseFOV: 75,
    mobileFOV: 70,
    tabletFOV: 72,
    desktopFOV: 75,
    reduceParticlesOnMobile: true,
    particleReductionFactor: 0.45,
  });

  if (!useR3f) {
    return <GalaxyVisualization />;
  }

  const baseParticles = 6000;
  const particleCount = shouldReduceQuality()
    ? Math.floor(baseParticles * getParticleMultiplier())
    : baseParticles;

  return (
    <SceneCanvas
      className="absolute inset-0 h-full w-full"
      fov={getFOV()}
      dpr={[1, getPixelRatio()]}
      cameraPosition={UNIVERSE_CAMERA_POSITION}
    >
      <UniverseGalaxyScene
        particleCount={particleCount}
        enableBloom={!shouldReduceQuality()}
        onSelectPlanet={onSelectPlanet}
        onSelectCity={onSelectCity}
      />
    </SceneCanvas>
  );
}
