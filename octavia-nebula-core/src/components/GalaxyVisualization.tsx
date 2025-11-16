import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface GalaxyVisualizationProps {
  systemProgress?: number;
  octaviaProgress?: number;
  zytheraProgress?: number;
  onSelect?: (body: "star" | "octavia" | "zythera", info: { position: { x: number; y: number; z: number }; radius?: number }) => void;
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
  const octaviaOrbitRef = useRef<THREE.Object3D | null>(null);
  const zytheraOrbitRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const starLabelRef = useRef<HTMLDivElement | null>(null);
  const octaviaLabelRef = useRef<HTMLDivElement | null>(null);
  const zytheraLabelRef = useRef<HTMLDivElement | null>(null);
  const zoomAnimRef = useRef<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);

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

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    raycasterRef.current = new THREE.Raycaster();
    pointerRef.current = new THREE.Vector2();

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
      // Switch from blue tones to purple tones
      insideColor: '#c084fc', // violet-400
      outsideColor: '#7c3aed' // violet-600
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

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    // Galaxy center black hole (at 0,0,0)
    const bhGeom = new THREE.SphereGeometry(0.12, 32, 32);
    const bhMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0, metalness: 0.0 });
    const blackHole = new THREE.Mesh(bhGeom, bhMat);
    blackHole.position.set(0, 0, 0);
    scene.add(blackHole);

    // Sarakt Star (emissive core with point light)
    const starPos = new THREE.Vector3(1.6, 0, 1.6); // move further off-center
    const saraktGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const saraktMaterial = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x6d28d9,
      emissiveIntensity: 1.1,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95
    });
    const saraktStar = new THREE.Mesh(saraktGeometry, saraktMaterial);
    saraktStar.position.copy(starPos);
    scene.add(saraktStar);
    saraktStarRef.current = saraktStar;
    const starLight = new THREE.PointLight(0x9f7aea, 1.2, 10, 2);
    starLight.position.copy(saraktStar.position);
    scene.add(starLight);

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
    const octaviaGeometry = new THREE.SphereGeometry(0.06, 24, 24);
    const octaviaMaterial = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6, metalness: 0.05 });
    const octavia = new THREE.Mesh(octaviaGeometry, octaviaMaterial);
    // Create orbital parent to achieve inclined circular orbit
    const octaviaOrbit = new THREE.Object3D();
    octaviaOrbit.position.copy(saraktStar.position);
    // Slight inclination (in radians)
    octaviaOrbit.rotation.x = THREE.MathUtils.degToRad(8);
    // Place planet on x-axis at radius
    const octaviaRadius = 1.2;
    octavia.position.set(octaviaRadius, 0, 0);
    octaviaOrbit.add(octavia);
    scene.add(octaviaOrbit);
    octaviaRef.current = octavia;
    octaviaOrbitRef.current = octaviaOrbit;
    // Orbit ring
    const octaviaRing = new THREE.RingGeometry(octaviaRadius - 0.001, octaviaRadius + 0.001, 128);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, opacity: 0.35, transparent: true, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(octaviaRing, ringMat);
    ringMesh.position.copy(starPos);
    ringMesh.rotation.x = octaviaOrbit.rotation.x;
    scene.add(ringMesh);

    // Zythera (within galaxy arms)
    const zytheraGeometry = new THREE.SphereGeometry(0.06, 24, 24);
    const zytheraMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6, metalness: 0.05 });
    const zythera = new THREE.Mesh(zytheraGeometry, zytheraMaterial);
    const zytheraOrbit = new THREE.Object3D();
    zytheraOrbit.position.copy(saraktStar.position);
    zytheraOrbit.rotation.x = THREE.MathUtils.degToRad(15);
    const zytheraRadius = 1.6;
    zythera.position.set(zytheraRadius, 0, 0);
    zytheraOrbit.add(zythera);
    scene.add(zytheraOrbit);
    zytheraRef.current = zythera;
    zytheraOrbitRef.current = zytheraOrbit;
    const zytheraRing = new THREE.RingGeometry(zytheraRadius - 0.001, zytheraRadius + 0.001, 128);
    const ringMatZ = new THREE.MeshBasicMaterial({ color: 0xef4444, opacity: 0.3, transparent: true, side: THREE.DoubleSide });
    const ringMeshZ = new THREE.Mesh(zytheraRing, ringMatZ);
    ringMeshZ.position.copy(starPos);
    ringMeshZ.rotation.x = zytheraOrbit.rotation.x;
    scene.add(ringMeshZ);

    // HTML Labels
    const makeLabel = (text: string, color: string) => {
      const el = document.createElement('div');
      el.textContent = text;
      el.style.position = 'absolute';
      el.style.pointerEvents = 'auto';
      el.style.padding = '2px 6px';
      el.style.borderRadius = '6px';
      el.style.fontSize = '12px';
      el.style.fontWeight = '600';
      el.style.background = 'rgba(0,0,0,0.5)';
      el.style.border = `1px solid ${color}66`;
      el.style.color = color;
      el.style.userSelect = 'none';
      el.style.transform = 'translate(-50%, -150%)';
      return el;
    };
    const starLabel = makeLabel('Sarakt Star', '#a78bfa');
    const octaviaLabel = makeLabel('Octavia', '#22c55e');
    const zytheraLabel = makeLabel('Zythera', '#ef4444');
    starLabelRef.current = starLabel;
    octaviaLabelRef.current = octaviaLabel;
    zytheraLabelRef.current = zytheraLabel;
    containerRef.current.appendChild(starLabel);
    containerRef.current.appendChild(octaviaLabel);
    containerRef.current.appendChild(zytheraLabel);

    // Zoom helper
    const zoomTo = (target: THREE.Vector3, distance = 1.2, durationMs = 900) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const cam = cameraRef.current;
      const controls = controlsRef.current;
      const startPos = cam.position.clone();
      const startTarget = controls.target.clone();
      const dir = new THREE.Vector3().subVectors(startPos, startTarget).normalize();
      const endTarget = target.clone();
      const endPos = target.clone().add(dir.multiplyScalar(distance));
      const start = performance.now();
      const animate = (t: number) => {
        const elapsed = t - start;
        const k = Math.min(1, elapsed / durationMs);
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        cam.position.lerpVectors(startPos, endPos, eased);
        controls.target.lerpVectors(startTarget, endTarget, eased);
        controls.update();
        if (k < 1) {
          zoomAnimRef.current = requestAnimationFrame(animate);
        }
      };
      if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
      zoomAnimRef.current = requestAnimationFrame(animate);
    };

    // Click handlers on labels
    starLabel.onclick = () => {
      zoomTo(starPos, 1.0);
      if (typeof onSelect === "function") {
        onSelect("star", { position: { x: starPos.x, y: starPos.y, z: starPos.z } });
      }
    };
    octaviaLabel.onclick = () => {
      if (octaviaOrbitRef.current) {
        zoomTo(octaviaOrbitRef.current.position, 1.0);
        if (typeof onSelect === "function") {
          const p = octaviaOrbitRef.current.position;
          onSelect("octavia", { position: { x: p.x, y: p.y, z: p.z }, radius: 1.2 });
        }
      }
    };
    zytheraLabel.onclick = () => {
      if (zytheraOrbitRef.current) {
        zoomTo(zytheraOrbitRef.current.position, 1.2);
        if (typeof onSelect === "function") {
          const p = zytheraOrbitRef.current.position;
          onSelect("zythera", { position: { x: p.x, y: p.y, z: p.z }, radius: 1.6 });
        }
      }
    };

    // Mesh click (raycast) to zoom
    const clickable: Array<{ id: "star" | "octavia" | "zythera"; obj: THREE.Object3D; target: () => THREE.Vector3; dist?: number; radius?: number }> = [
      { id: "star", obj: saraktStar, target: () => starPos.clone(), dist: 1.0 },
      { id: "octavia", obj: octavia, target: () => (octaviaOrbitRef.current ? octaviaOrbitRef.current.position.clone() : octavia.position.clone()), dist: 1.0, radius: 1.2 },
      { id: "zythera", obj: zythera, target: () => (zytheraOrbitRef.current ? zytheraOrbitRef.current.position.clone() : zythera.position.clone()), dist: 1.2, radius: 1.6 },
    ];
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !raycasterRef.current || !pointerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(clickable.map(c => c.obj), true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const match = clickable.find(c => c.obj === hit || hit.parent === c.obj);
        if (match) {
          const t = match.target();
          zoomTo(t, match.dist ?? 1.2);
          if (typeof onSelect === "function") {
            onSelect(match.id, { position: { x: t.x, y: t.y, z: t.z }, radius: match.radius });
          }
        }
      }
    };
    containerRef.current.addEventListener('pointerdown', onPointerDown);

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

      // Planetary orbits (constant angular velocity)
      if (octaviaOrbitRef.current) {
        const baseSpeed = 0.25;
        const speed = baseSpeed * (0.8 + octaviaProgress * 0.4); // slight speed variance via progress
        octaviaOrbitRef.current.rotation.y += speed * renderer.info.render.frame * 0 + speed * 0.016; // ~60fps step
      }
      if (zytheraOrbitRef.current) {
        const baseSpeed = 0.2;
        const speed = baseSpeed * (0.8 + zytheraProgress * 0.4);
        zytheraOrbitRef.current.rotation.y += speed * 0.016;
      }

      // Update HTML labels (screen-space projection)
      const updateLabel = (obj: THREE.Object3D | null, el: HTMLDivElement | null) => {
        if (!obj || !el || !containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const pos = obj.getWorldPosition(new THREE.Vector3()).clone();
        pos.project(camera);
        const x = (pos.x * 0.5 + 0.5) * width;
        const y = (-pos.y * 0.5 + 0.5) * height;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.display = pos.z < 1 ? 'block' : 'none';
      };
      updateLabel(saraktStarRef.current, starLabelRef.current);
      updateLabel(octaviaRef.current, octaviaLabelRef.current);
      updateLabel(zytheraRef.current, zytheraLabelRef.current);

      // Camera circular motion around galaxy center
      camera.position.x = starPos.x + Math.cos(elapsedTime * 0.05) * 4;
      camera.position.z = starPos.z + Math.sin(elapsedTime * 0.05) * 4;
      camera.lookAt(starPos);

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
      if (containerRef.current) {
        containerRef.current.removeEventListener('pointerdown', onPointerDown);
        if (starLabelRef.current) containerRef.current.removeChild(starLabelRef.current);
        if (octaviaLabelRef.current) containerRef.current.removeChild(octaviaLabelRef.current);
        if (zytheraLabelRef.current) containerRef.current.removeChild(zytheraLabelRef.current);
      }
      if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
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
