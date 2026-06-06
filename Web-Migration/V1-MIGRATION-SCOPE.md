# GaneshaDXW V1 Migration Scope

This document is the living scope contract for the first stable web release.

V1 is not a panel-for-panel clone of GaneshaDX. V1 is a web-native visual map editor that can load local generated map packages, render them accurately, edit the core mesh/UV/terrain-binding data safely, preserve source-compatible fields, and export in a shape that keeps original-format compatibility reachable.

## Targeted V1 Migration List

These are the features that should be treated as release-shaping for V1.

| Area | V1 Target | Current Status |
| --- | --- | --- |
| Local package loading | Load local `gmapx-consolidated` packages through ignored runtime config. | Implemented baseline |
| Source hygiene | Ship no generated maps, textures, palettes, metadata, or compiled outputs as tracked source. | Implemented baseline |
| Package chooser | Select among locally configured packages instead of hardwiring MAP001. | Implemented baseline |
| Package metadata | Display metadata, original map titles, package health, provenance, and missing-resource warnings. | Partial |
| Visual mesh rendering | Render triangles and quads with source-compatible winding and one-sided materials by default. | Implemented baseline |
| Indexed texture rendering | Render texture pages through indexed texture data and palette lookup. | Implemented baseline |
| UV correctness | Keep texture page, palette, UVs, and alpha behavior aligned with verified reference output. | Partial, needs regression tests |
| Viewport shell | Keep panels as overlays so opening tools does not resize or shift the render target. | Implemented baseline |
| Camera controls | Support game-like presets plus free editor-friendly orbit, pan, zoom, focus, and reset. | Implemented baseline |
| Selection | Select faces first, vertices near corners, and keep selected records visible in the UI. | Partial |
| Vertex editing | Move selected vertices with controls and viewport drag. | Implemented baseline |
| Face inspector | Edit texture page, palette, UVs, terrain binding, visibility, and preserved source fields safely. | Partial |
| UV workflow | Provide focused triangle/quad UV editing with texture-page preview and common transforms. | Not complete |
| Terrain binding editor | Edit visual mesh fields that bind polygons back to original game terrain constraints. | Partial |
| Polygon operations | Add create, clone, delete, split/break, textured/untextured conversion, and simple normal tools. | Not complete |
| Validation | Show field-level warnings tied to exact editable records before export. | Partial |
| Export | Preserve consolidated schema shape and source-preserved fields on export. | Partial |
| Tests | Add compatibility, texture mapping, palette, export-shape, and browser smoke coverage. | Not complete |
| Release docs | Document setup, local data expectations, known limits, and verification steps. | Partial |

## Critical V1 Scope Notes

- V1 uses the consolidated JSON package as the editor/runtime input. Original `.GNS` and numbered sidecar parsing stay outside the normal V1 runtime.
- V1 must not track generated map resources or compiled outputs. Local map packages belong under ignored runtime paths such as `web/public/reports/`.
- V1 should preserve source/provenance fields even when it does not expose friendly editing UI for every field.
- V1 edits must stay inside original game and GaneshaDX-compatible limits where those limits are known.
- V1 must keep visual mesh data separate from the tactical grid. Terrain binding can be edited, but a full tactical map builder is later scope.
- V1 should prioritize single-map correctness before broad batch tooling.
- V1 should be editor-friendly rather than ImGui-identical. The original UI is source evidence, not a layout requirement.
- V1 should avoid baking palette variants into tracked texture assets. Runtime palette resolution remains the preferred path.
- V1 can defer lighting, baked shadow parity, animation previews, and advanced resource workflows if geometry, texture, UV, terrain binding, and export correctness are stable.
- V1 release readiness depends on repeatable verification, not just manual visual inspection.

## Full GaneshaDX Feature Parity Checklist

This is the long-term parity map. Items here are not automatically V1 requirements.

### File And Package Operations

- [ ] New map workflow.
- [ ] Open original map package.
- [x] Load local consolidated web package.
- [ ] Reload current map.
- [ ] Save original-compatible map.
- [ ] Save As original-compatible map.
- [x] Export modified consolidated mesh JSON baseline.
- [ ] Export original-compatible patch/package.
- [ ] Import texture.
- [ ] Re-import last texture.
- [ ] Export texture.
- [ ] Export UV map.
- [ ] Export GLB model.
- [ ] Import palette.
- [ ] Export palette.
- [ ] Export default palette.
- [ ] Preferences persistence.
- [ ] Autosave.
- [ ] Crash logging/user recovery.

### Map State And Resource Management

- [ ] Arrangement selector.
- [ ] Time selector.
- [ ] Weather selector.
- [ ] Variant/base-state fallback resolver.
- [ ] Variant selector.
- [ ] Texture file/resource display.
- [ ] Mesh file/resource display.
- [ ] Mesh resource manager.
- [ ] Primary mesh resource editing.
- [ ] Animated mesh resource editing.
- [ ] Render properties resource editing.
- [ ] Terrain resource editing.
- [ ] Palette resource editing.
- [ ] Grayscale palette resource editing.
- [ ] Texture animation resource editing.
- [ ] Palette animation frame resource editing.
- [ ] Unknown/source resource data inspection.

### Viewport And Rendering

- [x] WebGPU-first renderer with WebGL2 fallback.
- [x] One-sided polygon rendering by default.
- [x] Textured polygon rendering.
- [x] Flat untextured polygon rendering.
- [x] UV/debug display mode.
- [x] Solid and wire-oriented debug modes.
- [x] Game-view camera presets.
- [x] Orthographic/perspective render toggle.
- [x] Camera focus, reset, pan, orbit, and zoom.
- [ ] Highlight selected polygons toggle parity.
- [ ] Backface selection toggle parity.
- [ ] Lighting mode parity.
- [ ] Hide invisible polygons by facing.
- [ ] Hide red terrain tiles.
- [ ] Vertex normal indicators.
- [ ] Alpha-as-semitransparent toggle.
- [ ] Scripted texture animation playback toggle.
- [ ] Screenshot mode.
- [ ] Screenshot background selector.
- [ ] Background color editing.
- [ ] Directional/ambient lighting editing.
- [ ] Baked-shadow or external-viewer lighting parity.

### Selection

- [x] Polygon selection.
- [x] Vertex selection.
- [x] Face-first viewport picking.
- [ ] Multi-polygon selection.
- [ ] Select all polygons.
- [ ] Focus on selection parity.
- [ ] Select backfaces.
- [ ] Grow polygon selection.
- [ ] Select overlapping polygons.
- [ ] Select polygons with overlapping vertices.
- [ ] Select all terrain tiles.
- [ ] Grow terrain selection.
- [ ] Select next/previous vertex.
- [ ] Select next/previous edge.
- [ ] Mesh isolation selection behavior.

### Polygon And Mesh Editing

- [ ] Create polygon.
- [ ] Clone selection.
- [ ] Delete selection.
- [x] Move individual vertices.
- [ ] Translate selected polygons.
- [ ] Rotate selected polygons.
- [ ] Translate selected edges.
- [ ] Store vertex.
- [ ] Snap stored vertex.
- [ ] Set local normals.
- [ ] Set group normals.
- [ ] Flip normals.
- [ ] Break polygons.
- [ ] Convert textured to untextured.
- [ ] Convert untextured to textured.
- [ ] Move polygons between primary and animated meshes.
- [ ] Edit render properties.
- [ ] Edit invisibility angles/facing constraints.
- [ ] Edit unknown untextured fields.
- [ ] Edit unknown render-property fields.
- [ ] Preserve normals and source fields during edit/export.

### Texture, UV, Palette, And Animation Editing

- [x] Texture page and palette display.
- [x] Selected-face texture preview baseline.
- [x] Numeric UV editing baseline.
- [ ] Texture-page preview with selected and unselected UV overlays.
- [ ] Texture preview keyboard movement.
- [ ] UV flip horizontal.
- [ ] UV flip vertical.
- [ ] UV rotate left/right.
- [ ] UV automap.
- [ ] UV copy/paste.
- [ ] Texture source editing.
- [ ] Unknown texture field editing.
- [ ] Texture lit flag editing.
- [ ] Palette grid editor.
- [ ] Palette color picker.
- [ ] Palette import/export workflows.
- [ ] Texture import/export workflows.
- [ ] UV map export workflow.
- [ ] Texture animation list.
- [ ] UV animation editor.
- [ ] Palette animation editor.
- [ ] Unknown animation editor.
- [ ] Scripted/malformed texture animation preview support.

### Terrain Editing

- [x] Polygon terrain binding display/edit baseline.
- [ ] Tactical terrain grid model.
- [ ] Terrain tile selection.
- [ ] Terrain height editing.
- [ ] Terrain depth editing.
- [ ] Terrain thickness editing.
- [ ] Terrain slope type editing.
- [ ] Terrain slope height editing.
- [ ] Terrain surface type editing.
- [ ] Terrain shading editing.
- [ ] Pass-through-only flag editing.
- [ ] Unselectable flag editing.
- [ ] Impassable flag editing.
- [ ] Directional rotation flags.
- [ ] Reset selected terrain tiles.
- [ ] Resize terrain.
- [ ] Terrain generator.
- [ ] Greyboxing workflow.
- [ ] Raw terrain data window.
- [ ] Terrain render options.

### Animated Meshes

- [ ] Animated mesh selector.
- [ ] Animated mesh isolation.
- [ ] Mesh animation playback.
- [ ] Mesh animation debug data.
- [ ] Mesh animation editor.
- [ ] Animation transform routines.
- [ ] Animated mesh source-preserved export.

### Advanced And Post-V1 Workflows

- [ ] Modular mesh-set workflows based on GaneshaDX mesh grouping tools.
- [ ] Bridge between mesh editor and map builder.
- [ ] Reusable map construction tools for less technical users.
- [ ] Dockable panel system.
- [ ] Command palette.
- [ ] Plugin-style tools.
- [ ] Scripting/automation.
- [ ] Direct disc/archive import.
- [ ] Lossless binary round-trip.
- [ ] Original-format patch authoring.
- [ ] Community test-map suite.

## Post-Parity Planned Features

These are planned after full GaneshaDX feature parity. They should remain outside V1 and outside the parity checklist until the compatibility baseline is complete.

1. [ ] Automated hidden surface flagging for simplified PSX mod optimization.
2. [ ] Mesh animation editor interface.
3. [ ] UV animation preview and editor interface, including integration or migration of existing tooling into a unified workflow.
4. [ ] Event manager and cutscene creation system.
5. [ ] WoTL PSP compatibility.
6. [ ] Unified version constraint configuration.
7. [ ] Customization options.
8. [ ] Integration with overhauled spritesheet editor and manager.
9. [ ] Cutscene creator with video export.

## V1 Done Criteria

V1 should not be called complete until:

- A local generated package can be loaded without tracking any generated package resource in Git.
- Geometry and texture rendering match the verified reference closely enough for editing work.
- Core face, vertex, UV, and terrain-binding edits are possible through the UI.
- Every editable field has validation or a documented reason validation is deferred.
- Export preserves the consolidated schema shape and source-preserved fields needed for later compatibility.
- Undo/redo works for every V1 edit operation.
- Browser smoke tests cover package load, render, selection, edit, undo/redo, and export.
- README/setup docs clearly explain local data, generated resource exclusions, and known V1 limitations.
