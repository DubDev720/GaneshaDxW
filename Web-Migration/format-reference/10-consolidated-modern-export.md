# Consolidated Modern Export

The consolidated export is the recommended starting point for modern editor/runtime work.

It is generated from the lossless `.gmapx` corpus and does not replace it.

## Layout

```text
reports/gmapx-consolidated/
  index.json
  palettes.master.json
  MAP###/
    base-textures.json
    texture-mapping.json
    mesh.json
    metadata.json
```

There are exactly four JSON files per map directory:

- `base-textures.json`
- `texture-mapping.json`
- `mesh.json`
- `metadata.json`

The shared palette list is:

```text
palettes.master.json
```

## Current Totals

At generation time:

- 121 maps.
- 735 total variant states across maps.
- 658 texture uses collapsed to 331 unique indexed textures.
- 188 editable mesh definitions.
- 593 map-local palette resource mappings.
- 1,879 canonical palettes in the master palette list.

## base-textures.json

This file contains the map's unique indexed texture data.

It stores:

- unique texture records by source hash
- 256x1024 4-bit indexed rows
- texture aliases from `xFile` to canonical `textureId`
- variant state for each texture alias
- fallback rule

The texture data remains indexed. Runtime color should come from palette lookup.

## texture-mapping.json

This file ties mesh resources to:

- selected state texture
- canonical texture ID
- palette resource refs into `palettes.master.json`
- mesh section refs
- variant texture resources

Polygon-level UVs and palette IDs live in `mesh.json`; `texture-mapping.json` supplies the resource-level context needed to resolve them.

## mesh.json

This file contains editable mesh definitions and use references.

Mesh data keeps:

- textured triangles
- textured quads
- untextured perimeter triangles
- untextured perimeter quads
- vertices
- normals
- UVs
- texture page
- palette ID
- terrain binding
- render properties
- preserved raw values where currently decoded

Editing model:

- Edit vertices in `ganeshaDxPosition` space.
- Preserve raw values where present for back-reference.
- Keep quads as quads in editor data.
- Split quads only at renderer/export time.
- Keep `texturePage`, `paletteId`, and UV coordinates together.
- Render untextured perimeter polygons as flat black unless later evidence changes this.

## metadata.json

This file carries:

- map ID
- file paths
- source package links
- variant list
- base state
- resource list
- summary counts
- modern export intent
- original-binary patching references

The original-binary path is explicitly lower priority. The binary-patching authority remains:

```text
reports/gmapx/
reports/original-binary/
reports/gmapx-reference/source-evidence.md
```

## Master Palettes

`palettes.master.json` contains every unique 16-color palette.

Maps reference palettes by `paletteRef`.

This is the correct structure for real-time palette rendering:

```text
indexed texture + paletteRef + shader = colored material
```

This avoids baking many duplicate colorized texture files.

## Variant Strategy

Variants should be stored as references and overrides.

Base state:

```text
Primary + Day + None
```

For each variant:

1. Use variant mesh/texture/palette/animation/terrain/lighting data when present.
2. Fall back to base data when missing.
3. Reference canonical data when identical.
4. Only store changed subsystem references as variant-specific.

## Why This Shape

This keeps the editor practical:

- Meshes remain directly editable per vertex.
- UV mappings are intact.
- Quads are not prematurely triangulated.
- Base indexed textures remain compact and palette-independent.
- Palettes are global references.
- Variant data is explicit without duplicating whole maps.
- The lossless `.gmapx` corpus still preserves source offsets and raw bytes for future binary patching.

## Regeneration

Run:

```bash
bun tools/consolidate_gmapx_for_modern_pipeline.ts reports/gmapx reports/gmapx-consolidated
```

or:

```bash
bun run consolidate:gmapx
```
