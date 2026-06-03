# Three.js Rebuild Workplan

## Phase 0 - Freeze reference behavior

- Keep the Windows MonoGame build as the behavior reference.
- Preserve generated DocFX, Doxygen, Mermaid, and PlantUML artifacts.
- Treat `.mgcb`, `.xnb`, and `.fx` as reference artifacts only, not target architecture.

## Phase 1 - Extract file format and domain model

Deliverables:

- TypeScript `MapDocument` schema.
- Binary reader utilities using `ArrayBuffer` and `DataView`.
- Parser tests using known sample map files.
- JSON export of one known-good loaded map.

Decision rule:

- No Three.js rendering until the map parser produces stable JSON.

## Phase 2 - Geometry reconstruction

Deliverables:

- `MapGeometryBuilder`.
- `THREE.BufferGeometry` generation.
- Position, normal, UV, polygon id, and selection metadata attributes.
- Debug wireframe render.

Decision rule:

- Geometry must match the MonoGame viewport structurally before palette/shader work.

## Phase 3 - Material and shader behavior

Deliverables:

- Basic texture material.
- Palette remap shader.
- Highlight bright/dim behavior.
- Max alpha behavior.
- Directional lighting approximation.
- Animated UV remapping.

Decision rule:

- Implement the old shader behavior in modern GLSL/WGSL-style chunks, not by preserving HLSL.

## Phase 4 - Editor interactions

Deliverables:

- Selection manager.
- Move/rotate/scale transform tools.
- Vertex and polygon edit operations.
- Texture/UV panel.
- Undo/redo command model.

Decision rule:

- Tools should operate on the domain model first, then push updates to geometry/render state.

## Phase 5 - Save/export

Deliverables:

- Round-trip save path where feasible.
- JSON export.
- Engine-neutral geometry export.
- Texture/palette asset bundle export.

## High-risk items to resolve early

- Exact binary file format boundaries.
- Palette indexing behavior.
- UV animation coordinate conventions.
- Polygon winding / normal direction.
- Isometric camera transform.
- Selection/hit-test math.
