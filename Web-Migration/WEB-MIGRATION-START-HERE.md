# Web Migration Start Here

The fastest useful V1 is a web editor that loads the consolidated JSON, renders the editable visual mesh, and supports selection plus per-vertex editing.

## V1 Data Inputs

Use:

```text
reports/gmapx-consolidated/palettes.master.json
reports/gmapx-consolidated/MAP###/base-textures.json
reports/gmapx-consolidated/MAP###/texture-mapping.json
reports/gmapx-consolidated/MAP###/mesh.json
reports/gmapx-consolidated/MAP###/metadata.json
```

Do not start by loading original `MAP###.GNS` or numbered sidecars in the web app.

## V1 Runtime Model

Create these internal modules:

```text
MapPackageLoader
PaletteRegistry
TextureRegistry
MeshDocumentStore
VariantResolver
GeometryBuilder
MaterialResolver
SelectionStore
EditCommandHistory
```

## First Render Milestone

1. Load `MAP001`.
2. Build GPU triangle buffers from `meshDefinitions`.
3. Keep editable polygon records in the document store.
4. Render untextured perimeter polygons as flat black.
5. Render textured polygons with indexed texture sampling and palette lookup.
6. Render one selected polygon overlay.
7. Change one vertex position and update only the affected geometry buffer.

## First Editor Milestone

1. Scene tree: mesh sections and variants.
2. Polygon selection.
3. Vertex selection.
4. Translate selected vertex.
5. Undo/redo.
6. Save modified `mesh.json`.

## Important Boundaries

Visual mesh is not the tactical micro-grid.

The tactical layer should be added as a separate model later:

```text
VisualMeshLayer
TacticalGridLayer
InteractionLayer
LightingMaterialLayer
VariantLayer
```

## Renderer Recommendation

Use a web-native 3D runtime. Do not bind the data model to any engine scene format.

The renderer should consume the map document; it should not own it.

## Shader Direction

Use real-time palette rendering:

```text
indexed base texture + palette buffer/uniform + polygon paletteId
```

Avoid generating one baked texture per palette variant for V1.

## Source Compatibility Direction

Keep two paths:

1. Modern editor/runtime path: consolidated JSON.
2. Original binary path: lossless `.gmapx` plus source offsets/raw bytes.

The web editor should optimize for path 1 while preserving enough provenance to revisit path 2.
