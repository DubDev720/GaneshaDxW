# Map Loading Pipeline Source Navigation

This report is source-backed against the actual GaneshaDX C# source. Generated documentation was not used as authority.

## 1. GNS and Sidecar Loading Path

### Entry points

GaneshaDX can reach map loading through:

- `Common/FileBrowser.cs:12-20` via `OpenMapDialog()`, which filters for `gns` and calls `MapData.LoadMapDataFromFullPath(result.Path)`.
- `Environment/Stage.cs:179-180` via file drop, which calls `MapData.LoadMapDataFromFullPath(e.Files[0])`.
- `Ganesha.cs:66-68` via deferred startup open, which calls `MapData.LoadMapDataFromFullPath(_mapToOpenOnLoad)`.
- `Resources/MapData.cs:30-31` via reload, which reconstructs `MapFolder + Path.DirectorySeparatorChar + MapName + ".gns"`.

### Active load sequence

`Resources/MapData.cs:35-65` is the active top-level loader:

1. It rejects paths whose extension lower-cases to anything other than `.gns` (`MapData.cs:35-40`).
2. It resets global map resource lists (`MapData.cs:43-46`).
3. It derives `MapName` from the GNS basename and `MapFolder` from the GNS directory (`MapData.cs:48-49`).
4. It reads the entire GNS file into bytes and constructs `new Gns(gnsData)` (`MapData.cs:51-52`).
5. It calls `ProcessAllResources()` to parse the GNS bytes into `MapResource` records (`MapData.cs:54`, implementation at `MapData.cs:78-112`).
6. It calls `SetResourceFileData(MapFolder + Path.DirectorySeparatorChar + MapName)` to discover and attach numbered sidecar files (`MapData.cs:55`, implementation at `MapData.cs:114-150`).
7. If every relevant resource has an attached sidecar, it initializes the default state to primary/day/no weather (`MapData.cs:57-64`).

### GNS parsing behavior in the active loader

`Resources/GnsData/Gns.cs:15-18` stores `RawData` only. Its `ProcessData()` method is commented out at construction time, so the dormant `GnsResourceRow` and `GnsUnknownRow` parser is not currently the active loading authority.

The active parser is `MapData.ProcessAllResources()`:

- It walks `Gns.RawData` in 20-byte chunks (`MapData.cs:78-99`).
- Each chunk is passed to `new MapResource(resourceRawData)` (`MapData.cs:92`).
- Chunks shorter than 20 bytes become `ResourceType.UnknownTrailingData` in `MapResource` (`MapResource.cs:31-37`) and are ignored by the loader because only mesh and texture resources are added (`MapData.cs:94-96`).
- Relevant resources are sorted by `FileSector` (`MapData.cs:101`).
- Relevant resources are divided into mesh and texture lists (`MapData.cs:103-111`).

Source-confirmed GNS record fields used by `MapResource`:

| Field | Offset | Length | Endian / encoding | Source evidence | Confidence |
|---|---:|---:|---|---|---|
| record header | 0 | 1 | byte enum-like value; accepted values are `34`, `48`, `112` | `MapResource.cs:24`, `MapResource.cs:58-67` | source-confirmed |
| arrangement id | 2 | 1 | byte; `1` means secondary, all else primary | `MapResource.cs:27`, `MapResource.cs:90-96` | source-confirmed |
| time/weather byte | 3 | 1 | bit string; first bit selects day/night, next 3 bits select weather | `MapResource.cs:28`, `MapResource.cs:98-123` | source-confirmed |
| resource type high byte | 4 | 1 | must be `1` for known resource type mapping | `MapResource.cs:25`, `MapResource.cs:58-87` | source-confirmed |
| resource type low byte | 5 | 1 | `23` texture, `46` initial mesh, `47` override mesh, `48` alternate-state mesh, other values map to padded/unknown types | `MapResource.cs:26`, `MapResource.cs:69-80` | source-confirmed |
| file sector | 8 | 2 | unsigned 16-bit little-endian | `MapResource.cs:29`, `MapResource.cs:126-128`, `Utilities.cs:46-48` | source-confirmed |
| other bytes | mixed | 14 bytes total across unused offsets | preserved raw; not interpreted by active loader | `MapResource.cs:8`, `MapData.cs:281-283` | observed/source-preserved |

The active loader does not interpret a sidecar file number directly from a GNS field. Instead, it:

1. Builds the unique relevant resource `FileSector` list in GNS order after resources have already been sorted by `FileSector` (`MapData.cs:101`, `MapData.cs:119-125`).
2. Scans possible sidecar paths from `MAP###.0` upward to `MAP###.200` (`MapData.cs:127-143`).
3. Adds any existing sidecar file in numeric extension order (`MapData.cs:129-135`).
4. Assigns `resourceXFiles[index]` and `resourceFileData[index]` to `AllResources[index]` only when the count of discovered sidecars equals the count of relevant resources (`MapData.cs:145-148`).

So the numbered sidecar mapping is currently positional:

```text
sorted relevant GNS resource rows by FileSector
        |
        v
existing MAP###.<number> files in ascending numeric extension order
        |
        v
AllResources[index].SetResourceData(sidecarNumber, sidecarBytes)
```

For MAP001 in the current corpus, a source-rule parse found:

- `MAP/MAP001.GNS` size: 2,388 bytes.
- Active parser rows: 119 full 20-byte rows plus one 8-byte trailing chunk.
- Relevant mesh/texture rows: 40.
- Numbered sidecars: 40.
- First assignments by source behavior:
  - GNS offset `0x0000`, sector `10027`, texture -> `MAP001.8`
  - GNS offset `0x0014`, sector `10091`, initial mesh -> `MAP001.9`
  - GNS offset `0x0028`, sector `10110`, override mesh -> `MAP001.11`

This observed mapping supports the source behavior, but the behavior is still defined by `MapData.cs`, not by the observation.

### Sidecar resource decoding

`MapResource.SetResourceData()` stores the sidecar number as `XFile`, stores the raw sidecar bytes, then dispatches by type:

- Texture resources use `new TextureResourceData(RawResourceData)` (`MapResource.cs:45-52`).
- Mesh resources use `new MeshResourceData(RawResourceData)` (`MapResource.cs:45-52`).
- Any other type throws (`MapResource.cs:53-55`), though non-mesh/non-texture resources are filtered earlier by `MapData.ProcessAllResources()`.

`MapData.SaveMap()` writes the original GNS raw bytes unchanged (`MapData.cs:281-283`) and writes each rebuilt texture/mesh resource back to its assigned `XFile` number (`MapData.cs:285-300`). That means the current application already treats GNS non-decoded bytes as preserved metadata.

## 2. Relevant Classes and Responsibilities

| Class / function | Responsibility | Inputs | Outputs | Binary structures read | Unknowns / cautions |
|---|---|---|---|---|---|
| `MapData.LoadMapDataFromFullPath()` | Top-level `.GNS` loader and map-state initializer | `MAP###.GNS` path | global `Gns`, `AllResources`, mesh/texture lists, current state | whole GNS file as bytes | Global mutable state; does not validate sidecar content before constructing resource data |
| `Gns.Gns()` | Stores raw GNS data | `List<byte>` | `Gns.RawData` | none beyond byte storage | `ProcessData()` is commented out |
| `MapData.ProcessAllResources()` | Active GNS row scanner | `Gns.RawData` | `MapResource` rows filtered to mesh/texture | 20-byte records plus trailing short row | Treats every full 20-byte span as a candidate row |
| `MapResource.MapResource()` | Decodes GNS resource row fields | one 20-byte candidate row | resource type, arrangement, time, weather, file sector | header/type bytes; arrangement byte; time/weather bitfield; little-endian file sector | many row bytes are preserved but uninterpreted |
| `MapData.SetResourceFileData()` | Discovers and attaches numbered sidecars | `mapRoot` and `AllResources` | `MapResource.XFile`, `ResourceData` | sidecar whole-file bytes | Sidecar mapping is positional by `FileSector` sort plus ascending extension scan, not direct by a GNS file-number field |
| `MapResource.SetResourceData()` | Dispatches sidecar bytes by resource type | sidecar number, sidecar bytes | `TextureResourceData` or `MeshResourceData` | whole sidecar | throws for unexpected type |
| `TextureResourceData` | Decodes texture sidecar | texture sidecar bytes | grayscale 256x1024 `Texture2D` | one byte -> two 4-bit pixels | texture is rendered grayscale; palette application is elsewhere |
| `MeshResourceData` | Decodes mesh/resource sidecar sections | mesh sidecar bytes | polygons, palettes, lights, terrain, animations, unknown byte spans | pointer table and pointed sections | many unknown/padding regions already tracked partially |
| `CurrentMapState.SetState()` | Selects state resources and fallbacks | arrangement/time/weather | `MapStateData` references | no direct binary read | state selection affects which decoded resource supplies terrain, palettes, lighting, etc. |
| `MapStateData.SetStateResources()` | Chooses resource providers for current state | initial/state resource lists and texture | state-level references | no direct binary read | fallback logic is important for modern format grouping |
| `Polygon`, `Vertex`, `PolygonRenderingProperties` | Hold mesh polygon data | filled by `MeshResourceData` | decoded geometry and render flags | positions, normals, UVs, terrain binding, render flags | renderer-facing transforms negate X/Y |
| `Palette`, `PaletteColor` | Hold 16-color palettes | filled by `MeshResourceData` | 5-bit RGB plus transparency | 16-bit packed color words | raw palette word order must be preserved |
| `AnimatedTextureInstructions`, `UvAnimation`, `PaletteAnimation`, `UnknownAnimation` | Decode 20-byte texture-animation slots | 20-byte animation records | typed animation object or unknown raw bytes | UV/palette animation record bytes | `UnknownAnimation.GetRawData()` preserves unknown records; `AnimatedTextureInstructions.GetRawData()` currently zeros unknown animations |
| `Terrain`, `TerrainTile` | Hold terrain grid | terrain pointed section | two-level terrain tile grid | width, length, 8-byte tiles, fixed 2048-byte per level payload | terrain padding is source-confirmed and must be preserved |

## 3. Proposed Independent Decoder Architecture

Build a source-assisted decoder as a non-rendering binary-analysis toolkit:

```text
decoder/
  inventory/
    group MAP###.GNS and MAP###.<number> files
  gns/
    parse 20-byte candidate records
    preserve ignored rows and trailing bytes
    classify records using MapResource rules
    derive sidecar mapping using MapData.SetResourceFileData rules
  resources/
    keep every sidecar as raw bytes first
    dispatch texture/mesh only after manifest mapping is proven
  mesh/
    parse pointer table and pointed sections
    emit decoded fields with provenance
    emit raw spans for every section and gap
  texture/
    parse 4-bit texture bytes without applying renderer assumptions
  state/
    model CurrentMapState / MapStateData resource fallback logic
  validation/
    compare byte-perfect rebuilds where source has write logic
```

Core design rule: decoded structures must be layered on top of raw spans, never replacing them.

Every decoded field should include:

```json
{
  "value": "...",
  "sourceFile": "MAP001.GNS",
  "sourceOffset": 8,
  "length": 2,
  "endian": "little",
  "sourceEvidence": [
    {
      "file": "Resources/ResourceContent/MapResource.cs",
      "function": "SetFileSectorData",
      "lines": "126-128"
    }
  ],
  "confidence": "source-confirmed"
}
```

Unknown bytes should be first-class:

```json
{
  "kind": "unknown_or_padding",
  "sourceFile": "MAP001.9",
  "sourceOffset": 500,
  "length": 2,
  "rawHex": "0000",
  "reason": "gap before texture palette pointer",
  "sourceEvidence": [
    {
      "file": "Resources/ResourceContent/MeshResourceData.cs",
      "function": "ProcessUnknownPostPolygonData",
      "lines": "492-509"
    }
  ],
  "confidence": "source-preserved"
}
```

## 4. Milestone Plan

### Milestone 1: GNS manifest/index

- Implement inventory of GNS files and numbered sidecars.
- Implement the active 20-byte row parser from `MapData.ProcessAllResources()` and `MapResource`.
- Preserve all rows, including non-relevant rows and trailing data.
- Emit source evidence for every interpreted GNS field.
- Validate against corpus counts: relevant rows must equal discovered sidecars for maps that GaneshaDX can load.

### Milestone 2: Numbered resource mapping

- Reproduce `SetResourceFileData()` exactly:
  - sort relevant resources by `FileSector`;
  - scan sidecars from extension `0` through `200`;
  - attach existing sidecars positionally.
- Record both the sorted mapping and the original GNS record offset.
- Flag count mismatches without guessing.

### Milestone 3: Mesh/resource data

- Parse mesh sidecar pointer table using the pointer constants in `MeshResourceData.cs:15-31`.
- Decode only source-confirmed sections first:
  - mesh polygon counts;
  - positions;
  - normals;
  - texture coordinate records;
  - terrain binding;
  - known padding/gaps.
- Preserve all section ranges and inter-section gaps.
- Add byte-perfect round-trip tests before expanding interpretation.

### Milestone 4: Palettes

- Decode 16 palettes x 16 colors at the texture-palette pointer (`MeshResourceData.cs:511-549`).
- Decode palette animation frames separately (`MeshResourceData.cs:870-907`).
- Preserve packed 16-bit raw words because transparency and 5-bit RGB are source-confirmed.

### Milestone 5: Textures

- Decode texture sidecars as raw 4-bit indexed/grayscale pixel nibbles per `TextureResourceData.ProcessPixels()` (`TextureResourceData.cs:40-52`).
- Keep the original byte stream as authoritative.
- Do not design material rendering yet.

### Milestone 6: Terrain

- Decode terrain pointer, width, length, two terrain levels, 8-byte tile records, and fixed per-level padding per `MeshResourceData.ProcessTerrain()` (`MeshResourceData.cs:693-825`).
- Preserve `Unknown0A`, `Unknown0B`, `Unknown1`, `Unknown5*`, and `Unknown6*` fields as named unknown bitfields.
- Validate emitted raw tile bytes through `TerrainTile.GetRawData()` (`TerrainTile.cs:203-263`) once write-side tests exist.

### Milestone 7: Lighting

- Decode directional light color/direction block, ambient color, and background colors per `MeshResourceData.ProcessLightingAndBackground()` and helpers (`MeshResourceData.cs:551-691`).
- Preserve overflow color values and post-background padding.

### Milestone 8: Animations

- Decode texture animation table: 32 x 20-byte records (`MeshResourceData.cs:846-868`).
- Classify UV, palette, empty, and unknown animation slots per `AnimatedTextureInstructions.cs:15-32`.
- Preserve unknown animation bytes explicitly; do not mirror `AnimatedTextureInstructions.GetRawData()` behavior that zeros non-UV/non-palette unknowns (`AnimatedTextureInstructions.cs:46-59`).
- Decode mesh animation instruction chunk only after reviewing `Resources/ContentDataTypes/MeshAnimations/*`.

### Milestone 9: Unknown/preserved data

- Add a coverage audit that proves every byte of every source file is either:
  - decoded;
  - raw-preserved as part of a known structure;
  - raw-preserved as unknown/padding.
- No final modern format should be considered complete until this coverage report is clean.

## 5. Lossless Intermediate Representation Proposal

Use a directory IR such as:

```text
MAP001.gmapx/
  manifest.json
  sources/
    MAP001.GNS
    MAP001.8
    MAP001.9
  decoded/
    gns-records.json
    resource-map.json
    states.json
    resources/
      resource-000-texture.json
      resource-001-mesh.json
  raw-spans/
    MAP001.GNS.spans.json
    MAP001.9.spans.json
  unknown/
    MAP001.GNS.unknown.json
    MAP001.9.unknown.json
  checksums.json
```

Recommended IR principles:

- Store raw source files byte-for-byte.
- Store decoded facts separately from raw bytes.
- Each decoded value carries provenance: source file, offset, length, endian/bit encoding, source C# evidence, confidence.
- Preserve original GNS record order and sorted resource order.
- Preserve sidecar extension number and its positional mapping reason.
- Preserve unknown bytes as addressable spans, not comments.
- Include a coverage summary per source file.

Example high-level `manifest.json` shape:

```json
{
  "format": "ganesha-gmapx-ir",
  "version": 1,
  "mapId": "MAP001",
  "sourceGroup": {
    "gns": "sources/MAP001.GNS",
    "sidecars": [
      { "xFile": 8, "path": "sources/MAP001.8" },
      { "xFile": 9, "path": "sources/MAP001.9" }
    ]
  },
  "decoder": {
    "authority": "GaneshaDX source",
    "sourceCommit": "record-current-git-commit"
  }
}
```

## 6. Modern Clean Map Format: Later-Stage Target Only

Do not design this as the working format yet. After the lossless IR can rebuild original files byte-perfectly, a clean format can separate game concepts from original storage artifacts:

```text
MAP001.ganesha-map/
  map.json
  geometry/
    primary.mesh.json
    animated-01.mesh.json
  textures/
    texture-pages.bin
    texture-pages.png
  palettes/
    palettes.json
  terrain/
    terrain.json
  lighting/
    lighting.json
  animations/
    texture-animations.json
    mesh-animations.json
  states/
    primary-day-none.json
  raw/
    original.gmapx/
```

The modern format should:

- keep semantic names and normalized state grouping;
- support lossless export back through the IR;
- include a raw/original payload or link to the `.gmapx` source package;
- avoid exposing original sector ordering unless needed for round-trip export.

## 7. Immediate Next Implementation Task

Implement the GNS/resource inventory and manifest decoder first.

Concrete first task:

1. Create a TypeScript CLI using `bun` that reads a map directory.
2. Group files by `MAP###`.
3. Parse every `.GNS` into 20-byte candidate rows using `MapData.ProcessAllResources()` behavior.
4. Decode `MapResource` fields with source evidence metadata.
5. Discover sidecars by ascending numeric extension and assign them positionally after sorting relevant rows by `FileSector`.
6. Emit `reports/gns/MAP001.gns.json` and a corpus summary.
7. Add tests proving MAP001 has 40 relevant resources, 40 sidecars, and an 8-byte trailing GNS span.

No rendering, editing, UI, or final modern format work should begin before this decoder can explain and preserve the original GNS/resource mapping.
