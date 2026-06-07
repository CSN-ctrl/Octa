# Professional 3D without Blender

ChaosStar ships universe and plot visuals using **code-first 3D** — no Blender install required.

## What you get today

| Feature | Implementation |
|---------|----------------|
| Galaxy on `/universe` | `UniverseVisualization` → R3F `UniverseGalaxyScene` |
| Spiral particles | `GalaxyParticles` (maath + Three.js Points) |
| Sarakt star + planets | `CelestialBody`, `OrbitingPlanet` (procedural spheres) |
| Plot tile grid (ready) | `PlotInstancedGrid` + `plot-coordinates.ts` |
| Mobile perf | `useAutoscale` — fewer particles, bloom off on small screens |

Toggle legacy renderer:

```bash
VITE_USE_R3F_UNIVERSE=false npm run dev
```

## How to make it look professional (no Blender)

### 1. Procedural geometry (default)

- Emissive materials + point lights on stars
- Subtle bloom post-processing (desktop only)
- Fog + starfield background
- Smooth `OrbitControls` with auto-rotate

All defined in `src/components/three/`.

### 2. Free downloadable models (still no Blender)

1. Download `.glb` from [Poly Haven](https://polyhaven.com/models) (CC0)
2. Save to `public/models/`
3. Convert to React component:

```bash
npx gltfjsx public/models/structure.glb --transform -o src/components/three/Structure.tsx
```

4. Import inside `SceneCanvas` with Suspense

### 3. Spline (browser-based modeling)

1. Design at [spline.design](https://spline.design)
2. Export **GLB** (geometry) or use **Code export → react-three-fiber**
3. Wire into `src/components/three/`

### 4. Cursor agent skills (optional install)

```bash
npx add-skill three-agent-skills --skill r3f-best-practices
npx add-skill EnzeD/r3f-skills
```

Project skill: `.cursor/skills/chaosstar-r3f-scene-build/SKILL.md`

### 5. Live dev MCP (optional)

[r3f-mcp](https://github.com/r3f-mcp/r3f-mcp) lets Cursor inspect and edit a **running** R3F scene. Add to `.cursor/mcp.json` when iterating.

## When you *would* add Blender later

- Custom sculpted hero assets (unique ships, cities)
- Blender MCP for prompt-driven modeling
- Not required for Phase 1 universe or plot grid

## Next steps in code

- Embed `PlotInstancedGrid` on plot purchase or city view
- Add free Poly Haven GLBs for landmarks (towers, gates)
- Extract shared `CelestialBody` colors from design tokens
