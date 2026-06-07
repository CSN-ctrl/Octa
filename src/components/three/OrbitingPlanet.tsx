import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CelestialBody } from "./CelestialBody";

type OrbitingPlanetProps = {
  name: string;
  color: string;
  orbitRadius: number;
  orbitSpeed?: number;
  inclinationDeg?: number;
  radius?: number;
  showRing?: boolean;
};

export function OrbitingPlanet({
  name,
  color,
  orbitRadius,
  orbitSpeed = 0.12,
  inclinationDeg = 8,
  radius = 0.04,
  showRing = true,
}: OrbitingPlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed * delta;
    }
  });

  return (
    <group rotation={[THREE.MathUtils.degToRad(inclinationDeg), 0, 0]}>
      <group ref={orbitRef}>
        <group position={[orbitRadius, 0, 0]}>
          <CelestialBody
            name={name}
            color={color}
            radius={radius}
            labelColor={color}
            showRing={showRing}
            ringRadius={orbitRadius}
            ringColor={color}
          />
        </group>
      </group>
    </group>
  );
}
