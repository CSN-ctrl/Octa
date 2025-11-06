import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function GalaxyVisualization() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const galaxyRef = useRef(null);
  const saraktGroupRef = useRef(null);
  const animationIdRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const [isSelected, setIsSelected] = useState(false);
  const targetCameraPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      65,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 20);
    cameraRef.current = camera;

    // Renderer
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

    // Purple star
    const starGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xa042ff });
    const star = new THREE.Mesh(starGeo, starMat);
    star.userData = { type: 'star', pulseBase: 1 };
    saraktGroup.add(star);

    // Glow
    const glowGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xa042ff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    saraktGroup.add(glow);

    // Sarakt Prime (blue planet)
    const planet1Geo = new THREE.SphereGeometry(0.15, 16, 16);
    const planet1Mat = new THREE.MeshBasicMaterial({ color: 0x33ccff });
    const planet1 = new THREE.Mesh(planet1Geo, planet1Mat);
    planet1.userData = { type: 'orbit1', radius: 1.5, speed: 1 };
    saraktGroup.add(planet1);

    // Zythera (red planet)
    const planet2Geo = new THREE.SphereGeometry(0.2, 16, 16);
    const planet2Mat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
    const planet2 = new THREE.Mesh(planet2Geo, planet2Mat);
    planet2.userData = { type: 'orbit2', radius: 2.5, speed: 0.6 };
    saraktGroup.add(planet2);

    scene.add(saraktGroup);

    // Mouse tracking
    const onMouseMove = (event) => {
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

    const onPointerMove = (event) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera({ x, y }, camera);
      const intersects = raycasterRef.current.intersectObjects(saraktGroup.children, true);
      
      containerRef.current.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    };

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);
    containerRef.current.addEventListener('pointermove', onPointerMove);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      // Rotate galaxy
      if (galaxyRef.current) {
        galaxyRef.current.rotation.y = t * 0.02;
      }

      // Rotate Sarakt system
      if (saraktGroupRef.current) {
        saraktGroupRef.current.rotation.y = t * 0.05;

        // Animate planets
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

      // Camera focus animation
      if (isSelected && saraktGroupRef.current) {
        targetCameraPos.current.set(
          saraktGroupRef.current.position.x,
          saraktGroupRef.current.position.y + 1,
          saraktGroupRef.current.position.z + 3
        );
        targetLookAt.current.copy(saraktGroupRef.current.position);
        
        camera.position.lerp(targetCameraPos.current, 0.03);
        
        const lookAtCurrent = new THREE.Vector3();
        camera.getWorldDirection(lookAtCurrent);
        lookAtCurrent.multiplyScalar(10).add(camera.position);
        lookAtCurrent.lerp(targetLookAt.current, 0.03);
        camera.lookAt(lookAtCurrent);
      }

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
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
      if (rendererRef.current && containerRef.current) {
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
    };
  }, [isSelected]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950 to-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {isSelected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-purple-900/60 backdrop-blur-sm border border-purple-500/60 rounded-lg px-4 py-3 text-white text-center text-sm">
            <div className="font-bold text-base mb-1">Sarakt Star System</div>
            <div className="text-cyan-300">• Sarakt Prime</div>
            <div className="text-red-300">• Zythera</div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-purple-300 text-xs opacity-60">
        Click the purple star system to focus
      </div>
    </div>
  );
}
