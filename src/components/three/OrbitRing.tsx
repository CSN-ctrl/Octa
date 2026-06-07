import * as THREE from "three";

type OrbitRingProps = {
  radius: number;
  color: string;
  inclinationDeg?: number;
  highlighted?: boolean;
};

/** Thin orbit path ring around the star */
export function OrbitRing({ radius, color, inclinationDeg = 0, highlighted = false }: OrbitRingProps) {
  const width = highlighted ? 0.006 : 0.002;
  return (
    <mesh rotation={[THREE.MathUtils.degToRad(inclinationDeg), 0, 0]}>
      <ringGeometry args={[radius - width, radius + width, 96]} />
      <meshBasicMaterial
        color={highlighted ? "#fbbf24" : color}
        transparent
        opacity={highlighted ? 0.55 : 0.32}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
