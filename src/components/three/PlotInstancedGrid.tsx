import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { plotWorldPosition } from "@/lib/plot-coordinates";

type PlotInstancedGridProps = {
  plotIds: number[];
  ownedPlotIds?: number[];
  tileSpacing?: number;
  maxHeight?: number;
};

const OWNED = new THREE.Color("#22c55e");
const AVAILABLE = new THREE.Color("#6366f1");
const CENTER = new THREE.Color("#c084fc");

/**
 * Instanced octagonal plot tiles — one draw call, no Blender.
 */
export function PlotInstancedGrid({
  plotIds,
  ownedPlotIds = [],
  tileSpacing = 0.35,
  maxHeight = 0.12,
}: PlotInstancedGridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ownedSet = useMemo(() => new Set(ownedPlotIds), [ownedPlotIds]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    plotIds.forEach((plotId, index) => {
      const [x, , z] = plotWorldPosition(plotId, tileSpacing);
      const h = plotId === 1 ? maxHeight * 1.6 : maxHeight;
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(0.28, h, 0.28);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);

      if (plotId === 1) color.copy(CENTER);
      else if (ownedSet.has(plotId)) color.copy(OWNED);
      else color.copy(AVAILABLE);
      mesh.setColorAt(index, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [plotIds, ownedSet, tileSpacing, maxHeight, dummy, color]);

  if (plotIds.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, plotIds.length]} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial vertexColors roughness={0.45} metalness={0.2} />
    </instancedMesh>
  );
}
