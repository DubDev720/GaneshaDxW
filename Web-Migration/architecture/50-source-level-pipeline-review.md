# Source-Level Pipeline Review

This pass creates individual source profiles for the files most likely to matter in a Three.js rebuild.

## Generated source profiles

- `docs/architecture/source-profiles/Resources__MapData.md`
- `docs/architecture/source-profiles/Common__FileBrowser.md`
- `docs/architecture/source-profiles/Resources__CurrentMapState.md`
- `docs/architecture/source-profiles/Resources__ContentDataTypes__MapStateData.md`
- `docs/architecture/source-profiles/Resources__ResourceContent__MeshResourceData.md`
- `docs/architecture/source-profiles/Resources__ContentDataTypes__Polygons__Polygon.md`
- `docs/architecture/source-profiles/Resources__ContentDataTypes__Polygons__Vertex.md`
- `docs/architecture/source-profiles/Resources__ContentDataTypes__Palettes__Palette.md`
- `docs/architecture/source-profiles/Resources__ContentDataTypes__TextureAnimations__UvAnimation.md`
- `docs/architecture/source-profiles/Rendering__SceneRenderer.md`
- `docs/architecture/source-profiles/Environment__Stage.md`
- `docs/architecture/source-profiles/Common__GlbExporter.md`

## Next manual inspection order

1. `Resources/MapData.cs`
2. `Resources/ResourceContent/MeshResourceData.cs`
3. `Resources/ContentDataTypes/MapStateData.cs`
4. `Resources/CurrentMapState.cs`
5. `Resources/ContentDataTypes/Polygons/Polygon.cs`
6. `Common/GlbExporter.cs`
7. `Rendering/SceneRenderer.cs`
8. `Environment/Stage.cs`

## Generated diagram

- `docs/diagrams/source-level-map-pipeline.mmd`