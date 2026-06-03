# GMAPX Reference Bundle

This bundle explains how to interpret the generated `.gmapx` JSON packages in `reports/gmapx`.

The goal is reconstruction, not rendering implementation. These references describe how to derive editable visual meshes, indexed textures, color palettes, palette-colorized textures, animation metadata, terrain bindings, render flags, and preserved unknown data from the JSON exports.

## Reference Files

- `01-package-layout.md`: package directories, manifests, and file routing.
- `02-resource-routing.md`: how GNS records, resource map entries, sidecar files, mesh resources, and texture resources connect.
- `03-mesh-geometry.md`: how to build editable tris/quads from mesh JSON.
- `04-textures-palettes.md`: how indexed textures, palettes, ACT files, and palette-colored textures relate.
- `05-animations-rendering-terrain.md`: UV animations, palette animations, render properties, terrain bindings, and current decoder boundaries.
- `06-reconstruction-checklist.md`: step-by-step derivation flow for consumers.
- `07-dedup-fallbacks.md`: texture and palette fallback rules for avoiding duplicate derived assets.
- `08-variant-overlays.md`: general map-state variant overlay rules and base fallback behavior.
- `09-semantic-references.md`: generated mesh and palette reference layer for consumers.
- `10-consolidated-modern-export.md`: four-file-per-map consolidated JSON export and recommended editing model.
- `source-evidence.md`: source-backed evidence table for the major interpretation rules.
- `index.json`: machine-readable listing of the reference files and key package locations.

## Current Decoder Scope

Decoded as high-level JSON:

- GNS resource records and source sidecar mapping.
- Texture resources as 256x1024 4-bit indexed atlases.
- Mesh palette blocks, including 16 main palettes and 16 palette animation frames when present.
- Mesh texture records for textured tris/quads.
- Editable visual mesh polygons, including positions, normals, UVs, texture page, palette ID, terrain binding, untextured perimeter controls, render properties, and preserved raw bytes.
- Texture animation records classified as `UvAnimation`, `PaletteAnimation`, `UnknownAnimation`, or `None`.
- Derived ACT palette files and base indexed texture PNGs.

Preserved or partially decoded:

- Unknown GNS records and trailing GNS bytes.
- Unknown texture record fields.
- Unknown untextured perimeter control bytes.
- Unknown animation records.
- Unused polygon render property slots.

Not yet decoded as complete high-level systems:

- Full terrain tile grids.
- Lighting and background color blocks.
- Mesh animation offset tracks beyond the static editable mesh polygons already exported.
- Runtime script trigger semantics for triggered UV and palette animations.

Those not-yet-decoded blocks remain recoverable from source files and preserved offsets/pointers in mesh JSON.

## Core Principle

Do not treat derived PNGs as the authoritative map data. The lossless path is:

`source files -> decoded JSON with offsets/raw bytes -> derived assets`

The derived files are convenience products. The JSON and copied source sidecars remain the authority for reconstruction.

## Derived Asset Deduplication

When building downstream asset bundles, do not generate duplicate texture or palette files.

If a texture is omitted, unspecified, or byte-identical to the base texture for the map/state, reference the base texture instead of creating another derived texture asset.

Apply the same rule to palettes. If a palette is omitted, unspecified, or byte-identical to the base palette it would replace, reference the base palette instead of creating another derived palette asset.

The source JSON should still preserve each original resource and source relationship. Deduplication applies to derived/exported assets.

The current generated corpus includes a semantic reference layer for meshes and palettes:

```text
reports/gmapx/semantic-reference-summary.json
reports/gmapx/shared/meshes/
reports/gmapx/shared/palettes/
MAP###.gmapx/references/semantic-references.json
```

Texture semantic deduplication is intentionally deferred to a separate texture system.

## Consolidated Modern Export

The current modern-starting export is:

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

This is the recommended starting point for an editor/runtime. It keeps meshes editable per vertex, preserves UV mappings, references one master palette list, and records variant fallback/source relationships.

## Variant Overlay Rule

Map variants should be interpreted as overlays on the base map state.

The base state is:

```text
Primary arrangement + Day + None weather
```

For any variant state, use the variant resource block when it exists. If a variant does not provide a block, fall back to the base block. This applies to textures, palettes, primary mesh geometry, animated mesh data, lighting/background, terrain, texture animations, palette animation frames, and any other source-backed subsystem with state-specific variants.
