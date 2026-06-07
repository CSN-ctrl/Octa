import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { UniversePlanetId } from "@/config/universe-celestials";

type PlanetWithCityProps = {
  planetId: UniversePlanetId;
  name: string;
  cityName: string;
  color: string;
  emissive: string;
  cityColor: string;
  atmosphereColor: string;
  radius?: number;
  buildingCount?: number;
  onSelect?: (planetId: UniversePlanetId) => void;
};

function sphericalCapPosition(
  radius: number,
  index: number,
  total: number,
  spread: number,
): THREE.Vector3 {
  const ring = Math.floor(index / 5);
  const slot = index % 5;
  const lat = (ring / Math.max(total / 5, 1) - 0.35) * spread;
  const lon = ((slot - 2) / 4) * spread;
  const cosLat = Math.cos(lat);
  const x = radius * cosLat * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * cosLat * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

/**
 * Habitable planet with procedural capital city — instanced towers, atmosphere, labels.
 */
export function PlanetWithCity({
  planetId,
  name,
  cityName,
  color,
  emissive,
  cityColor,
  atmosphereColor,
  radius = 0.07,
  buildingCount = 16,
  onSelect,
}: PlanetWithCityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState(false);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const count = Math.max(buildingCount, 1);

  useLayoutEffect(() => {
    const mesh = buildingsRef.current;
    if (!mesh) return;

    for (let i = 0; i < count; i++) {
      const surface = sphericalCapPosition(radius, i, count, 0.55);
      normal.copy(surface).normalize();
      const isTower = i === 0;
      const height = isTower ? radius * 0.9 : radius * (0.22 + (i % 4) * 0.08);
      const width = isTower ? radius * 0.14 : radius * (0.1 + (i % 3) * 0.03);

      up.copy(normal);
      dummy.position.copy(surface).addScaledVector(normal, height / 2);
      dummy.scale.set(width, height, width);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, dummy, normal, radius, up]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = Math.sin(state.clock.elapsedTime * 3 + (planetId === "zythera" ? 1.2 : 0)) * 0.04 + 1;
    groupRef.current.children.forEach((child) => {
      if (child.name === "city-glow") {
        child.scale.setScalar(pulse);
      }
    });
  });

  return (
    <group
      ref={groupRef}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(planetId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = onSelect ? "pointer" : "auto";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.15} roughness={0.65} metalness={0.08} />
      </mesh>

      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial color={atmosphereColor} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <group name="city-glow" position={[radius * 1.02, 0, 0]}>
        <mesh>
          <sphereGeometry args={[radius * 0.22, 12, 12]} />
          <meshBasicMaterial color={cityColor} transparent opacity={0.35} depthWrite={false} />
        </mesh>
        <pointLight color={cityColor} intensity={0.6} distance={radius * 8} decay={2} />
      </group>

      <instancedMesh ref={buildingsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={cityColor}
          emissive={cityColor}
          emissiveIntensity={planetId === "zythera" ? 1.1 : 0.85}
          roughness={0.35}
          metalness={0.25}
        />
      </instancedMesh>

      <mesh position={[radius * 1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <ringGeometry args={[radius * 0.08, radius * 0.11, 24]} />
        <meshBasicMaterial color={cityColor} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <Html
        position={[0, radius * 4.2, 0]}
        center
        distanceFactor={5.5}
        style={{
          pointerEvents: onSelect ? "auto" : "none",
          userSelect: "none",
          textAlign: "center",
          cursor: onSelect ? "pointer" : "default",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(planetId);
          }}
          className="border-0 bg-transparent p-0"
          style={{
            background: hovered ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.55)",
            border: `1px solid ${cityColor}88`,
            borderRadius: 8,
            padding: "4px 10px",
            color: cityColor,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
        >
          <div>{name}</div>
          <div style={{ fontSize: 9, opacity: 0.9, marginTop: 2 }}>{cityName}</div>
        </button>
      </Html>
    </group>
  );
}
