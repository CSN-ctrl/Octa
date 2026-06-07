import * as THREE from "three";

type OrbitRingProps = {
  radius: number;
  color: string;
  inclinationDeg?: number;
};

/** Thin orbit path ring around the star */
export function OrbitRing({ radius, color, inclinationDeg = 0 }: OrbitRingProps) {
  return (
    <mesh rotation={[THREE.MathUtils.degToRad(inclinationDeg), 0, 0]}>
      <ringGeometry args={[radius - 0.002, radius + 0.002, 96]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.32}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
