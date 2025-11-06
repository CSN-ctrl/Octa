// src/components/GalaxyVisualization.tsx
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Points,
  PointMaterial,
  OrbitControls,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef, useState } from "react";

export default function GalaxyVisualization() {
  const galaxyPoints = useMemo(() => {
    const count = 25000;
    const positions = new Float32Array(count * 3);
    const radius = 15;
    const branches = 6;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const spin = r * 1.5;
      const branch = i % branches;
      const branchAngle = (branch / branches) * Math.PI * 2;
      const randomX =
        Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1);
      const randomY =
        Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1);
      const randomZ =
        Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1);

      positions[i3] =
        Math.cos(branchAngle + spin) * r + randomX * 0.4;
      positions[i3 + 1] = randomY * 0.2;
      positions[i3 + 2] =
        Math.sin(branchAngle + spin) * r + randomZ * 0.4;
    }

    return positions;
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        background: "radial-gradient(circle at center, #050011, #000)",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 6, 20], fov: 65 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <OrbitControls enableZoom enablePan />
        <GalaxyPoints positions={galaxyPoints} />
        <ClickableSaraktStar />
      </Canvas>
    </div>
  );
}

type GalaxyPointsProps = { positions: Float32Array };

function GalaxyPoints({ positions }: GalaxyPointsProps) {
  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color="#b499ff"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

// ---- Sarakt Star System (off-center + interactive)
function ClickableSaraktStar() {
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const orbit1 = useRef<THREE.Mesh>(null);
  const orbit2 = useRef<THREE.Mesh>(null);
  const [selected, setSelected] = useState(false);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) groupRef.current.rotation.y = t * 0.05;
    if (orbit1.current)
      orbit1.current.position.set(Math.cos(t) * 1.5, 0, Math.sin(t) * 1.5);
    if (orbit2.current)
      orbit2.current.position.set(Math.cos(t * 0.6) * 2.5, 0, Math.sin(t * 0.6) * 2.5);

    if (starRef.current) {
      const pulse = Math.sin(t * 3) * 0.05 + 1;
      starRef.current.scale.set(pulse, pulse, pulse);
    }

    // Smooth focus animation when selected
    if (selected) {
      camera.position.lerp(
        new THREE.Vector3(
          groupRef.current!.position.x,
          groupRef.current!.position.y + 1,
          groupRef.current!.position.z + 3
        ),
        0.03
      );
      camera.lookAt(groupRef.current!.position);
    }
  });

  const handleClick = () => {
    setSelected((prev) => !prev);
  };

  return (
    <group
      ref={groupRef}
      position={[6, 0, -8]}
      onClick={handleClick}
      onPointerOver={(e) => {
        document.body.style.cursor = "pointer";
        e.stopPropagation();
      }}
      onPointerOut={(e) => {
        document.body.style.cursor = "default";
        e.stopPropagation();
      }}
    >
      {/* Purple Star */}
      <mesh ref={starRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color="#a042ff" />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color="#a042ff"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sarakt Prime */}
      <mesh ref={orbit1}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#33ccff" />
      </mesh>

      {/* Zythera */}
      <mesh ref={orbit2}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>

      {/* Label (appears when selected) */}
      {selected && (
        <Html distanceFactor={10}>
          <div
            style={{
              color: "#fff",
              background: "rgba(50,0,80,0.6)",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "14px",
              textAlign: "center",
              border: "1px solid rgba(160,66,255,0.6)",
            }}
          >
            <strong>Sarakt Star System</strong>
            <br />
            • Sarakt Prime<br />
            • Zythera
          </div>
        </Html>
      )}
    </group>
  );
        }
