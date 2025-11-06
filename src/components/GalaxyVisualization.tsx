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
  const saraktGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const [isSelected, setIsSelected] = useState(false);
  const targetCameraPos = useRef(new THREE.Vector3(0, 6, 20));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      65,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Galaxy particles
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
      const randomX = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1);
      const randomY = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1);
      const randomZ = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1);

      positions[i3] = Math.cos(branchAngle + spin) * r + randomX * 0.4;
      positions[i3 + 1] = randomY * 0.2;
      positions[i3 + 2] = Math.sin(branchAngle + spin) * r + randomZ * 0.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xb499ff,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
    });

    const galaxy = new THREE.Points(geometry, material);
    scene.add(galaxy);
    galaxyRef.current = galaxy;

    // Sarakt Star System
    const saraktGroup = new THREE.Group();
    saraktGroup.position.set(6, 0, -8);
    saraktGroupRef.current = saraktGroup;

    const starGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xa042ff });
    const star = new THREE.Mesh(starGeo, starMat);
    star.userData = { type: 'star', pulseBase: 1 };
    saraktGroup.add(star);

    const glowGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xa042ff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    saraktGroup.add(glow);

    const planet1Geo = new THREE.SphereGeometry(0.15, 16, 16);
    const planet1Mat = new THREE.MeshBasicMaterial({ color: 0x33ccff });
    const planet1 = new THREE.Mesh(planet1Geo, planet1Mat);
    planet1.userData = { type: 'orbit1', radius: 1.5, speed: 1 };
    saraktGroup.add(planet1);

    const planet2Geo = new THREE.SphereGeometry(0.2, 16, 16);
    const planet2Mat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
    const planet2 = new THREE.Mesh(planet2Geo, planet2Mat);
    planet2.userData = { type: 'orbit2', radius: 2.5, speed: 0.6 };
    saraktGroup.add(planet2);

    scene.add(saraktGroup);

    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(saraktGroup.children, true);
      
      if (intersects.length > 0) {
        setIsSelected(prev => !prev);
      }
    };

    const onPointerMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera({ x, y }, camera);
      const intersects = raycasterRef.current.intersectObjects(saraktGroup.children, true);
      
      if (containerRef.current) {
        containerRef.current.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
      }
    };

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);
    containerRef.current.addEventListener('pointermove', onPointerMove);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      if (galaxyRef.current) {
        galaxyRef.current.rotation.y = t * 0.02;
      }

      if (saraktGroupRef.current) {
        saraktGroupRef.current.rotation.y = t * 0.05;

        saraktGroupRef.current.children.forEach(child => {
          if (child.userData.type === 'orbit1') {
            child.position.set(
              Math.cos(t) * child.userData.radius,
              0,
              Math.sin(t) * child.userData.radius
            );
          } else if (child.userData.type === 'orbit2') {
            child.position.set(
              Math.cos(t * child.userData.speed) * child.userData.radius,
              0,
              Math.sin(t * child.userData.speed) * child.userData.radius
            );
          } else if (child.userData.type === 'star') {
            const pulse = Math.sin(t * 3) * 0.05 + 1;
            child.scale.set(pulse, pulse, pulse);
          }
        });
      }

      // Camera zoom logic
      if (isSelected && saraktGroupRef.current) {
        targetCameraPos.current.set(
          saraktGroupRef.current.position.x,
          saraktGroupRef.current.position.y + 1,
          saraktGroupRef.current.position.z + 3
        );
        targetLookAt.current.copy(saraktGroupRef.current.position);
      } else {
        // Reset to default view
        targetCameraPos.current.set(0, 6, 20);
        targetLookAt.current.set(0, 0, 0);
      }

      camera.position.lerp(targetCameraPos.current, 0.03);
      
      const lookAtCurrent = new THREE.Vector3();
      camera.getWorldDirection(lookAtCurrent);
      lookAtCurrent.multiplyScalar(10).add(camera.position);
      lookAtCurrent.lerp(targetLookAt.current, 0.03);
      camera.lookAt(lookAtCurrent);

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeEventListener('click', onClick);
        containerRef.current.removeEventListener('pointermove', onPointerMove);
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
      starGeo.dispose();
      starMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      planet1Geo.dispose();
      planet1Mat.dispose();
      planet2Geo.dispose();
      planet2Mat.dispose();
      renderer.dispose();
    };
  }, [isSelected]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950 to-black">
      <div ref={containerRef} className="w-full h-full" />
      
      <div className="absolute top-4 left-4 text-white font-mono text-xs space-y-1 bg-black/70 p-3 rounded backdrop-blur border border-purple-500/30">
        <div className="font-bold text-sm mb-2">Sarakt Galaxy</div>
        <div>System Progress: {Math.round(systemProgress * 100)}%</div>
        <div>Octavia Pop: {Math.round(octaviaProgress * 100)}%</div>
        <div>Zythera Pop: {Math.round(zytheraProgress * 100)}%</div>
      </div>

      {isSelected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-purple-900/80 backdrop-blur-sm border border-purple-500/60 rounded-lg px-4 py-3 text-white text-center text-sm">
            <div className="font-bold text-base mb-1">Sarakt Star System</div>
            <div className="text-cyan-300 text-xs">• Sarakt Prime (Octavia)</div>
            <div className="text-red-300 text-xs">• Zythera</div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-purple-300 text-xs opacity-60 bg-black/50 px-3 py-2 rounded">
        {isSelected ? 'Click star again to zoom out' : 'Click the purple star system to zoom in'}
      </div>
    </div>
  );
}
