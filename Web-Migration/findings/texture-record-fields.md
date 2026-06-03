# Heretic Cross-Check: Mesh Texture Record Fields

Heretic is a secondary implementation and should not override the GaneshaDX source or observed binaries. It does, however, independently confirms the same mesh texture-record byte order and gives one useful comment about the packed texture-page byte.

## Relevant Heretic Source

| File | Lines | Evidence |
|---|---:|---|
| `heretic/src/mesh.c` | 99-111 | Textured triangle texture record read order: `au`, `av`, `palette`, skipped byte, `bu`, `bv`, packed page byte, skipped byte, `cu`, `cv`. |
| `heretic/src/mesh.c` | 128-142 | Textured quad texture record read order: same first 10 bytes, plus `du`, `dv`. |
| `heretic/src/mesh.c` | 107, 136 | Comment: `FIXME: Page's byte has two other important bits for the texture image to use.` |
| `heretic/src/mesh.c` | 108, 137 | Uses only low 2 bits of the packed page byte: `span_read_u8(span) & 0x03`. |
| `heretic/src/mesh.c` | 104, 109, 133, 138 | Treats byte 3 and byte 7 as skipped `padding`. |
| `heretic/src/mesh.c` | 314-317 | Normalizes UV by adding `page * 256` to V, then dividing by texture height. |
| `heretic/src/image.c` | 20-41 | Confirms 4bpp texture bytes are two pixels per byte, low nibble first. |

## Comparison With GaneshaDX

GaneshaDX decodes the same texture records more conservatively:

- byte 0-1: vertex A UV
- byte 2: raw palette byte, reduced to `PaletteId` by subtracting 16 until <= 15
- byte 3: `UnknownTextureValue3`
- byte 4-5: vertex B UV
- byte 6: packed `UnknownTextureValue6A`, `TextureSource`, `TexturePage`
- byte 7: `UnknownTextureValue7`
- byte 8-9: vertex C UV
- byte 10-11: vertex D UV for quads only

Heretic agrees on the byte positions but discards:

- byte 3
- byte 7
- byte 6 bits 2-7

Heretic keeps the full palette byte as a float `palette_index`, while GaneshaDX reduces it to 0-15 for rendering. Because the observed corpus contains palette raw values `0x34` and `0x35`, our lossless IR must preserve both `paletteRaw` and derived `paletteId`.

## Added Insight

Heretic does not solve the unknown fields, but it does independently flag byte 6 as not fully decoded. The comment says the page byte has "two other important bits for the texture image to use"; in GaneshaDX those two bits are already separated as `TextureSource`, with the UI label `Texture Source (3=map)`.

This supports the current interpretation:

- byte 6 low 2 bits: texture page, source-confirmed by both GaneshaDX and Heretic
- byte 6 bits 2-3: texture source, source-confirmed by GaneshaDX UI label and hinted by Heretic FIXME
- byte 6 high 4 bits: still unknown/preserved
- byte 3: still unknown/preserved, observed constant `0x78`
- byte 7: still unknown/preserved, observed constant `0x00`

## Confidence Impact

| Field | Current Name | Confidence After Heretic |
|---|---|---|
| byte 3 | `unknownTextureValue3` | preserved, likely padding/control byte; no semantic decode |
| byte 6 low bits | `texturePage` | high confidence |
| byte 6 bits 2-3 | `textureSource` | medium-high confidence; `3=map`, other values need investigation |
| byte 6 high nibble | `unknownTextureValue6A` | preserved unknown |
| byte 7 | `unknownTextureValue7` | preserved, likely padding/control byte; no semantic decode |
| byte 2 high nibble | `paletteRawHighNibble` | preserved unknown; must not be discarded |

## Next Investigation Target

Focus on polygons where:

- `textureSource != 3`
- `unknownTextureValue6A != 0`
- `paletteRawHighNibble != 0`

These are rare enough to inspect manually, and Heretic's byte-6 FIXME suggests those cases may correspond to alternate texture image/source behavior rather than ordinary map texture pages.
