import { useAutoscale } from "@/hooks/useAutoscale";
import { isR3fUniverseEnabled } from "@/config/r3f-universe";
import { GalaxyVisualization } from "@/components/GalaxyVisualization";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { UniverseGalaxyScene } from "@/components/three/UniverseGalaxyScene";

/**
 * Universe viewport — R3F procedural scene by default (no Blender).
 * Set VITE_USE_R3F_UNIVERSE=false for legacy imperative Three.js renderer.
 */
export function UniverseVisualization() {
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
      cameraPosition={[3.2, 2.4, 3.2]}
    >
      <UniverseGalaxyScene
        particleCount={particleCount}
        enableBloom={!shouldReduceQuality()}
      />
    </SceneCanvas>
  );
}
