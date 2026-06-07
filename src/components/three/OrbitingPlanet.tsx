import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { UniversePlanetId } from "@/config/universe-celestials";
import { OrbitRing } from "./OrbitRing";
import { PlanetWithCity } from "./PlanetWithCity";

type OrbitingPlanetProps = {
  planetId: UniversePlanetId;
  name: string;
  cityName: string;
  color: string;
  emissive: string;
  cityColor: string;
  atmosphereColor: string;
  orbitRadius: number;
  orbitSpeed?: number;
  inclinationDeg?: number;
  radius?: number;
  buildingCount?: number;
  priority?: boolean;
  dimmed?: boolean;
  onSelect?: (planetId: UniversePlanetId) => void;
  onSelectCity?: (planetId: UniversePlanetId) => void;
};

export function OrbitingPlanet({
  planetId,
  name,
  cityName,
  color,
  emissive,
  cityColor,
  atmosphereColor,
  orbitRadius,
  orbitSpeed = 0.12,
  inclinationDeg = 8,
  radius = 0.07,
  buildingCount = 16,
  priority = false,
  dimmed = false,
  onSelect,
  onSelectCity,
}: OrbitingPlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed * delta;
    }
  });

  return (
    <group rotation={[THREE.MathUtils.degToRad(inclinationDeg), 0, 0]}>
      <OrbitRing radius={orbitRadius} color={cityColor} highlighted={priority} />
      <group ref={orbitRef}>
        <group position={[orbitRadius, 0, 0]}>
          <PlanetWithCity
            planetId={planetId}
            name={name}
            cityName={cityName}
            color={color}
            emissive={emissive}
            cityColor={cityColor}
            atmosphereColor={atmosphereColor}
            radius={radius}
            buildingCount={buildingCount}
            priority={priority}
            dimmed={dimmed}
            onSelect={onSelect}
            onSelectCity={onSelectCity}
          />
        </group>
      </group>
    </group>
  );
}
