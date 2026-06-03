# Web Migration Documentation Bundle

This directory is the efficient documentation set for building the initial web-based GaneshaDX migration.

It is intentionally smaller than the full generated `docs/` tree. The goal is fast implementation, not exhaustive generated API browsing.

## Recommended Reading Order

1. `format-reference/10-consolidated-modern-export.md`
2. `format-reference/06-reconstruction-checklist.md`
3. `format-reference/03-mesh-geometry.md`
4. `format-reference/04-textures-palettes.md`
5. `format-reference/08-variant-overlays.md`
6. `architecture/50-source-level-pipeline-review.md`
7. `source-profiles/Resources__ResourceContent__MeshResourceData.md`
8. `source-profiles/Resources__ContentDataTypes__Polygons__Polygon.md`
9. `source-profiles/Rendering__SceneRenderer.md`
10. `diagrams/source-level-map-pipeline.mmd`

## Fast Web Migration Target

Build the first web editor against the consolidated modern JSON export:

```text
reports/gmapx-consolidated/
  palettes.master.json
  MAP###/
    base-textures.json
    texture-mapping.json
    mesh.json
    metadata.json
```

The web app should not parse original GNS/MAP sidecars during normal editor operation. Use the consolidated files as the primary runtime/editor input, and keep lossless `.gmapx` as provenance and future binary-patching authority.

## Initial Editor Scope

The initial web migration should prioritize:

- Load one consolidated map package.
- Display editable visual mesh geometry.
- Preserve textured triangles, textured quads, untextured triangles, and untextured quads separately.
- Keep quads editable as quads; triangulate only for GPU draw calls.
- Use per-polygon UVs, texture page, and palette ID.
- Apply palettes in a shader/runtime path instead of baking colorized texture variants.
- Show variant states and fallback relationships.
- Preserve source/provenance links in the data model.
- Add selection and per-vertex editing before broader terrain/gameplay systems.

## What This Should Not Become

Do not rebuild GaneshaDX literally.

Avoid:

- treating generated DocFX/Doxygen output as the spec
- making the old binary format the main editor data model
- baking every palette variant into separate texture assets
- collapsing visual mesh data and tactical-grid data into one layer
- making Three.js-era draft schemas authoritative
- implementing rendering before the consolidated data model is stable in the app
- copying old ImGui panel structure directly into the web UI

## Included Sections

### `format-reference/`

Current, source-backed references for the decoded and consolidated data formats. This is the most important section for the web migration.

### `architecture/`

Selected architecture notes from generated docs. These are useful as source-navigation aids, but some older files still use "Three.js" language. Treat those as "web 3D runtime" notes, not a final stack decision.

### `source-profiles/`

High-value source profiles for the C# files most relevant to loading, mesh decoding, palette application, rendering behavior, and editor operations.

### `diagrams/`

Small Mermaid diagrams for the source pipeline and rendering effect path.

### `findings/`

Reverse-engineering findings that are useful for migration decisions:

- map loading pipeline
- original binary sector/path notes
- unknown texture field notes
- Heretic cross-check notes

## Excluded From This Bundle

The full generated documentation remains outside this bundle:

- `docs/docfx/`
- `docs/doxygen/`
- `docs/diagrams/plantuml/`
- build logs and binary logs
- broad generated match-list files that are too noisy for implementation

Those are retained as backup lookup material only.

## Implementation Bias

Use this bundle to build a modern web editor around the consolidated schema.

The correct first application architecture is:

```text
Consolidated JSON loader
  -> normalized MapDocument store
  -> editable mesh model
  -> GPU geometry buffers
  -> indexed texture + palette shader
  -> selection/edit commands
  -> save/export back to consolidated JSON
```

The original binary patching path should remain separate:

```text
lossless .gmapx + source offsets/raw bytes + original-binary reports
```

That keeps the web editor clean while preserving what we need to revisit binary patching later.
