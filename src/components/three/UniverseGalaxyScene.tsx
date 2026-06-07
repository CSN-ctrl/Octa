import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  SARAKT_PLANETS,
  SARAKT_STAR,
  SARAKT_STAR_POSITION,
  type UniversePlanetId,
} from "@/config/universe-celestials";
import { GalaxyParticles } from "./GalaxyParticles";
import { CelestialBody } from "./CelestialBody";
import { OrbitingPlanet } from "./OrbitingPlanet";

type UniverseGalaxySceneProps = {
  particleCount?: number;
  enableBloom?: boolean;
  onSelectPlanet?: (planetId: UniversePlanetId) => void;
};

/**
 * Sarakt system — star, two orbiting planets with capital cities (Octavia, Zarathis).
 */
export function UniverseGalaxyScene({
  particleCount = 6000,
  enableBloom = true,
  onSelectPlanet,
}: UniverseGalaxySceneProps) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 2]} intensity={0.35} />

      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0.15} fade speed={0.4} />
      <GalaxyParticles count={particleCount} />

      <group position={SARAKT_STAR_POSITION}>
        <CelestialBody
          name={SARAKT_STAR.name}
          color={SARAKT_STAR.color}
          emissive={SARAKT_STAR.emissive}
          radius={SARAKT_STAR.radius}
          labelColor={SARAKT_STAR.labelColor}
          pulse
        />

        {SARAKT_PLANETS.map((planet) => (
          <OrbitingPlanet
            key={planet.id}
            planetId={planet.id}
            name={planet.name}
            cityName={planet.cityName}
            color={planet.color}
            emissive={planet.emissive}
            cityColor={planet.cityColor}
            atmosphereColor={planet.atmosphereColor}
            orbitRadius={planet.orbitRadius}
            orbitSpeed={planet.orbitSpeed}
            inclinationDeg={planet.inclinationDeg}
            radius={planet.radius}
            buildingCount={planet.buildingCount}
            onSelect={onSelectPlanet}
          />
        ))}
      </group>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>

      <OrbitControls
        enablePan
        enableZoom
        minDistance={0.8}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.15}
        target={SARAKT_STAR_POSITION}
      />

      {enableBloom && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}
