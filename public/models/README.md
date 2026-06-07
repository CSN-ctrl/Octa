# GLB model catalog

Place downloaded **CC0 or compatible** `.glb` files here. No Blender or Spline in this pipeline — download ready-made assets only.

## Layout

```
public/models/
  landmarks/     # towers, gates, monuments
  props/         # small repeatable objects
  environment/   # rocks, trees, terrain chunks
```

## Catalog

| File | Source | License | Used in |
|------|--------|---------|---------|
| _(none yet)_ | — | — | Procedural R3F only |

## Add a model

1. Download from [free sources](../../docs/3d/free-model-sources.md)
2. Copy `.glb` into the right subfolder
3. Add a row to the table above
4. Convert: `npm run models:jsx -- public/models/.../file.glb src/components/three/.../Component.tsx`
