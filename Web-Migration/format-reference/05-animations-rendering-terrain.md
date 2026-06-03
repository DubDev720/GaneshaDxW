# Animations, Render Properties, and Terrain Bindings

This file covers derived non-geometry data that currently appears in mesh JSON.

## Texture Animations

Texture animation records live at:

```text
decoded/meshes/<resource>.json -> textureAnimations.animations[]
```

Each record has:

- `animationIndex`: `0..31`.
- `sourceOffset`: offset in the mesh sidecar.
- `length`: 20 bytes.
- `rawHex`: preserved raw record.
- `textureAnimationType`: `UvAnimation`, `PaletteAnimation`, `UnknownAnimation`, or `None`.
- `decoded`: structured fields when known.

## UV Animations

`UvAnimation` records describe a source rectangle copied into a canvas rectangle at runtime.

Decoded fields:

- `canvasX`, `canvasY`, `canvasTexturePage`
- `sizeWidth`, `sizeHeight`
- `firstFrameX`, `firstFrameY`, `firstFrameTexturePage`
- `animationModeRaw`, `animationMode`
- `frameCount`
- `frameDuration`
- unknown raw fields

Atlas-space rectangles:

```text
canvasAtlasX = canvasX
canvasAtlasY = canvasY + canvasTexturePage * 256
sourceAtlasX = firstFrameX
sourceAtlasY = firstFrameY + firstFrameTexturePage * 256
```

Normalized texture coordinates:

```text
u0 = atlasX / 256
v0 = atlasY / 1024
u1 = (atlasX + width) / 256
v1 = (atlasY + height) / 1024
```

Runtime frame selection still depends on game time and animation mode. The JSON preserves enough data to derive frame rectangles, but triggered animation semantics are not fully modeled yet.

## Palette Animations

`PaletteAnimation` records replace one main palette with one animation-frame palette at runtime.

Decoded fields:

- `overriddenPaletteId`: main palette index to replace.
- `animationStartIndex`: first palette animation frame index.
- `frameCount`
- `frameDuration`
- `animationModeRaw`, `animationMode`
- unknown raw fields

Static reconstruction may use `mainPalettes`.

Runtime reconstruction should:

1. Copy all `mainPalettes` into an animation-adjusted palette array.
2. For each active `PaletteAnimation`, compute frame ID.
3. Use `animationStartIndex + frameId` to select from `paletteAnimationFrames.palettes`.
4. Replace `animationAdjustedPalettes[overriddenPaletteId]`.
5. Apply polygon `paletteId` against the adjusted palettes.

## Unknown Animation Records

Records with `textureAnimationType: "UnknownAnimation"` are preserved but not interpreted. Keep:

- `rawHex`
- source offset
- source evidence
- confidence

Do not discard these records.

## Polygon Render Properties

Render properties live in:

```text
decoded/meshes/<resource>.json -> polygonRenderProperties
```

Each polygon may also have:

```text
polygon.renderingProperties
```

Decoded fields include:

- `litTexture`
- `invisibleNortheast`
- `invisibleSoutheast`
- `invisibleSouthwest`
- `invisibleNorthwest`
- `invisibleNorthNortheast`
- `invisibleEastNortheast`
- `invisibleEastSoutheast`
- `invisibleSouthSoutheast`
- `invisibleSouthSouthwest`
- `invisibleWestSouthwest`
- `invisibleWestNorthWest`
- `invisibleNorthNorthwest`
- `unknown1`
- `unknown14`
- `unknown15`

The top-level `polygonRenderProperties.unusedSlotRawHex` preserves fixed-capacity render slots that were not attached to active polygons.

## Lighting Boundary

The mesh JSON currently preserves lighting and background pointers:

```text
pointers.lightingAndBackgroundPointer
```

It does not yet expose full decoded lighting/background objects. The source block is still recoverable from:

- the mesh sidecar in `source/`
- the pointer offset
- source code evidence in `MeshResourceData.ProcessLightingAndBackground`

Until that decoder layer is added, lighting reconstruction should be treated as future work.

## Terrain Bindings

Textured polygons may have:

```text
polygon.terrainBinding
```

Fields:

- `packedTerrainZAndLevel`: original packed byte.
- `terrainX`: original terrain X byte.
- `terrainZ`: `packedTerrainZAndLevel >> 1`.
- `terrainLevel`: `packedTerrainZAndLevel & 1`.

These fields bind visual polygons to terrain coordinates, but they are not the full terrain tile grid.

## Terrain Grid Boundary

The mesh JSON currently preserves the terrain pointer:

```text
pointers.terrainPointer
```

It does not yet expose all terrain tiles as a complete decoded grid. Full terrain decoding remains a future decoder layer.

## Untextured Perimeter Controls

Untextured polygons have:

```text
polygon.untexturedControl
```

Fields:

- `unknownUntexturedValueA`
- `unknownUntexturedValueB`
- `unknownUntexturedValueC`
- `unknownUntexturedValueD`
- `rawHex`

These bytes are preserved. Runtime observation currently identifies these polygons as the black outer perimeter geometry.
