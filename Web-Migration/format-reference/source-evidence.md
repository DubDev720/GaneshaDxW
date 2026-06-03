# Source Evidence

This table lists the main source-backed interpretation rules used by the JSON references.

| Topic | Rule | Source evidence |
|---|---|---|
| Base state selection | Base resources are `Primary + Day + None`. | `Resources/CurrentMapState.cs`, `SetInitialMeshData` and `SetInitialTextureData`, lines 44-70 |
| Requested state selection | Variant resources match requested arrangement, time, and weather. | `Resources/CurrentMapState.cs`, `AssignStateResources`, lines 73-97 |
| State texture fallback | State texture falls back to initial/base texture when no requested-state texture exists. | `Resources/CurrentMapState.cs`, `SetCurrentMapStateReferences`, lines 99-107 |
| Subsystem fallback | `MapStateData.SetStateResources` checks state mesh resources first, then initial/base resources for each subsystem. | `Resources/ContentDataTypes/MapStateData.cs`, lines 176-356 |
| Animated mesh fallback | Animated mesh sections also search state resources first and initial/base resources when absent. | `Resources/ContentDataTypes/MapStateData.cs`, lines 358-500 |
| Texture dimensions | Texture resources are 256x1024. | `Resources/ResourceContent/TextureResourceData.cs`, `TextureWidth`, `TextureHeight`, lines 15-17 |
| Texture pixel decode | Each byte stores two 4-bit indices, low nibble first then high nibble. | `Resources/ResourceContent/TextureResourceData.cs`, `ProcessPixels`, lines 40-52 |
| Palette pointer | Mesh palette block starts at little-endian pointer offset 68. | `Resources/ResourceContent/MeshResourceData.cs`, `TexturePalettePointer`, line 16, `ProcessTexturePalettes`, lines 511-549 |
| Palette format | 16 palettes, each with 16 colors, each color stored as little-endian 16-bit word. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessTexturePalettes`, lines 511-549 |
| Palette bits | Palette word is transparency bit, 5-bit blue, 5-bit green, 5-bit red. | `Resources/ContentDataTypes/Palettes/Palette.cs`, `GetRawData`, lines 21-40 |
| Palette color conversion | 5-bit channel scales to 8-bit with `round(channel * 255 / 31)`. | `Resources/ContentDataTypes/Palettes/PaletteColor.cs`, `ToColor`, lines 32-43 |
| ACT export | ACT export writes first 16 colors as `channel5 * 8`, then pads to 256 RGB triples. | `Resources/MapData.cs`, `ExportPalette`, lines 222-246 |
| Mesh counts | Polygon counts are read per mesh section before position data. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessMeshPolyCounts`, lines 213-251 |
| Position transform | Raw position maps to GaneshaDX position as `(-x, -y, z)`. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessMeshPositionData`, lines 287-320 |
| Normal transform | Raw normal maps to vector as `(-x/4096, -y/4096, z/4096)`. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessMeshNormalData`, lines 351-392 |
| Texture record layout | Textured polygons store UVs, palette byte, texture page byte, and unknown texture fields. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessMeshTextureDataPerPoly`, lines 408-449 |
| Palette ID normalization | Palette byte is reduced to 0..15 by subtracting 16 until in range. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessMeshTextureDataPerPoly`, lines 430-435 |
| Texture page | Texture page is the low two bits of texture page byte. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessMeshTextureDataPerPoly`, lines 437-439 |
| UV atlas formula | `u = rawU / 256`, `v = (rawV + 256 * TexturePage) / 1024`. | `Resources/ContentDataTypes/Polygons/Polygon.cs`, `BuildVertex`, lines 542-547 |
| Palette shader | Shader samples grayscale texture, applies `PaletteColors[index]`, then lighting. | `Content/FFTPolygonShader.fx`, `ApplyPalette` and `PixelShaderFunction`, lines 493-522 |
| Dynamic palette application | Runtime render path sends `AnimationAdjustedPalettes[PaletteId].ShaderColors`. | `Resources/ContentDataTypes/Polygons/Polygon.cs`, `SetPolygonEffect`, lines 553-584 |
| Palette animation | Palette animations override one main palette with a palette animation frame. | `Rendering/SceneRenderer.cs`, lines 139-183 |
| Untextured controls | Untextured polygons preserve four control bytes. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessUnknownPolygonData`, lines 452-469 |
| Terrain binding | Textured polygons carry packed terrain Z/level and terrain X bytes. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessTerrainBinding`, lines 471-490 |
| End-of-polygon padding | Padding after polygon data is preserved if present. | `Resources/ResourceContent/MeshResourceData.cs`, `ProcessUnknownPostPolygonData`, lines 492-508 |
| Texture animation classification | Animation records are classified as UV, palette, unknown, or none. | `Resources/ContentDataTypes/TextureAnimations/AnimatedTextureInstructions.cs`, lines 14-34 |
| UV animation fields | UV animation record fields map to canvas, source, size, frame count, duration, and mode. | `Resources/ContentDataTypes/TextureAnimations/UvAnimation.cs`, lines 35-80 |
| Palette animation fields | Palette animation record fields map to overridden palette, start index, frame count, duration, and mode. | `Resources/ContentDataTypes/TextureAnimations/PaletteAnimation.cs`, lines 32-64 |
| Render properties | Polygon render properties decode lit flag, invisibility flags, and unknown flags. | `Resources/ContentDataTypes/Polygons/PolygonRenderingProperties.cs`, lines 30-52 |

Generated docs are not used as specification here. They are only navigation aids. The rules above are grounded in actual source files and observed JSON outputs.
