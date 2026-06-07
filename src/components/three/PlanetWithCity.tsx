import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { UniversePlanetId } from "@/config/universe-celestials";
import { OctaviaCapitalCity } from "./OctaviaCapitalCity";

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
  priority?: boolean;
  dimmed?: boolean;
  onSelect?: (planetId: UniversePlanetId) => void;
  onSelectCity?: (planetId: UniversePlanetId) => void;
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
 * Habitable planet with procedural capital city — Octavia gets a dedicated hero build.
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
  priority = false,
  dimmed = false,
  onSelect,
  onSelectCity,
}: PlanetWithCityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState(false);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const count = Math.max(buildingCount, 1);
  const isOctavia = priority && planetId === "sarakt-prime";

  useLayoutEffect(() => {
    if (isOctavia) return;
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
  }, [count, dummy, isOctavia, normal, radius, up]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = Math.sin(state.clock.elapsedTime * (isOctavia ? 2.2 : 3) + (planetId === "zythera" ? 1.2 : 0)) * 0.04 + 1;
    const glow = groupRef.current.getObjectByName("city-glow");
    if (glow) glow.scale.setScalar(pulse);
  });

  const handleCitySelect = () => {
    if (onSelectCity) onSelectCity(planetId);
    else onSelect?.(planetId);
  };

  const labelBorder = isOctavia ? "#fbbf24" : cityColor;
  const labelBg = hovered
    ? isOctavia
      ? "rgba(20,83,45,0.88)"
      : "rgba(0,0,0,0.72)"
    : isOctavia
      ? "rgba(10,40,24,0.82)"
      : "rgba(0,0,0,0.55)";

  return (
    <group
      ref={groupRef}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        handleCitySelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = onSelect || onSelectCity ? "pointer" : "auto";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh>
        <sphereGeometry args={[radius, priority ? 40 : 32, priority ? 40 : 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={priority ? 0.22 : 0.15}
          roughness={0.65}
          metalness={priority ? 0.12 : 0.08}
          transparent={dimmed}
          opacity={dimmed ? 0.82 : 1}
        />
      </mesh>

      <mesh scale={priority ? 1.08 : 1.06}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={priority ? 0.18 : 0.12}
          depthWrite={false}
        />
      </mesh>

      {isOctavia ? (
        <OctaviaCapitalCity radius={radius} cityColor={cityColor} />
      ) : (
        <>
          <group name="city-glow" position={[radius * 1.02, 0, 0]}>
            <mesh>
              <sphereGeometry args={[radius * 0.22, 12, 12]} />
              <meshBasicMaterial color={cityColor} transparent opacity={0.35} depthWrite={false} />
            </mesh>
            <pointLight color={cityColor} intensity={0.45} distance={radius * 8} decay={2} />
          </group>

          <instancedMesh ref={buildingsRef} args={[undefined, undefined, count]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={cityColor}
              emissive={cityColor}
              emissiveIntensity={0.85}
              roughness={0.35}
              metalness={0.25}
            />
          </instancedMesh>

          <mesh position={[radius * 1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <ringGeometry args={[radius * 0.08, radius * 0.11, 24]} />
            <meshBasicMaterial color={cityColor} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </>
      )}

      <Html
        position={[0, radius * (isOctavia ? 5.2 : 4.2), 0]}
        center
        distanceFactor={isOctavia ? 4.8 : 5.5}
        style={{
          pointerEvents: onSelect || onSelectCity ? "auto" : "none",
          userSelect: "none",
          textAlign: "center",
          cursor: onSelect || onSelectCity ? "pointer" : "default",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCitySelect();
          }}
          className="border-0 bg-transparent p-0"
          style={{
            background: labelBg,
            border: `1px solid ${labelBorder}aa`,
            borderRadius: isOctavia ? 10 : 8,
            padding: isOctavia ? "6px 12px" : "4px 10px",
            color: cityColor,
            fontSize: isOctavia ? 12 : 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            transition: "background 0.15s",
            boxShadow: isOctavia ? "0 0 14px rgba(74,222,128,0.35)" : undefined,
          }}
        >
          <div>{name}</div>
          <div style={{ fontSize: isOctavia ? 10 : 9, opacity: 0.95, marginTop: 2, color: isOctavia ? "#fbbf24" : cityColor }}>
            {isOctavia ? "Enter Octavia Capital City" : cityName}
          </div>
          {isOctavia && (
            <div
              style={{
                fontSize: 8,
                marginTop: 4,
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(251,191,36,0.2)",
                color: "#fde68a",
                display: "inline-block",
              }}
            >
              Phase 1 · Land ownership
            </div>
          )}
        </button>
      </Html>
    </group>
  );
}
