import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface GalaxyVisualizationProps {
  systemProgress?: number;
  octaviaProgress?: number;
  zytheraProgress?: number;
}

export const GalaxyVisualization = ({ 
  systemProgress = 0, 
  octaviaProgress = 0,
  zytheraProgress = 0 
}: GalaxyVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const galaxyRef = useRef<THREE.Points | null>(null);
  const saraktStarRef = useRef<THREE.Mesh | null>(null);
  const octaviaRef = useRef<THREE.Mesh | null>(null);
  const zytheraRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 3, 3);
    cameraRef.current = camera;

    
    // Renderer with safe initialization
let renderer: THREE.WebGLRenderer | null = null;

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.current.appendChild(renderer.domElement);
  rendererRef.current = renderer;
} catch (err) {
  console.error("WebGL initialization failed:", err);
  const fallback = document.createElement("div");
  fallback.style.cssText =
    "color: #ff4d4d; font-family: monospace; text-align: center; padding: 20px;";
  fallback.innerText =
    "⚠️ WebGL not supported or context creation failed.\nTry another browser or enable hardware acceleration.";
  containerRef.current.appendChild(fallback);
  return; // bail out so nothing else runs
}
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Galaxy parameters
    const parameters = {
      count: 100000,
      size: 0.01,
      radius: 2.15,
      branches: 3,
      spin: 3,
      randomness: 5,
      randomnessPower: 4,
      insideColor: '#ff6030',
      outsideColor: '#0949f0'
    };

    // Generate galaxy
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random() * parameters.randomness, Math.random() * parameters.radius);
      const spinAngle = radius * parameters.spin;
      const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

      const negPos = [1, -1];
      const randomX = Math.pow(Math.random(), parameters.randomnessPower) * negPos[Math.floor(Math.random() * negPos.length)];
      const randomY = Math.pow(Math.random(), parameters.randomnessPower) * negPos[Math.floor(Math.random() * negPos.length)];
      const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * negPos[Math.floor(Math.random() * negPos.length)];

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, Math.random() * radius / parameters.radius);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: parameters.size,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    galaxyRef.current = points;

    // Sarakt Star (purple pulsing core)
    const saraktGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const saraktMaterial = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.9
    });
    const saraktStar = new THREE.Mesh(saraktGeometry, saraktMaterial);
    scene.add(saraktStar);
    saraktStarRef.current = saraktStar;

    // Sarakt glow
    const glowGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    saraktStar.add(glow);

    // Octavia (within galaxy arms)
    const octaviaGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const octaviaMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const octavia = new THREE.Mesh(octaviaGeometry, octaviaMaterial);
    scene.add(octavia);
    octaviaRef.current = octavia;

    // Zythera (within galaxy arms)
    const zytheraGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const zytheraMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const zythera = new THREE.Mesh(zytheraGeometry, zytheraMaterial);
    scene.add(zythera);
    zytheraRef.current = zythera;

    // Animation
    const clock = new THREE.Clock();
    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update controls
      controls.update();

      // Rotate galaxy slowly
      if (galaxyRef.current) {
        galaxyRef.current.rotation.y = elapsedTime * 0.05;
      }

      // Pulse Sarakt star
      if (saraktStarRef.current) {
        const intensity = 1 + systemProgress * 0.5;
        const pulse = Math.sin(elapsedTime * 2) * 0.1 + 0.9;
        saraktStarRef.current.scale.set(pulse * intensity, pulse * intensity, pulse * intensity);
      }

      // Orbit Octavia within galaxy arm (branch 0)
      if (octaviaRef.current) {
        const octaviaRadius = 1.2 + octaviaProgress * 0.3;
        const octaviaAngle = elapsedTime * 0.3;
        const branchAngle = 0;
        const spinAngle = octaviaRadius * 3;
        octaviaRef.current.position.x = Math.cos(branchAngle + spinAngle + octaviaAngle) * octaviaRadius;
        octaviaRef.current.position.y = Math.sin(elapsedTime * 0.5) * 0.2;
        octaviaRef.current.position.z = Math.sin(branchAngle + spinAngle + octaviaAngle) * octaviaRadius;
      }

      // Orbit Zythera within galaxy arm (branch 1)
      if (zytheraRef.current) {
        const zytheraRadius = 1.5 + zytheraProgress * 0.3;
        const zytheraAngle = elapsedTime * 0.25;
        const branchAngle = (Math.PI * 2) / 3;
        const spinAngle = zytheraRadius * 3;
        zytheraRef.current.position.x = Math.cos(branchAngle + spinAngle + zytheraAngle) * zytheraRadius;
        zytheraRef.current.position.y = Math.sin(elapsedTime * 0.4) * 0.25;
        zytheraRef.current.position.z = Math.sin(branchAngle + spinAngle + zytheraAngle) * zytheraRadius;
      }

      // Camera circular motion
      camera.position.x = Math.cos(elapsedTime * 0.05) * 4;
      camera.position.z = Math.sin(elapsedTime * 0.05) * 4;
      camera.lookAt(0, 0, 0);

      // Render
      renderer.render(scene, camera);

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
      saraktGeometry.dispose();
      saraktMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      octaviaGeometry.dispose();
      octaviaMaterial.dispose();
      zytheraGeometry.dispose();
      zytheraMaterial.dispose();
    };
  }, [systemProgress, octaviaProgress, zytheraProgress]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ minHeight: '600px' }}
    />
  );
};
