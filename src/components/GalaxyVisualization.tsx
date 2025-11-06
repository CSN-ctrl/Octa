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
  const targetCameraPos = useRef(new THREE.Vector3(0, 4, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Galaxy core (bright center)
    const coreGeo = new THREE.IcosahedronGeometry(0.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Galaxy particles with color gradient
    const count = 50000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color(0x4f46e5); // purple/blue inside
    const colorOutside = new THREE.Color(0x06b6d4); // cyan outside

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 0.5) * 3;
      const spin = radius * 2;
      const branch = ((i % 3) / 3) * Math.PI * 2;
      
      const randomPower = Math.pow(Math.random(), 3);
      const randomSign = () => (Math.random() - 0.5) * 2;

      positions[i3] = Math.cos(branch + spin) * radius + randomSign() * randomPower * 0.5;
      positions[i3 + 1] = randomSign() * randomPower * 0.3;
      positions[i3 + 2] = Math.sin(branch + spin) * radius + randomSign() * randomPower * 0.5;

      const mixedColor = colorInside.clone().lerp(colorOutside, radius / 3);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const galaxyMat = new THREE.PointsMaterial({
      size: 0.015,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);
    galaxyRef.current = galaxy;

    // Sarakt system (positioned in galaxy arm)
    const saraktSystem = new THREE.Group();
    
    // Sarakt star (purple)
    const starGeo = new THREE.IcosahedronGeometry(0.12, 1);
    const starMat = new THREE.MeshBasicMaterial({ 
      color: 0x9333ea,
      transparent: true,
      opacity: 0.95
    });
    const star = new THREE.Mesh(starGeo, starMat);
    star.userData.type = 'clickable';
    saraktSystem.add(star);

    // Star glow
    const glowGeo = new THREE.IcosahedronGeometry(0.2, 1);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    saraktSystem.add(glow);

    // Octavia (green planet)
    const octaviaGeo = new THREE.IcosahedronGeometry(0.05, 1);
    const octaviaMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const octavia = new THREE.Mesh(octaviaGeo, octaviaMat);
    octavia.userData.orbitRadius = 0.4;
    octavia.userData.orbitSpeed = 1.2;
    saraktSystem.add(octavia);

    // Zythera (red planet)
    const zytheraGeo = new THREE.IcosahedronGeometry(0.05, 1);
    const zytheraMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const zythera = new THREE.Mesh(zytheraGeo, zytheraMat);
    zythera.userData.orbitRadius = 0.6;
    zythera.userData.orbitSpeed = 0.8;
    saraktSystem.add(zythera);

    // Position Sarakt system in galaxy arm
    saraktSystem.position.set(1.5, 0.1, 1.2);
    scene.add(saraktSystem);
    saraktGroupRef.current = saraktSystem;

    // Mouse interaction
    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const clickable = saraktSystem.children.filter(c => c.userData.type === 'clickable');
      const intersects = raycasterRef.current.intersectObjects(clickable, true);
      
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
      const clickable = saraktSystem.children.filter(c => c.userData.type === 'clickable');
      const intersects = raycasterRef.current.intersectObjects(clickable, true);
      
      if (containerRef.current) {
        containerRef.current.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
      }
    };

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);
    containerRef.current.addEventListener('pointermove', onPointerMove);

    // Animation
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Rotate galaxy
      if (galaxyRef.current) {
        galaxyRef.current.rotation.y = elapsed * 0.03;
      }

      // Rotate Sarakt system with galaxy
      if (saraktGroupRef.current) {
        saraktGroupRef.current.rotation.y = elapsed * 0.03;
        
        // Pulse star
        const star = saraktGroupRef.current.children[0];
        const pulse = Math.sin(elapsed * 3) * 0.1 + 1;
        star.scale.set(pulse, pulse, pulse);

        // Orbit planets
        saraktGroupRef.current.children.forEach(child => {
          if (child.userData.orbitRadius) {
            const angle = elapsed * child.userData.orbitSpeed;
            child.position.x = Math.cos(angle) * child.userData.orbitRadius;
            child.position.z = Math.sin(angle) * child.userData.orbitRadius;
            child.position.y = Math.sin(elapsed * 0.5 + child.userData.orbitSpeed) * 0.05;
          }
        });
      }

      // Camera zoom logic
      if (isSelected && saraktGroupRef.current) {
        const worldPos = new THREE.Vector3();
        saraktGroupRef.current.getWorldPosition(worldPos);
        targetCameraPos.current.set(
          worldPos.x + 0.5,
          worldPos.y + 0.3,
          worldPos.z + 1
        );
        targetLookAt.current.copy(worldPos);
      } else {
        targetCameraPos.current.set(0, 4, 8);
        targetLookAt.current.set(0, 0, 0);
      }

      camera.position.lerp(targetCameraPos.current, delta * 2);
      
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(10).add(camera.position);
      currentLookAt.lerp(targetLookAt.current, delta * 2);
      camera.lookAt(currentLookAt);

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
      galaxyGeo.dispose();
      galaxyMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      octaviaGeo.dispose();
      octaviaMat.dispose();
      zytheraGeo.dispose();
      zytheraMat.dispose();
      renderer.dispose();
    };
  }, [isSelected]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-slate-950">
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
        {isSelected ? 'Click star again to zoom out' : 'Click the purple star to zoom in'}
      </div>
    </div>
  );
}
