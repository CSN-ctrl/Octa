# Free 3D models for ChaosStar (no Blender, no Spline)

Use **downloadable GLB/GLTF** assets from these sites. No modeling software required.

## Recommended sources

### Poly Haven — [polyhaven.com/models](https://polyhaven.com/models)

- **License:** CC0 (public domain)
- **Format:** GLB, often with textures
- **Good for:** Natural rocks, sci-fi structures, environment dressing on `/universe` or city landmarks

### Kenney — [kenney.nl/assets](https://kenney.nl/assets)

- **License:** CC0
- **Format:** GLB/OBJ packs (convert to GLB if needed via online tools — not Blender)
- **Good for:** Simple buildings, props, UI-friendly low-poly style

### Quaternius — [quaternius.com](https://quaternius.com/)

- **License:** CC0
- **Format:** GLB packs (space, nature, buildings)
- **Good for:** Stylized planetside structures, vehicles

### Sketchfab — [sketchfab.com](https://sketchfab.com)

- **License:** **Per model** — filter "Downloadable" + "CC0" or "CC Attribution"
- **Format:** GLB export
- **Good for:** One-off hero meshes; always save license link in `public/models/README.md`

### Khronos samples — [github.com/KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models)

- **License:** Sample / permissive
- **Good for:** Testing `gltfjsx` and loader pipeline before production assets

### ambientCG — [ambientcg.com](https://ambientcg.com/)

- **License:** CC0
- **Good for:** PBR textures on procedural meshes; occasional mesh downloads

## ChaosStar use cases

| View | Procedural (today) | Optional GLB upgrade |
|------|-------------------|----------------------|
| `/universe` galaxy | `GalaxyParticles`, `CelestialBody` | Space stations, nebula props (low poly) |
| Plot grid | `PlotInstancedGrid` | Single landmark GLB at spiral center (`octavia-gate.glb` mounted) |
| City / purchase UI | 2D + cards | Small tower or gate GLB as preview |

## Import steps

1. Download `.glb` → `public/models/<category>/`
2. Add row to `public/models/README.md`
3. Run:

```bash
npm run models:jsx -- public/models/landmarks/foo.glb src/components/three/landmarks/Foo.tsx
```

4. Mount inside `SceneCanvas` with `Suspense` (see `docs/3d/no-blender-pipeline.md`)

## Size budget

- Target **&lt; 2 MB** per hero asset after `gltfjsx --transform`
- **&lt; 10 MB** total per scene on mobile
- Prefer low polygon count (&lt; 50k tris per object)

## Legal

- CC0: no attribution required; still document source in README for team traceability
- CC-BY: attribute in README and in-game credits if required by license
