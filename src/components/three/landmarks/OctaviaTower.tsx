import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const MODEL_PATH = "/models/landmarks/octavia-tower.glb";

useGLTF.preload(MODEL_PATH);

type OctaviaTowerProps = {
  radius: number;
};

/**
 * CC0 Kenney building-small-b — secondary tower landmark on the capital ring.
 * Raycast disabled so planet/city pointer handlers stay clickable.
 */
export function OctaviaTower({ radius }: OctaviaTowerProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const scale = radius * 1.25;

  return (
    <primitive
      object={model}
      position={[radius * 1.14, radius * 0.04, -radius * 0.22]}
      scale={[scale, scale, scale]}
      rotation={[0, Math.PI * 0.85, 0]}
      raycast={() => null}
    />
  );
}
