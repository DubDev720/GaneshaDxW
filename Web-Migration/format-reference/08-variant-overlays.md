# Variant Overlays

Map variants should be interpreted as overlays on base map data.

This is broader than texture and palette deduplication. The same rule applies to any map subsystem where a variant can replace base data.

## Base State

GaneshaDX treats this as the initial/base state:

```text
arrangement = Primary
time = Day
weather = None
```

In source terms, `CurrentMapState.SetInitialMeshData` and `SetInitialTextureData` gather resources for this base state.

## Requested State

A requested map variant is selected by:

```text
arrangement + time + weather
```

Examples:

```text
Primary + Night + None
Secondary + Day + Normal
Secondary + Night + Strong
```

The state values are decoded from GNS resource records and appear in mesh JSON as:

```text
mesh.state.arrangement
mesh.state.time
mesh.state.weather
```

## Overlay Rule

For each subsystem:

1. Look for a resource block in the requested state.
2. If it exists, use it.
3. If it does not exist, fall back to the base state block.
4. If it exists but is byte-identical or structurally identical to the base state block, derived asset bundles should reference the base block instead of creating a duplicate asset.
5. Preserve the variant's source relationship in JSON even when derived assets fall back to base.

## Subsystems Covered

Apply the overlay rule to:

- state texture resource
- primary mesh source
- lighting and background source
- palette source
- grayscale palette source
- terrain source
- texture animation source
- palette animation frame source
- animated mesh instruction source
- animated mesh section sources 1 through 8
- polygon render properties
- preserved unknown blocks associated with a variant resource

## Texture Example

If a night variant does not provide a texture resource:

```text
variant texture -> base texture
```

If it provides a texture resource whose `sourceSha256` matches the base texture:

```text
variant logical texture -> base physical texture asset
```

The variant can still keep a logical reference to the variant resource for auditability.

## Palette Example

If a weather variant provides mesh geometry but no palette block:

```text
variant palette source -> base palette source
```

If it provides palette data identical to base:

```text
variant logical palette -> base physical palette asset
```

## Mesh Example

If a variant provides no primary mesh block, use the base primary mesh.

If a variant provides only texture animation data, do not duplicate the base mesh in a derived bundle. Reference:

```text
geometry: base
textureAnimations: variant
```

## Recommended Variant Manifest Shape

A downstream modern package should make fallback explicit.

Example:

```json
{
  "stateId": "Secondary-Night-Normal",
  "baseStateId": "Primary-Day-None",
  "sources": {
    "primaryMesh": {
      "logicalSource": "base",
      "reason": "variant missing primary mesh"
    },
    "texture": {
      "logicalSource": "variant",
      "physicalAsset": "base",
      "reason": "variant texture identical to base texture"
    },
    "palettes": {
      "logicalSource": "base",
      "reason": "variant missing palette block"
    },
    "textureAnimations": {
      "logicalSource": "variant",
      "physicalAsset": "variant"
    }
  }
}
```

## Identity Checks

Use byte identity when source bytes exist:

```text
sourceSha256
```

Use structural identity when comparing decoded blocks:

- texture: hash of `decoded.indexedPixelRowsHex`
- palette: hash of `colors[].rawWordHex`
- mesh geometry: hash of polygon positions, normals, UV records, terrain bindings, untextured controls, render properties, and raw preserved bytes
- animations: hash of 20-byte `rawHex` records
- unknown blocks: hash of `rawHex`

## Lossless Requirement

Fallbacks and deduplication should reduce derived asset duplication, not erase source facts.

Always preserve:

- original resource entries
- state values
- source files
- source offsets
- raw bytes
- source evidence
- confidence levels
- explicit fallback reason
