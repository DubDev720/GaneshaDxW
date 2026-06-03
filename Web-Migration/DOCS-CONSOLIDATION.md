# Docs Consolidation Audit

This file records what was useful in `docs/`, what was redundant, and how the useful pieces were folded into `docs/Web-Migration/`.

## High-Value Docs Kept

### Architecture

Copied into `architecture/`:

- `30-map-loading-pipeline.md`
- `40-critical-source-files.md`
- `42-threejs-rebuild-workplan.md`
- `50-source-level-pipeline-review.md`
- `25-portability-risks.md`

Why:

- They identify the source pipeline and high-risk migration areas.
- They are short enough to scan quickly.
- They point to the actual source files that matter.

Note:

- `42-threejs-rebuild-workplan.md` is now best interpreted as a generic web-3D workplan. The current recommendation is web-first, not necessarily Three.js-specific.

### Source Profiles

Copied into `source-profiles/`:

- `Resources__MapData.md`
- `Resources__ResourceContent__MeshResourceData.md`
- `Resources__ContentDataTypes__MapStateData.md`
- `Resources__CurrentMapState.md`
- `Resources__ContentDataTypes__Polygons__Polygon.md`
- `Resources__ContentDataTypes__Polygons__Vertex.md`
- `Resources__ContentDataTypes__Palettes__Palette.md`
- `Resources__ContentDataTypes__TextureAnimations__UvAnimation.md`
- `Rendering__SceneRenderer.md`
- `Environment__Stage.md`
- `Common__GlbExporter.md`
- `Common__FileBrowser.md`

Why:

- These are the most direct source-navigation aids for map loading, mesh decoding, palette use, UV behavior, GLB export behavior, rendering, and state variants.

### Diagrams

Copied into `diagrams/`:

- `source-level-map-pipeline.mmd`
- `rendering-effect-pipeline.mmd`
- `folder-map.mmd`

Why:

- They give quick orientation without requiring large generated docs.

### Current Format References

Copied from `reports/gmapx-reference/` into `format-reference/`:

- `README.md`
- `03-mesh-geometry.md`
- `04-textures-palettes.md`
- `05-animations-rendering-terrain.md`
- `06-reconstruction-checklist.md`
- `08-variant-overlays.md`
- `10-consolidated-modern-export.md`
- `source-evidence.md`

Why:

- These are newer and more directly useful than the older generated docs.
- They describe the actual consolidated JSON target for the web editor.

### Findings

Copied into `findings/`:

- `map-loading-pipeline.md`
- `original-binary-summary.md`
- `unknown-texture-fields-summary.json`
- `texture-record-fields.md`

Why:

- They preserve reverse-engineering context needed to avoid repeating work.

## Redundant Or Low-Value Docs Not Copied

### `docs/docfx/`

Status: not copied.

Reason:

- Large generated API output.
- Useful only for exhaustive symbol lookup.
- Redundant with actual source files and focused source profiles.

Recommended handling:

- Keep as archive/reference only.
- Do not use as migration working docs.

### `docs/doxygen/`

Status: not copied.

Reason:

- Large generated HTML tree.
- Duplicates source-level information in a noisier form.
- Not efficient for building the web migration.

Recommended handling:

- Keep as archive/reference only.
- Use source files and source profiles first.

### `docs/diagrams/plantuml/`

Status: not copied.

Reason:

- Generated PlantUML/SVG output is broad and not critical to implementation.
- The selected Mermaid diagrams are enough for fast orientation.

Recommended handling:

- Keep only if someone specifically wants broad class diagrams.

### Logs and Build Artifacts

Not copied:

- `build.binlog`
- `build.log`
- `docfx-build.log`
- `docfx-metadata.log`
- `restore.log`

Reason:

- Build provenance only.
- Not useful for web migration implementation.

### Broad Generated Match Lists

Not copied:

- `21-map-loading-and-file-io.md`
- `22-map-state-and-domain-model.md`
- `23-rendering-and-geometry.md`
- `24-editor-tools-and-interaction.md`
- `41-pipeline-trace-candidates.md`

Reason:

- These are broad search-result surfaces, not concise implementation docs.
- Their useful content is folded into:
  - source profiles
  - `40-critical-source-files.md`
  - current `format-reference/`

Recommended handling:

- Keep in original `docs/architecture/` only for deep archaeology.
- Do not use as the migration starting point.

## What To Use As Authority

For web migration:

1. Current consolidated JSON under `reports/gmapx-consolidated/`
2. `docs/Web-Migration/format-reference/`
3. Actual source files
4. `docs/Web-Migration/source-profiles/`
5. Generated docs only as backup lookup

For original binary patching:

1. Lossless `.gmapx` packages
2. Original source sidecars and offsets
3. `reports/original-binary/`
4. `docs/Web-Migration/format-reference/source-evidence.md`

## Bottom Line

Use `docs/Web-Migration/` as the working documentation set.

Use the rest of `docs/` as generated archive material, not as the starting point for implementation.
