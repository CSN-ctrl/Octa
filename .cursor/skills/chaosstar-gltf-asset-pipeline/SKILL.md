---
name: chaosstar-gltf-asset-pipeline
description: Import free CC0 GLB models from the internet into ChaosStar R3F scenes without Blender or Spline. Use when adding downloadable 3D assets, gltfjsx conversion, public/models catalog, or useGLTF loaders.
version: 0.1.0
owner: octavia-core-team
---

# ChaosStar GLTF asset pipeline (no Blender, no Spline)

## When to use

- User wants **real 3D models from the internet** (not procedural only)
- Adding landmarks, props, or hero meshes to universe / plot / city views
- Converting `.glb` → typed React components for R3F

## Sources (free, no modeling tool)

| Source | License | Best for |
|--------|---------|----------|
| [Poly Haven](https://polyhaven.com/models) | CC0 | Rocks, structures, nature, high quality |
| [Kenney](https://kenney.nl/assets) | CC0 | Low-poly game props, buildings |
| [Quaternius](https://quaternius.com/) | CC0 | Stylized low-poly packs |
| [Sketchfab](https://sketchfab.com/search?features=downloadable&sort_by=-likeCount&type=models) | Filter CC0 | Hero assets — verify license per model |
| [Khronos glTF samples](https://github.com/KhronosGroup/glTF-Sample-Models) | Permissive | Pipeline tests |
| [ambientCG](https://ambientcg.com/) | CC0 | Textures + some meshes |

See `docs/3d/free-model-sources.md` for curated picks and ChaosStar use cases.

## Pipeline

1. Download `.glb` (prefer Draco-compressed or small poly count for web)
2. Save to `public/models/<category>/<name>.glb`
3. Record attribution in `public/models/README.md` (source URL + license)
4. Convert:

```bash
npm run models:jsx -- public/models/landmarks/tower.glb src/components/three/landmarks/Tower.tsx
```

5. Use in scene:

```tsx
import { Suspense } from "react";
import { Tower } from "@/components/three/landmarks/Tower";

<Suspense fallback={null}>
  <Tower position={[0, 0, 0]} scale={0.5} />
</Suspense>
```

6. Preload in route or scene root: `useGLTF.preload("/models/landmarks/tower.glb")`

## Performance rules

- Run `gltfjsx --transform` (meshopt + texture resize) — wired in `models:jsx` script
- Keep total scene GLB budget under ~5–10 MB for mobile
- Prefer instancing for repeated props (plot tiles stay procedural)
- Dispose geometries/materials on unmount when not using drei's cache

## Do not use

- Blender or Spline (project constraint) — download ready-made GLBs only
- Paid assets without explicit license confirmation

## Related skills

- `chaosstar-r3f-scene-build` — scene composition, lighting, mobile perf
- `r3f-loaders` — useGLTF, Suspense, preloading
- `r3f-best-practices` — perf in useFrame, visibility toggles
- `three-best-practices` — draw calls, compression, dispose

## Checklist

- [ ] License is CC0 or explicitly compatible
- [ ] File in `public/models/` with README entry
- [ ] `gltfjsx --transform` run; component under `src/components/three/`
- [ ] Wrapped in `Suspense`; preload if above-the-fold
- [ ] Mobile tested (DPR + bloom already gated in `SceneCanvas`)
