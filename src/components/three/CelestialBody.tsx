import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

type CelestialBodyProps = {
  name: string;
  color: string;
  emissive?: string;
  radius?: number;
  labelColor?: string;
  pulse?: boolean;
  showRing?: boolean;
  ringRadius?: number;
  ringColor?: string;
};

export function CelestialBody({
  name,
  color,
  emissive,
  radius = 0.08,
  labelColor,
  pulse = false,
  showRing = false,
  ringRadius,
  ringColor,
}: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!pulse || !meshRef.current) return;
    const s = Math.sin(state.clock.elapsedTime * 2) * 0.08 + 1;
    meshRef.current.scale.setScalar(s);
    if (glowRef.current) glowRef.current.scale.setScalar(s * 1.6);
  });

  const ring = ringRadius ?? radius * 10;

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.8, 16, 16]} />
        <meshBasicMaterial color={emissive ?? color} transparent opacity={0.22} />
      </mesh>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive ?? color}
          emissiveIntensity={1.2}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <pointLight color={emissive ?? color} intensity={1.4} distance={6} decay={2} />
      {showRing && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ring - 0.002, ring + 0.002, 64]} />
          <meshBasicMaterial
            color={ringColor ?? color}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      <Html
        position={[0, radius * 3.5, 0]}
        center
        distanceFactor={6}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: "rgba(0,0,0,0.55)",
          border: `1px solid ${(labelColor ?? color)}66`,
          color: labelColor ?? color,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </Html>
    </group>
  );
}
