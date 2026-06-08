import { Suspense, useCallback, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import type { WebGLRenderer } from "three";
import { Loader2 } from "lucide-react";

type SceneCanvasProps = {
  children: ReactNode;
  className?: string;
  fov?: number;
  dpr?: number | [number, number];
  cameraPosition?: [number, number, number];
};

function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading 3D scene</span>
    </div>
  );
}

/**
 * Shared R3F canvas — tone mapping, responsive DPR, suspense boundary.
 */
export function SceneCanvas({
  children,
  className,
  fov = 75,
  dpr = [1, 2],
  cameraPosition = [3, 3, 3],
}: SceneCanvasProps) {
  const onCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
    };
    const onContextRestored = () => {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);
  }, []);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          dpr={dpr}
          camera={{ position: cameraPosition, fov, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          onCreated={onCreated}
          style={{ background: "#030308" }}
        >
          <color attach="background" args={["#030308"]} />
          <fog attach="fog" args={["#030308", 4, 18]} />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}
