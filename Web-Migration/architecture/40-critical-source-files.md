# Critical Source Files for Rebuild

This file ranks source files by relevance to map IO, state, rendering, editor interaction, assets, and portability risk.

| Rank | File | Score | Main surfaces | Pipeline hints |
|---:|---|---:|---|---|
| 1 | `UserInterface\GuiForms\GuiPanelTexture.cs` | 603 | editor_interaction:472, file_io:19, map_state:58, portability_risk:11, texture_palette_uv:43 | domain_model:67, file_load:8, save_export:13, state_owner:28 |
| 2 | `UserInterface\GuiForms\GuiPanelPolygon.cs` | 465 | editor_interaction:319, file_io:2, map_state:138, portability_risk:6 | domain_model:83, save_export:2, state_owner:52 |
| 3 | `UserInterface\GuiForms\GuiPanelMap.cs` | 370 | editor_interaction:279, map_state:86, portability_risk:4, texture_palette_uv:1 | domain_model:2, state_owner:81 |
| 4 | `UserInterface\GuiForms\GuiPanelTerrain.cs` | 293 | editor_interaction:265, file_io:2, map_state:22, texture_palette_uv:4 | domain_model:6, save_export:2, state_owner:8 |
| 5 | `UserInterface\GuiForms\GuiWindowTextureElement.cs` | 292 | editor_interaction:14, map_state:140, portability_risk:3, rendering:115, texture_palette_uv:20 | domain_model:139, renderer:50, state_owner:12 |
| 6 | `UserInterface\GuiForms\GuiMenuBar.cs` | 226 | editor_interaction:119, file_io:23, map_state:80, texture_palette_uv:4 | domain_model:19, file_load:6, save_export:19, state_owner:4 |
| 7 | `UserInterface\Selection.cs` | 190 | editor_interaction:13, map_state:173, portability_risk:1, texture_palette_uv:3 | domain_model:121, state_owner:32 |
| 8 | `UserInterface\GuiForms\GuiWindowEditMeshAnimations.cs` | 182 | editor_interaction:178, map_state:4 | state_owner:4 |
| 9 | `Common\GlbExporter.cs` | 150 | editor_interaction:7, file_io:4, map_state:57, portability_risk:18, rendering:28, texture_palette_uv:36 | domain_model:61, save_export:4, state_owner:22 |
| 10 | `Resources\ResourceContent\MeshResourceData.cs` | 149 | map_state:124, portability_risk:1, texture_palette_uv:24 | domain_model:136 |
| 11 | `Common\TerrainGenerator.cs` | 139 | editor_interaction:2, file_io:1, map_state:135, portability_risk:1 | domain_model:59, file_load:1, state_owner:30 |
| 12 | `UserInterface\GuiForms\GuiWindowDebugAnimatedMeshData.cs` | 138 | editor_interaction:136, map_state:2 | state_owner:2 |
| 13 | `Resources\ContentDataTypes\Polygons\Polygon.cs` | 113 | editor_interaction:6, map_state:55, portability_risk:2, rendering:37, texture_palette_uv:13 | domain_model:37, renderer:18, state_owner:18 |
| 14 | `UserInterface\GuiForms\GuiWindowManageResources.cs` | 102 | editor_interaction:67, map_state:28, portability_risk:1, texture_palette_uv:6 | domain_model:11, state_owner:17 |
| 15 | `UserInterface\Widgets\RotationWidgetAxis.cs` | 99 | editor_interaction:20, map_state:39, portability_risk:2, rendering:38 | domain_model:39, renderer:9 |
| 16 | `Rendering\SceneRenderer.cs` | 94 | editor_interaction:4, map_state:40, portability_risk:2, rendering:9, texture_palette_uv:39 | domain_model:53, renderer:5, state_owner:20 |
| 17 | `UserInterface\Widgets\TransformWidgetAxis.cs` | 94 | editor_interaction:66, map_state:11, portability_risk:2, rendering:15 | domain_model:10, renderer:5, state_owner:1 |
| 18 | `Common\Greyboxer.cs` | 90 | map_state:81, portability_risk:2, texture_palette_uv:7 | domain_model:54, state_owner:24 |
| 19 | `UserInterface\GuiForms\GuiWindowPreferences.cs` | 87 | editor_interaction:80, file_io:7 | save_export:7 |
| 20 | `UserInterface\ImGuiRenderer.cs` | 85 | editor_interaction:42, file_io:1, map_state:2, portability_risk:5, rendering:12, texture_palette_uv:23 | domain_model:20, file_load:1, renderer:2 |
| 21 | `Resources\MapData.cs` | 76 | editor_interaction:2, file_io:27, map_state:27, portability_risk:1, rendering:1, texture_palette_uv:18 | domain_model:14, file_load:10, save_export:14, state_owner:19 |
| 22 | `UserInterface\Input\AppShortcuts.cs` | 76 | editor_interaction:30, file_io:16, map_state:28, portability_risk:1, texture_palette_uv:1 | domain_model:9, file_load:3, save_export:14, state_owner:6 |
| 23 | `UserInterface\GuiForms\GuiWindowPolygonList.cs` | 61 | editor_interaction:30, map_state:31 | domain_model:21, state_owner:8 |
| 24 | `Resources\CurrentMapState.cs` | 55 | editor_interaction:5, map_state:49, portability_risk:1 | domain_model:26, renderer:1, state_owner:19 |
| 25 | `UserInterface\Gui.cs` | 52 | editor_interaction:28, map_state:17, portability_risk:2, rendering:1, texture_palette_uv:4 | domain_model:8, state_owner:2 |
| 26 | `UserInterface\GuiForms\GuiPanelMeshSelector.cs` | 52 | editor_interaction:20, map_state:32 | state_owner:32 |
| 27 | `Environment\Stage.cs` | 48 | editor_interaction:1, file_io:2, map_state:2, portability_risk:5, rendering:38 | domain_model:1, file_load:2, renderer:13 |
| 28 | `Rendering\MeshAnimationController.cs` | 46 | editor_interaction:4, map_state:31, portability_risk:1, rendering:10 | domain_model:16, state_owner:14 |
| 29 | `UserInterface\Widgets\Compass.cs` | 44 | editor_interaction:5, map_state:6, portability_risk:2, rendering:31 | renderer:5, state_owner:4 |
| 30 | `UserInterface\GuiForms\GuiWindowCameraControls.cs` | 37 | editor_interaction:37 |  |
| 31 | `UserInterface\GuiForms\GuiWindowRawTerrainData.cs` | 37 | editor_interaction:25, map_state:11, portability_risk:1 | state_owner:6 |
| 32 | `UserInterface\Widgets\VertexIndicator.cs` | 35 | editor_interaction:5, map_state:4, portability_risk:4, rendering:22 | domain_model:4, renderer:7 |
| 33 | `UserInterface\GuiForms\GuiWindowAddPolygon.cs` | 34 | editor_interaction:21, map_state:9, portability_risk:4 | domain_model:8, state_owner:1 |
| 34 | `Common\FileBrowser.cs` | 31 | editor_interaction:2, file_io:15, map_state:12, texture_palette_uv:2 | domain_model:2, file_load:6, save_export:10 |
| 35 | `Common\Utilities.cs` | 31 | editor_interaction:1, map_state:29, portability_risk:1 | domain_model:27, state_owner:2 |
| 36 | `Resources\ContentDataTypes\Terrains\TerrainTile.cs` | 31 | editor_interaction:7, map_state:5, portability_risk:2, rendering:17 | domain_model:4, renderer:5 |
| 37 | `UserInterface\Widgets\TransformWidget.cs` | 29 | editor_interaction:25, map_state:3, portability_risk:1 | domain_model:3 |
| 38 | `UserInterface\Widgets\DirectionalLightIndicator.cs` | 27 | editor_interaction:2, map_state:9, portability_risk:2, rendering:14 | renderer:5, state_owner:6 |
| 39 | `Rendering\Background.cs` | 25 | file_io:3, map_state:2, portability_risk:2, rendering:6, texture_palette_uv:12 | file_load:3 |
| 40 | `Resources\ContentDataTypes\MapStateData.cs` | 24 | map_state:10, portability_risk:2, texture_palette_uv:12 | domain_model:16 |
| 41 | `UserInterface\GuiForms\GuiWindowExportGlb.cs` | 22 | editor_interaction:15, file_io:7 | save_export:7 |
| 42 | `UserInterface\GuiDefinitions\GuiStyle.cs` | 20 | editor_interaction:20 |  |
| 43 | `Ganesha.cs` | 17 | editor_interaction:1, file_io:2, map_state:1, portability_risk:2, rendering:11 | file_load:2, renderer:2 |
| 44 | `UserInterface\GuiForms\GuiWindowAbout.cs` | 17 | editor_interaction:14, file_io:1, map_state:2 | save_export:1 |
| 45 | `UserInterface\GuiForms\GuiWindowGnsData.cs` | 17 | editor_interaction:13, map_state:4 |  |
| 46 | `Common\UniversalTextures.cs` | 16 | portability_risk:2, rendering:1, texture_palette_uv:13 |  |
| 47 | `Environment\StageCamera.cs` | 16 | editor_interaction:4, map_state:10, portability_risk:2 | domain_model:3, state_owner:4 |
| 48 | `UserInterface\GuiForms\GuiWindowTexturePreview.cs` | 15 | editor_interaction:11, portability_risk:1, texture_palette_uv:3 | domain_model:3 |
| 49 | `Resources\ResourceContent\TextureResourceData.cs` | 13 | file_io:2, portability_risk:2, rendering:1, texture_palette_uv:8 | domain_model:6, save_export:2 |
| 50 | `UserInterface\GuiForms\GuiWindowUpdateAvailable.cs` | 12 | editor_interaction:12 |  |
| 51 | `UserInterface\GuiForms\GuiWindowMapWarning.cs` | 11 | editor_interaction:9, map_state:2 | state_owner:1 |
| 52 | `Resources\ContentDataTypes\MeshAnimations\MeshAnimationKeyframe.cs` | 11 | editor_interaction:11 |  |
| 53 | `UserInterface\GuiForms\GuiWindowScreenshotBackgroundSelector.cs` | 10 | editor_interaction:8, map_state:1, portability_risk:1 |  |
| 54 | `Common\Configuration.cs` | 7 | file_io:7 | file_load:3, save_export:3 |
| 55 | `Rendering\MeshAnimationRoutine.cs` | 6 | editor_interaction:3, map_state:2, portability_risk:1 | state_owner:2 |
| 56 | `UserInterface\GuiDefinitions\GuiEnums.cs` | 5 | editor_interaction:1, map_state:3, texture_palette_uv:1 | domain_model:2 |
| 57 | `Resources\ContentDataTypes\TextureAnimations\AnimatedTextureInstructions.cs` | 5 | texture_palette_uv:5 | domain_model:5 |
| 58 | `Common\AutoSaver.cs` | 4 | file_io:1, map_state:3 | save_export:1 |
| 59 | `Common\FpsCounter.cs` | 4 | file_io:1, map_state:1, portability_risk:2 | file_load:1 |
| 60 | `UserInterface\Input\AppInput.cs` | 4 | editor_interaction:2, portability_risk:2 |  |
| 61 | `UserInterface\Widgets\RotationWidget.cs` | 4 | editor_interaction:4 |  |
| 62 | `Common\OverlayConsole.cs` | 3 | file_io:1, portability_risk:2 | file_load:1 |
| 63 | `Common\UpdateChecker.cs` | 3 | file_io:3 | file_load:3 |
| 64 | `Resources\ContentDataTypes\Polygons\Vertex.cs` | 3 | map_state:2, portability_risk:1 | domain_model:2 |
| 65 | `Resources\ContentDataTypes\TextureAnimations\UvAnimation.cs` | 3 | texture_palette_uv:3 | domain_model:3 |
| 66 | `Common\GameViewOverlay.cs` | 2 | map_state:1, portability_risk:1 |  |
| 67 | `Common\GlobalEnums.cs` | 2 | texture_palette_uv:2 | domain_model:2 |
| 68 | `Resources\GnsData\GnsResourceRow.cs` | 2 | texture_palette_uv:2 | domain_model:2 |
| 69 | `Resources\ResourceContent\MapResource.cs` | 2 | texture_palette_uv:2 | domain_model:2 |
| 70 | `Resources\ContentDataTypes\Palettes\Palette.cs` | 2 | portability_risk:1, texture_palette_uv:1 | domain_model:1 |
| 71 | `Common\CameraRay.cs` | 1 | portability_risk:1 |  |
| 72 | `Common\CameraRayResults.cs` | 1 | portability_risk:1 |  |
| 73 | `Common\ConfigurationProperties.cs` | 1 | portability_risk:1 |  |
| 74 | `Common\CrashLog.cs` | 1 | file_io:1 | file_load:1 |
| 75 | `Resources\ContentDataTypes\DirectionalLight.cs` | 1 | portability_risk:1 |  |
| 76 | `Resources\ContentDataTypes\Palettes\PaletteColor.cs` | 1 | portability_risk:1 |  |
| 77 | `Resources\ContentDataTypes\Terrains\Terrain.cs` | 1 | map_state:1 |  |

## Recommended first inspection order

- `UserInterface\GuiForms\GuiPanelTexture.cs`
- `UserInterface\GuiForms\GuiPanelPolygon.cs`
- `UserInterface\GuiForms\GuiPanelMap.cs`
- `UserInterface\GuiForms\GuiPanelTerrain.cs`
- `UserInterface\GuiForms\GuiWindowTextureElement.cs`
- `UserInterface\GuiForms\GuiMenuBar.cs`
- `UserInterface\Selection.cs`
- `UserInterface\GuiForms\GuiWindowEditMeshAnimations.cs`
- `Common\GlbExporter.cs`
- `Resources\ResourceContent\MeshResourceData.cs`
- `Common\TerrainGenerator.cs`
- `UserInterface\GuiForms\GuiWindowDebugAnimatedMeshData.cs`
- `Resources\ContentDataTypes\Polygons\Polygon.cs`
- `UserInterface\GuiForms\GuiWindowManageResources.cs`
- `UserInterface\Widgets\RotationWidgetAxis.cs`
- `Rendering\SceneRenderer.cs`
- `UserInterface\Widgets\TransformWidgetAxis.cs`
- `Common\Greyboxer.cs`
- `UserInterface\GuiForms\GuiWindowPreferences.cs`
- `UserInterface\ImGuiRenderer.cs`