import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { plotWorldPosition } from "@/lib/plot-coordinates";
import { OctaviaLandmark } from "./landmarks/OctaviaLandmark";
import { OctaviaProp } from "./landmarks/OctaviaProp";
import { OctaviaTower } from "./landmarks/OctaviaTower";

const TREASURY_GOLD = "#fbbf24";
const TREASURY_ACCENT = "#a78bfa";
const SAPPHIRE = "#38bdf8";
const PLOT_OWNED = "#4ade80";
const PLOT_OPEN = "#6366f1";

type OctaviaCapitalCityProps = {
  radius: number;
  cityColor: string;
};

/**
 * Phase 1 hero city on Sarakt Prime — Treasury Tower, vertical blocks, plot ring, sapphire coast.
 */
export function OctaviaCapitalCity({ radius, cityColor }: OctaviaCapitalCityProps) {
  const towersRef = useRef<THREE.InstancedMesh>(null);
  const plotsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const towerCount = 24;
  const plotIds = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const tileSpacing = radius * 0.09;

  useLayoutEffect(() => {
    const towers = towersRef.current;
    if (!towers) return;

    for (let i = 0; i < towerCount; i++) {
      const ring = Math.floor(i / 6);
      const slot = i % 6;
      const angle = (slot / 6) * Math.PI * 2 + ring * 0.4;
      const dist = radius * (0.12 + ring * 0.07);
      const surfaceX = radius + Math.cos(angle) * dist;
      const surfaceY = Math.sin(angle) * dist * 0.65;
      const surfaceZ = Math.cos(angle + 0.3) * dist * 0.35;
      const height = radius * (0.35 + (i % 5) * 0.12);
      const width = radius * (0.045 + (i % 3) * 0.012);

      dummy.position.set(surfaceX + height * 0.35, surfaceY, surfaceZ);
      dummy.scale.set(width, height, width);
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      towers.setMatrixAt(i, dummy.matrix);
    }
    towers.instanceMatrix.needsUpdate = true;
  }, [dummy, radius]);

  useLayoutEffect(() => {
    const plots = plotsRef.current;
    if (!plots) return;

    plotIds.forEach((plotId, index) => {
      const [px, , pz] = plotWorldPosition(plotId, 1);
      const h = plotId === 1 ? radius * 0.14 : radius * 0.08;
      dummy.position.set(radius * 1.02 + px * tileSpacing, pz * tileSpacing * 0.55, 0);
      dummy.scale.set(radius * 0.035, h, radius * 0.035);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      plots.setMatrixAt(index, dummy.matrix);
      color.copy(
        new THREE.Color(
          plotId === 1 ? TREASURY_ACCENT : plotId <= 4 ? PLOT_OWNED : PLOT_OPEN
        )
      );
      plots.setColorAt(index, color);
    });
    plots.instanceMatrix.needsUpdate = true;
    if (plots.instanceColor) plots.instanceColor.needsUpdate = true;
  }, [color, dummy, plotIds, radius, tileSpacing]);

  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      {/* Sapphire Sea — lower hemisphere tint */}
      <mesh position={[0, -radius * 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[radius * 1.01, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial
          color={SAPPHIRE}
          emissive={SAPPHIRE}
          emissiveIntensity={0.25}
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* City glow core */}
      <group position={[radius * 1.02, 0, 0]}>
        <mesh>
          <sphereGeometry args={[radius * 0.28, 16, 16]} />
          <meshBasicMaterial color={cityColor} transparent opacity={0.4} depthWrite={false} />
        </mesh>
        <pointLight color={cityColor} intensity={1.2} distance={radius * 12} decay={2} />
        <pointLight color={TREASURY_GOLD} intensity={0.5} distance={radius * 6} decay={2} position={[0, radius * 0.2, 0]} />
      </group>

      {/* Treasury Tower — vertical capital landmark */}
      <group position={[radius * 1.05, 0, 0]}>
        <mesh position={[0, radius * 0.55, 0]}>
          <cylinderGeometry args={[radius * 0.05, radius * 0.07, radius * 1.1, 8]} />
          <meshStandardMaterial
            color={TREASURY_GOLD}
            emissive={TREASURY_GOLD}
            emissiveIntensity={1.4}
            roughness={0.25}
            metalness={0.55}
          />
        </mesh>
        <mesh position={[0, radius * 1.15, 0]}>
          <octahedronGeometry args={[radius * 0.09, 0]} />
          <meshStandardMaterial
            color={TREASURY_ACCENT}
            emissive={TREASURY_ACCENT}
            emissiveIntensity={1.6}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* Vertical district blocks */}
      <instancedMesh ref={towersRef} args={[undefined, undefined, towerCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={cityColor}
          emissive={cityColor}
          emissiveIntensity={1}
          roughness={0.3}
          metalness={0.35}
        />
      </instancedMesh>

      {/* Phase 1 plot preview ring */}
      <instancedMesh ref={plotsRef} args={[undefined, undefined, plotIds.length]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial vertexColors roughness={0.4} metalness={0.3} emissiveIntensity={0.6} />
      </instancedMesh>

      {/* Capital district ring */}
      <mesh position={[radius * 1.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <ringGeometry args={[radius * 0.18, radius * 0.22, 32]} />
        <meshBasicMaterial color={TREASURY_GOLD} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* CC0 GLB landmarks — non-interactive */}
      <OctaviaLandmark radius={radius} />
      <OctaviaTower radius={radius} />
      <OctaviaProp radius={radius} />
    </group>
  );
}
