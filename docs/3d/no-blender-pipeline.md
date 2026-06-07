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

### 3. Cursor agent skills (installed in repo)

External skills live under `.cursor/skills/` (synced from `npx skills add`):

- `r3f-best-practices`, `three-best-practices` (emalorenzo/three-agent-skills)
- `r3f-fundamentals` … `r3f-interaction` (EnzeD/r3f-skills)
- `3d-web-experience` (antigravity-awesome-skills)

Project skills:

- `.cursor/skills/chaosstar-r3f-scene-build/SKILL.md`
- `.cursor/skills/chaosstar-gltf-asset-pipeline/SKILL.md`

Re-sync after upstream updates: `npm run skills:sync-3d`

Free model catalog: `docs/3d/free-model-sources.md`

### 4. Live dev MCP (optional)

[r3f-mcp](https://github.com/r3f-mcp/r3f-mcp) lets Cursor inspect and edit a **running** R3F scene. Add to `.cursor/mcp.json` when iterating.

## Out of scope (project constraint)

- **Blender** — not used; download CC0 GLBs instead
- **Spline** — not used; same GLB pipeline as above

## Next steps in code

- Embed `PlotInstancedGrid` on plot purchase or city view
- Add free Poly Haven GLBs for landmarks (towers, gates)
- Extract shared `CelestialBody` colors from design tokens
