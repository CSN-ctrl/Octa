import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface GalaxyVisualizationProps {
  systemProgress?: number;
  octaviaProgress?: number;
  zytheraProgress?: number;
}

export default function GalaxyVisualization({
  systemProgress = 0,
  octaviaProgress = 0,
  zytheraProgress = 0
}: GalaxyVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const galaxyRef = useRef<THREE.Points | null>(null);
  const saraktStarRef = useRef<THREE.Mesh | null>(null);
  const octaviaRef = useRef<THREE.Mesh | null>(null);
  const zytheraRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 3, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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
    saraktStar.userData.clickable = true;
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

    // Mouse interaction
    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects([saraktStar], true);
      
      if (intersects.length > 0) {
        setIsZoomed(prev => !prev);
      }
    };

    const onPointerMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera({ x, y }, camera);
      const intersects = raycasterRef.current.intersectObjects([saraktStar], true);
      
      if (containerRef.current) {
        containerRef.current.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
      }
    };

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);
    containerRef.current.addEventListener('pointermove', onPointerMove);

    // Animation
    const clock = new THREE.Clock();
    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

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

      // Camera motion
      if (!isZoomed) {
        camera.position.x = Math.cos(elapsedTime * 0.05) * 4;
        camera.position.z = Math.sin(elapsedTime * 0.05) * 4;
        camera.lookAt(0, 0, 0);
      } else {
        // Zoom to Sarakt star
        const targetPos = new THREE.Vector3(0.5, 0.3, 1);
        camera.position.lerp(targetPos, 0.02);
        camera.lookAt(0, 0, 0);
      }

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

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeEventListener('click', onClick);
        containerRef.current.removeEventListener('pointermove', onPointerMove);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
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
  }, [systemProgress, octaviaProgress, zytheraProgress, isZoomed]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      <div className="absolute top-4 left-4 text-white font-mono text-xs space-y-1 bg-black/70 p-3 rounded backdrop-blur border border-purple-500/30">
        <div className="font-bold text-sm mb-2">Sarakt Galaxy</div>
        <div>System: {Math.round(systemProgress * 100)}%</div>
        <div className="text-green-400">Octavia: {Math.round(octaviaProgress * 100)}%</div>
        <div className="text-red-400">Zythera: {Math.round(zytheraProgress * 100)}%</div>
      </div>

      {isZoomed && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-purple-900/80 backdrop-blur-sm border border-purple-500/60 rounded-lg px-4 py-3 text-white text-center text-sm">
            <div className="font-bold text-base mb-1">Sarakt Star System</div>
            <div className="text-green-300 text-xs">• Octavia (Sarakt Prime)</div>
            <div className="text-red-300 text-xs">• Zythera</div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-purple-300 text-xs opacity-60 bg-black/50 px-3 py-2 rounded">
        {isZoomed ? 'Click star to zoom out' : 'Click purple star to zoom in'}
      </div>
    </div>
  );
}
