import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const MODEL_PATH = "/models/landmarks/octavia-gate.glb";

useGLTF.preload(MODEL_PATH);

type OctaviaLandmarkProps = {
  radius: number;
};

/**
 * CC0 Kenney building — first GLB landmark in the Octavia capital pipeline.
 * Raycast disabled so planet/city pointer handlers stay clickable.
 */
export function OctaviaLandmark({ radius }: OctaviaLandmarkProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const scale = radius * 1.4;

  return (
    <primitive
      object={model}
      position={[radius * 1.08, 0, radius * 0.06]}
      scale={[scale, scale, scale]}
      rotation={[0, Math.PI * 0.35, 0]}
      raycast={() => null}
    />
  );
}
