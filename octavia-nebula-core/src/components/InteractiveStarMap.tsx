import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GalaxyVisualizationProps {
  validators?: Array<{
    id: string;
    stake: number;
    uptime: number;
    status: 'active' | 'inactive' | 'slashing';
  }>;
  blockHeight?: number;
  networkHealth?: number;
}

export const GalaxyVisualization = ({ 
  validators = [],
  blockHeight = 0,
  networkHealth = 1
}: GalaxyVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const galaxyRef = useRef<THREE.Points | null>(null);
  const validatorMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const saraktSystemRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Initialize scene once
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

    // Galaxy core (immutable center)
    const coreGeo = new THREE.IcosahedronGeometry(0.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Galaxy particles
    const count = 50000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color(0x4f46e5);
    const colorOutside = new THREE.Color(0x06b6d4);

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
    
    // Sarakt star
    const starGeo = new THREE.IcosahedronGeometry(0.12, 1);
    const starMat = new THREE.MeshBasicMaterial({ 
      color: 0x9333ea,
      transparent: true,
      opacity: 0.95
    });
    const star = new THREE.Mesh(starGeo, starMat);
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

    // Octavia (green)
    const octaviaGeo = new THREE.IcosahedronGeometry(0.05, 1);
    const octaviaMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const octavia = new THREE.Mesh(octaviaGeo, octaviaMat);
    octavia.userData.orbitRadius = 0.4;
    octavia.userData.orbitSpeed = 1.2;
    saraktSystem.add(octavia);

    // Zythera (red)
    const zytheraGeo = new THREE.IcosahedronGeometry(0.05, 1);
    const zytheraMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const zythera = new THREE.Mesh(zytheraGeo, zytheraMat);
    zythera.userData.orbitRadius = 0.6;
    zythera.userData.orbitSpeed = 0.8;
    saraktSystem.add(zythera);

    // Position Sarakt system in galaxy arm
    saraktSystem.position.set(1.5, 0.1, 1.2);
    scene.add(saraktSystem);
    saraktSystemRef.current = saraktSystem;

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    const clock = new THREE.Clock();
    let disposed = false;

    const tick = () => {
      if (disposed) return;

      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Rotate galaxy
      if (galaxyRef.current) {
        galaxyRef.current.rotation.y = elapsed * 0.03;
      }

      // Rotate Sarakt system with galaxy
      if (saraktSystemRef.current) {
        saraktSystemRef.current.rotation.y = elapsed * 0.03;
        
        // Pulse star
        const star = saraktSystemRef.current.children[0];
        const pulse = Math.sin(elapsed * 3) * 0.1 + 1;
        star.scale.set(pulse, pulse, pulse);

        // Orbit planets
        saraktSystemRef.current.children.forEach(child => {
          if (child.userData.orbitRadius) {
            const angle = elapsed * child.userData.orbitSpeed;
            child.position.x = Math.cos(angle) * child.userData.orbitRadius;
            child.position.z = Math.sin(angle) * child.userData.orbitRadius;
            child.position.y = Math.sin(elapsed * 0.5 + child.userData.orbitSpeed) * 0.05;
          }
        });
      }

      // Camera follows mouse slightly
      camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * delta * 0.5;
      camera.position.y += (mouseRef.current.y * 2 + 4 - camera.position.y) * delta * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    // Resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
  }, []);

  // Update validators (separate from scene init)
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const existingIds = new Set(validatorMeshesRef.current.keys());
    const newIds = new Set(validators.map(v => v.id));

    // Remove old validators
    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        const mesh = validatorMeshesRef.current.get(id);
        if (mesh) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          validatorMeshesRef.current.delete(id);
        }
      }
    });

    // Add/update validators
    validators.forEach((validator, index) => {
      let mesh = validatorMeshesRef.current.get(validator.id);
      
      if (!mesh) {
        const geo = new THREE.IcosahedronGeometry(0.08, 1);
        const mat = new THREE.MeshBasicMaterial();
        mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        validatorMeshesRef.current.set(validator.id, mesh);
      }

      // Position based on stake (orbit radius)
      const orbitRadius = 1.5 + (validator.stake / 100) * 1.5;
      const angle = (index / validators.length) * Math.PI * 2;
      mesh.position.x = Math.cos(angle) * orbitRadius;
      mesh.position.z = Math.sin(angle) * orbitRadius;
      mesh.position.y = (Math.random() - 0.5) * 0.3;

      // Color based on status
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (validator.status === 'active') {
        material.color.setHex(0x10b981);
        material.opacity = 0.8 + validator.uptime * 0.2;
      } else if (validator.status === 'slashing') {
        material.color.setHex(0xef4444);
        material.opacity = 0.9;
      } else {
        material.color.setHex(0x6b7280);
        material.opacity = 0.4;
      }

      // Scale based on stake
      const scale = 0.5 + (validator.stake / 100) * 1.5;
      mesh.scale.set(scale, scale, scale);

      mesh.userData.validator = validator;
    });
  }, [validators]);

  return (
    <div className="w-full h-full bg-slate-950 relative">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />
      
      <div className="absolute top-4 left-4 text-white font-mono text-sm space-y-1 bg-black/50 p-3 rounded backdrop-blur">
        <div>Block: {blockHeight.toLocaleString()}</div>
        <div>Network Health: {(networkHealth * 100).toFixed(1)}%</div>
        <div>Validators: {validators.length}</div>
        <div className="text-xs text-gray-400 mt-2">
          <div>Green = Active | Red = Slashing | Gray = Inactive</div>
          <div>Size = Stake Weight | Distance = Orbit Radius</div>
        </div>
      </div>
    </div>
  );
};
