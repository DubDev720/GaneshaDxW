# Textures and Palettes

Textures are indexed. Palettes color them.

The base texture PNGs are not final colored textures. They are grayscale visualizations of the 4-bit texture indices.

## Texture JSON

Texture JSON files live in:

```text
decoded/textures/
```

Important fields:

- `xFile`: source sidecar number.
- `format.width`: `256`.
- `format.height`: `1024`.
- `format.bitsPerPixel`: `4`.
- `format.pixelsPerByte`: `2`.
- `format.pixelOrder`: low nibble first, then high nibble.
- `decoded.indexedPixelRowsHex`: 1024 rows of 256 hex characters.
- `decoded.pixelValueHistogram`: count of pixel indices `0..f`.

Each character in `indexedPixelRowsHex[y][x]` is the palette color index for that texture pixel.

## Base Texture PNGs

Base texture PNGs live in:

```text
derived/base-textures/
```

Each pixel is written as grayscale:

```text
rgba = [index * 17, index * 17, index * 17, 255]
```

This mirrors the source application's texture resource conversion. It is useful for inspection and shader-style palette application.

## Palette JSON

Palette JSON files live in:

```text
decoded/palettes/
```

A mesh palette resource contains:

- `mainPalettes.present`
- `mainPalettes.palettes[]`
- `paletteAnimationFrames.present`
- `paletteAnimationFrames.palettes[]`

Each palette has:

- `paletteIndex`: `0..15`.
- `colors[]`: 16 color entries.

Each color entry has:

- `colorIndex`: `0..15`.
- `rawWordHex`: preserved 16-bit source word.
- `red5`, `green5`, `blue5`: 5-bit channel values.
- `isTransparent`: transparency bit as decoded by GaneshaDX logic.

## 5-Bit to 8-Bit Color

For normal RGBA output:

```text
r = round(red5 * 255 / 31)
g = round(green5 * 255 / 31)
b = round(blue5 * 255 / 31)
a = isTransparent && r == 0 && g == 0 && b == 0 ? 0 : 255
```

GaneshaDX only makes fully black transparent palette entries alpha-zero in normal rendering. Other entries keep alpha 255.

## ACT Files

ACT files live in:

```text
derived/act-palettes/
```

They are convenience exports:

- First 16 RGB triples come from the decoded palette.
- Remaining entries are zero-padded to 256 colors.
- Channel conversion uses GaneshaDX's ACT export behavior, effectively `channel5 * 8`.

The authoritative color data remains the palette JSON.

## Applying Palettes to Polygons

For each textured polygon:

1. Find the mesh JSON.
2. Read `stateTextureResource.xFile`.
3. Load the texture JSON with the same `xFile`.
4. Load the palette JSON with the same mesh `sortedResourceIndex` and `xFile`.
5. Read `polygon.texture.paletteId`.
6. Use `mainPalettes.palettes[paletteId]` for static coloring, or the animation-adjusted palette for runtime animation.
7. Sample texture index at the polygon UV.
8. Convert palette color to RGBA.

## Shader-Style Palette Application

GaneshaDX uses dynamic palette application:

1. Sample grayscale texture.
2. Convert sampled red channel to a palette index.
3. Return `PaletteColors[index]`.
4. Apply lighting.

The shader index matching is approximately:

```text
if textureColor.r is between index * 16 / 255 and index * 18 / 255:
  use PaletteColors[index]
```

For offline reconstruction from JSON, use the exact 4-bit index from `indexedPixelRowsHex` instead of inferring from grayscale.

## Recommended Derived Color Texture Outputs

If a downstream tool needs fully colored texture images, generate them as derived assets, not replacement source data.

Suggested layout:

```text
derived/colorized-textures/
  resource-001-x9/
    main-00.png
    main-01.png
    ...
    main-15.png
    anim-00.png
    ...
    anim-15.png
```

For editable reconstruction, material identity should include:

```text
texture xFile + palette resource xFile + palette kind + paletteId
```

This prevents different palettes that share one indexed texture from being collapsed into one material.

## Texture Fallback and Deduplication

Derived asset bundles should not write duplicate texture files.

Use this rule:

1. Choose the base texture for the map/state from `mesh.stateTextureResource`.
2. If a requested texture is omitted or unspecified, use the base texture.
3. If a requested texture's source bytes or decoded indexed pixels are identical to the base texture, reference the base texture.
4. If two non-base textures are identical to each other, write one derived asset and reference it from both consumers.

Recommended identity checks:

- Prefer source `sourceSha256` when comparing original texture resources.
- For generated colorized textures, compare the derivation key and/or output bytes.
- A colorized texture derivation key should include indexed texture identity plus palette identity.

Example texture derivation key:

```text
texture.sourceSha256 + palette.sourceSha256-or-paletteRawHash + paletteKind + paletteId
```

The lossless JSON should still retain all original texture resources and their source metadata even if the derived asset bundle references one shared texture file.

## Palette Fallback and Deduplication

Apply the same rule to palettes.

1. Treat `mainPalettes.palettes[paletteId]` as the base palette for static reconstruction.
2. If an alternate palette is omitted or unspecified, use the corresponding base palette.
3. If an alternate palette's 16 decoded colors are identical to the base palette, reference the base palette.
4. If multiple palette animation frames are identical, write one derived palette asset and reference it from each frame.

Recommended palette identity:

```text
palette.colors[].rawWordHex joined in colorIndex order
```

or, for ACT exports:

```text
sha256(first 16 RGB triples)
```

Do not use file names alone for palette identity. Some maps and states can carry distinct resources that decode to identical palette data.
