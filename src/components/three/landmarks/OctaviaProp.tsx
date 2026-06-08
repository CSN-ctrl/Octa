import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const MODEL_PATH = "/models/landmarks/octavia-prop.glb";

useGLTF.preload(MODEL_PATH);

type OctaviaPropProps = {
  radius: number;
};

/**
 * CC0 Kenney grass-trees — small coastal prop near the capital district.
 * Raycast disabled so planet/city pointer handlers stay clickable.
 */
export function OctaviaProp({ radius }: OctaviaPropProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const scale = radius * 0.55;

  return (
    <primitive
      object={model}
      position={[radius * 0.98, -radius * 0.12, radius * 0.28]}
      scale={[scale, scale, scale]}
      rotation={[0, Math.PI * 1.15, 0]}
      raycast={() => null}
    />
  );
}
