import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GalaxyParticles } from "./GalaxyParticles";
import { CelestialBody } from "./CelestialBody";
import { OrbitingPlanet } from "./OrbitingPlanet";

const SARAKT_POSITION: [number, number, number] = [1.6, 0, 1.6];

type UniverseGalaxySceneProps = {
  particleCount?: number;
  enableBloom?: boolean;
};

/**
 * Procedural Sarakt galaxy — stars, spiral particles, orbiting planets.
 * No Blender or GLB assets required.
 */
export function UniverseGalaxyScene({
  particleCount = 6000,
  enableBloom = true,
}: UniverseGalaxySceneProps) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 2]} intensity={0.35} />

      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0.15} fade speed={0.4} />
      <GalaxyParticles count={particleCount} />

      <group position={SARAKT_POSITION}>
        <CelestialBody
          name="Sarakt Star"
          color="#9333ea"
          emissive="#6d28d9"
          radius={0.1}
          labelColor="#a78bfa"
          pulse
        />
        <OrbitingPlanet
          name="Sarakt Prime"
          color="#22c55e"
          orbitRadius={0.8}
          orbitSpeed={0.1}
          inclinationDeg={8}
        />
        <OrbitingPlanet
          name="Zythera"
          color="#ef4444"
          orbitRadius={1.1}
          orbitSpeed={0.08}
          inclinationDeg={15}
        />
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
        target={SARAKT_POSITION}
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
