# Mesh Geometry Reference

Use `decoded/meshes/*.json` to derive editable visual meshes.

## Mesh Resource Top Level

Important fields:

- `mapId`: map ID.
- `resourceType`: mesh resource type.
- `state`: arrangement, time, and weather.
- `xFile`: numbered mesh sidecar.
- `stateTextureResource`: selected texture resource for this state.
- `pointers`: source-confirmed block pointers from the mesh resource header.
- `textureAnimations`: 32 animation records when present.
- `polygonRenderProperties`: render flag block and preserved unused slots.
- `meshes[]`: one or more mesh sections.

## meshes[]

Each mesh section contains:

- `meshType`: `PrimaryMesh`, `AnimatedMesh1`, etc.
- `counts`: polygon counts by class.
- `sectionOffsets`: source offsets for each decoded section.
- `sectionLengths`: byte lengths for each decoded section.
- `texturedTriangles[]`
- `texturedQuads[]`
- `untexturedTriangles[]`
- `untexturedQuads[]`
- `endOfPolygonPadding`: preserved padding, if present.

## Polygon Arrays

Each polygon has:

- `polygonIndex`: index within its polygon class.
- `polygonType`: `TexturedTriangle`, `TexturedQuad`, `UntexturedTriangle`, or `UntexturedQuad`.
- `isTextured`: whether `texture` is present.
- `isQuad`: true for quads.
- `vertexCount`: 3 or 4.
- `vertices[]`: editable positions.
- `normals[]`: textured polygon normals. Untextured perimeter polygons currently have no normals.
- `texture`: texture record for textured polygons, otherwise null.
- `terrainBinding`: terrain association for textured polygons when present.
- `untexturedControl`: preserved 4-byte untextured perimeter data when present.
- `renderingProperties`: optional 2-byte render flags.

## Position Coordinates

Each vertex position has both raw source values and GaneshaDX-transformed values:

```text
raw.x, raw.y, raw.z
ganeshaDxPosition.x = -raw.x
ganeshaDxPosition.y = -raw.y
ganeshaDxPosition.z = raw.z
```

For a reconstruction that matches GaneshaDX visual orientation, use `ganeshaDxPosition`.

For a lossless editor, preserve both raw and transformed values or preserve raw plus the transform rule.

## Normals

Textured polygon normals are decoded as signed 16-bit raw values and normalized by 4096:

```text
vector.x = -raw.x / 4096
vector.y = -raw.y / 4096
vector.z = raw.z / 4096
```

Use `normals[]` in the same vertex order as `vertices[]`.

## Textured Polygon UVs

Textured polygon `texture` records include local page UVs and normalized atlas UVs.

Fields:

- `texture.uvCoordinates[]`: original `0..255` page-local UVs.
- `texture.texturePage`: `0..3`, selecting a 256-pixel vertical page in the 256x1024 atlas.
- `texture.normalizedUvCoordinates[]`: precomputed atlas UVs.
- `texture.texturePageRegion`: `{ x: 0, y: texturePage * 256, width: 256, height: 256 }`.

Formula:

```text
u = rawU / 256
v = (rawV + 256 * texturePage) / 1024
```

Use `normalizedUvCoordinates` directly unless you need to recompute from preserved raw values.

## Palette ID

Textured polygon palette selection:

- `texture.paletteRaw`: original source byte.
- `texture.paletteId`: GaneshaDX-normalized palette index, `0..15`.

GaneshaDX normalizes by repeatedly subtracting 16 while the value is greater than 15. That preserves high-nibble observations in `paletteRaw` while giving the renderable palette index in `paletteId`.

## Texture Source and Unknown Texture Fields

Current texture record fields:

- `texture.textureSource`: low-confidence source-observed value from bits 2..3 of the texture page byte.
- `texture.unknownTextureValue3`: byte 3 in the texture record.
- `texture.unknownTextureValue6A`: high nibble of byte 6.
- `texture.unknownTextureValue7`: byte 7 in the texture record.

These fields are preserved. Do not discard or reinterpret them without new source or binary evidence.

## Untextured Perimeter Polygons

Untextured polygons have:

- `texture: null`
- `normals: []`
- `terrainBinding: null`
- `untexturedControl`: preserved 4 bytes

Based on current runtime observation, these are the outer perimeter meshes that render as flat black edges in the original game and common renderers.

For reconstruction, render them with a flat black material and keep their raw control bytes.

## Quads and Tris

The JSON preserves quads as quads. If an output format requires triangles:

- For textured quads, split vertices as `(A, B, C)` and `(B, D, C)` to match GaneshaDX's quad splitting behavior.
- Preserve the original quad in editable data so the operation remains reversible.

## Source Offsets

Every polygon subfield carries:

- `sourceFile`
- `sourceOffset`
- `length`
- endian or raw hex where applicable
- `sourceEvidence`
- `confidence`

Consumers should retain these metadata fields in any lossless intermediate representation.
