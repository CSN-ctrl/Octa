---
name: chaosstar-r3f-scene-build
description: Build professional 3D universe and plot scenes without Blender using React Three Fiber, drei, procedural geometry, and optional free GLB assets. Use for 3D shapes, galaxy views, plot grids, meshes, R3F scenes, or when the user wants 3D without installing Blender.
version: 0.1.0
owner: octavia-core-team
---

# ChaosStar R3F scene build (no Blender)

## When to use

- Universe / galaxy / planet / plot 3D visuals
- User asks for 3D **without Blender**
- Procedural shapes, instanced grids, emissive stars, bloom polish

## Stack (already in repo)

- `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing`
- `three`, `maath` (particle distribution)
- Legacy fallback: `GalaxyVisualization.tsx` (imperative Three.js)

## File layout

| Path | Purpose |
|------|---------|
| `src/components/three/SceneCanvas.tsx` | Shared Canvas, fog, DPR |
| `src/components/three/UniverseGalaxyScene.tsx` | Sarakt galaxy (default universe) |
| `src/components/three/PlotInstancedGrid.tsx` | Instanced plot tiles |
| `src/lib/plot-coordinates.ts` | Octagonal spiral math (shared with seed-plots) |
| `src/components/UniverseVisualization.tsx` | Feature flag + autoscale wrapper |
| `public/models/` | Optional free GLBs (Poly Haven) — no Blender required |

## Professional look without Blender

1. **Lighting** — ambient + directional + emissive `pointLight` on stars
2. **Depth** — fog + dark background (`#030308`)
3. **Particles** — `GalaxyParticles` (maath spiral) + `Stars` from drei
4. **Polish** — subtle `Bloom` (disable on mobile via `useAutoscale`)
5. **Performance** — instancing for plots; reduce particle count on mobile
6. **Labels** — `Html` from drei (not manual DOM overlays)

## Optional asset upgrade (still no Blender)

1. Download CC0 models from [Poly Haven](https://polyhaven.com/models) or [Kenney](https://kenney.nl/assets)
2. Place in `public/models/*.glb`
3. Optimize: `npx gltfjsx public/models/foo.glb --transform -o src/components/three/Foo.tsx`
4. Load with `useGLTF` from drei inside `SceneCanvas`

## Spline alternative

- Quick hero objects: [Spline](https://spline.design) → export GLB or use `@splinetool/r3f-spline`
- GLB export loses interactivity; code export keeps events

## Env flags

- `VITE_USE_R3F_UNIVERSE=false` — revert universe to legacy `GalaxyVisualization`

## Checklist before shipping

- [ ] Mobile: bloom off, fewer particles (`useAutoscale`)
- [ ] `Suspense` around Canvas (remote assets if any)
- [ ] Dispose geometries on unmount (R3F handles most; avoid leaking imperative Three.js)
- [ ] No new imperative Three.js scenes — extend `src/components/three/`

## Do not

- Require Blender for Phase 1 universe/plot previews
- Add GLB files to repo root — use `public/models/`
- Block Phase 1 golden path on heavy 3D routes
