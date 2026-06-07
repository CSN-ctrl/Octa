import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as random from "maath/random";

type GalaxyParticlesProps = {
  count?: number;
  radius?: number;
  insideColor?: string;
  outsideColor?: string;
};

/**
 * Procedural spiral galaxy — no external models. Uses maath for distribution.
 */
export function GalaxyParticles({
  count = 6000,
  radius = 2.8,
  insideColor = "#c084fc",
  outsideColor = "#1e1b4b",
}: GalaxyParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const inside = new THREE.Color(insideColor);
    const outside = new THREE.Color(outsideColor);
    const color = new THREE.Color();

    random.inSphere(positions, { radius });

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      const angle = Math.atan2(z, x);
      const dist = Math.sqrt(x * x + z * z);
      const spiral = angle + dist * 2.2;
      positions[i3] = Math.cos(spiral) * dist;
      positions[i3 + 2] = Math.sin(spiral) * dist;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.35 * (1 - dist / radius);

      color.copy(inside).lerp(outside, dist / radius);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, colors };
  }, [count, radius, insideColor, outsideColor]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.04 * delta;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
