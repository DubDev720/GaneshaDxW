# Reconstruction Checklist

This is the recommended interpretation flow for deriving editable visual map data from `.gmapx` packages.

## 1. Open Package Manifest

Read:

```text
MAP###.gmapx/manifest.json
```

Use `manifest.decoded` to find all decoded data sources.

## 2. Load Resource Map

Read:

```text
decoded/resource-map.json
```

Build lookup tables:

- by `sortedResourceIndex`
- by `xFile`
- by `resourceType`

## 3. Load Textures

Read every file in:

```text
decoded/textures/
```

Build:

```text
textureByXFile[xFile]
```

Keep `decoded.indexedPixelRowsHex` as authoritative indexed pixel data.

## 4. Load Mesh Resources

Read every file in:

```text
decoded/meshes/
```

For each mesh resource, find its matching palette JSON:

```text
palette.sortedResourceIndex == mesh.sortedResourceIndex
palette.xFile == mesh.xFile
```

Then find its state texture:

```text
texture.xFile == mesh.stateTextureResource.xFile
```

Before deriving a specific state variant, apply the variant overlay rule:

1. Identify base resources: `Primary + Day + None`.
2. Identify requested-state resources by `arrangement + time + weather`.
3. For each subsystem, use requested-state data when present.
4. If the requested-state subsystem is missing, fall back to base data.
5. If the requested-state subsystem is byte-identical to base data, reference base data in derived assets.

## 5. Build Editable Geometry

For each `mesh.meshes[]` section:

1. Read `meshType`.
2. Read polygon arrays in this order:
   - `texturedTriangles`
   - `texturedQuads`
   - `untexturedTriangles`
   - `untexturedQuads`
3. For each polygon, use `vertices[].ganeshaDxPosition` for visual reconstruction.
4. Preserve `vertices[].raw` for lossless editing.
5. Use `normals[].vector` for textured polygon normals.
6. Keep quads as quads in editable data.
7. Split quads only when an output renderer requires triangle primitives.

## 6. Assign Materials

For textured polygons:

```text
materialKey = [
  mesh.stateTextureResource.xFile,
  mesh.xFile,
  "main",
  polygon.texture.paletteId
]
```

If runtime palette animation is active, replace `"main"` with an animation-adjusted palette state.

For untextured perimeter polygons:

```text
materialKey = "flat-black-untextured-perimeter"
```

## 7. Assign UVs

Use:

```text
polygon.texture.normalizedUvCoordinates
```

Or recompute:

```text
u = rawU / 256
v = (rawV + 256 * texturePage) / 1024
```

Use the same vertex labels as the polygon vertices.

## 8. Apply Palettes

For static colored textures:

1. Load `texture.decoded.indexedPixelRowsHex`.
2. Select `palette.mainPalettes.palettes[polygon.texture.paletteId]`.
3. For each sampled pixel, use the hex nibble as `colorIndex`.
4. Convert `red5`, `green5`, `blue5` to 8-bit RGB.

For dynamic palette animation:

1. Start with a copy of all main palettes.
2. Apply each active `PaletteAnimation`.
3. Use the adjusted palette at polygon `paletteId`.

When producing derived assets, dedupe textures and palettes:

- Missing or unspecified texture: reference the base texture.
- Texture identical to base texture: reference the base texture.
- Texture identical to another non-base texture: reference the first generated equivalent.
- Missing or unspecified palette: reference the corresponding base palette.
- Palette identical to base palette: reference the base palette.
- Palette identical to another non-base palette: reference the first generated equivalent.

## 9. Apply UV Animations

For each active `UvAnimation`:

1. Compute canvas rectangle in atlas space.
2. Compute source frame rectangle in atlas space.
3. At render time, if a sampled UV falls inside the canvas rectangle, sample from the current source frame rectangle with the same local offset.

Static exporters may preserve UV animation records without baking them.

## 10. Attach Terrain Bindings

For textured polygons with `terrainBinding`, attach:

```text
terrainX
terrainZ
terrainLevel
```

Do not treat this as the full terrain grid. It is a polygon-to-terrain association.

## 11. Attach Render Properties

Attach `polygon.renderingProperties` when present.

At minimum, preserve:

- `rawHex`
- `litTexture`
- invisibility flags
- unknown flags

## 12. Preserve Unknowns

Carry forward:

- `unknown/gns-unknown.json`
- every `rawHex`
- every field marked `source-preserved`
- unknown texture fields
- unknown animation records
- untextured control bytes
- unused render property slot bytes

Lossless modernization depends on these bytes staying attached to the data they came from.

## 13. Keep Variant References Explicit

When an output map state falls back to base data, record that relationship instead of pretending the variant owns a duplicate copy.

Example:

```json
{
  "state": {
    "arrangement": "Secondary",
    "time": "Night",
    "weather": "Normal"
  },
  "texture": {
    "source": "base",
    "reason": "variant missing texture resource"
  }
}
```

This keeps derived packages compact and makes variant behavior auditable.
