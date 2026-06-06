# GaneshaDXW

```text
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║      ▄████  ▄▄▄       ███▄    █ ▓█████   ██████  ██░ ██  ▄▄▄          ║
║     ██▒ ▀█▒▒████▄     ██ ▀█   █ ▓█   ▀ ▒██    ▒ ▓██░ ██▒▒████▄        ║
║    ▒██░▄▄▄░▒██  ▀█▄  ▓██  ▀█ ██▒▒███   ░ ▓██▄   ▒██▀▀██░▒██  ▀█▄      ║
║    ░▓█  ██▓░██▄▄▄▄██ ▓██▒  ▐▌██▒▒▓█  ▄   ▒   ██▒░▓█ ░██ ░██▄▄▄▄██     ║
║    ░▒▓███▀▒ ▓█   ▓██▒▒██░   ▓██░░▒████▒▒██████▒▒░▓█▒░██▓ ▓█   ▓██▒    ║
║                                                                       ║
║     ▓█████▄   ▒██   ██▒  █     █░                                     ║
║     ▒██▀ ██▌  ▒▒ █ █ ▒░ ▓█░ █ ░█░    Browser-native map editing       ║
║     ░██   █▌  ░░  █   ░ ▒█░ █ ░█        for Ivalice terrain           ║
║     ░▓█▄   ▌   ░ █ █ ▒  ░█░ █ ░█                                      ║
║     ░▒████▓   ▒██▒ ▒██▒ ░░██▒██▓         WebGPU • Three.js            ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```


#### GaneshaDXW is a browser-based migration and modernization effort for **GaneshaDX**, the Final Fantasy Tactics map editor originally created by **@Garmichael**.

> The goal is not to erase or replace the original editor. The goal is to carry its most important map-editing capabilities forward into a web-deployable, platform-agnostic tool that can run across Windows, macOS, and Linux while preserving compatibility with original game data and the expectations of the Final Fantasy Tactics modding community.

### Current direction:

- **Runtime:** Bun + Vite + TypeScript
- **Renderer:** Three.js with `WebGPURenderer` first and WebGL2 fallback
- **Data path:** `gmapx-consolidated` JSON for the first web editor
- **Compatibility path:** preserve original/lossless GaneshaDX and `.gmapx` provenance for future binary-aware workflows

***
# ❤️🩷💜💙🩵💚💛🧡🙏 Thank You 🎉🧡💛💚🩵💙💜🩷❤️
***
> [!IMPORTANT]
> ### Huge thanks and respect to the *FFHactics community*, to *Garmichael* for creating GaneshaDX, and to everyone who has helped maintain, evolve, document, test, preserve, and support Final Fantasy Tactics tooling (official or otherwise) over the years. ⚔️🛡️
>
> ### This project stands on the work of a dedicated and wildly talented modding community, and on the passion of fans who have kept Final Fantasy Tactics, its related games, spiritual successors, sequels, remasters, and tactical-RPG lineage alive for nearly three decades. The care, craft, reverse engineering, artistry, and persistence around this game are the reason a project like this is even possible. ✨
>
> ### **Thank you** to everyone building maps, patches, tools, guides, research notes, translations, hacks, mods, sprites, stories, balance changes, and impossible little miracles in Ivalice. 🐏📜

***

## Scope

GaneshaDXW is initially focused on the **visual map mesh editor**.

### The first useful release should:

- Load a consolidated map package.
- Display editable visual mesh geometry.
- Preserve triangles and quads as editor data.
- Triangulate only for GPU rendering.
- Render untextured perimeter polygons as flat black.
- Render textured polygons with indexed textures and palette lookup.
- Support polygon selection.
- Support vertex selection.
- Translate selected vertices.
- Undo and redo edit commands.
- Save/export modified `mesh.json`.
- Preserve compatibility with original GaneshaDX and Final Fantasy Tactics map constraints.

#### *Out of scope for the first release:*

- Rebuilding GaneshaDX panel-for-panel.
- Making original `.GNS` or numbered sidecars the main web runtime format.
- Collapsing the visual mesh and tactical grid into one model.
- Baking every palette variant into separate texture assets.

***

## Architecture

The web editor is built around a strict boundary:

```text
gmapx-consolidated mesh.json
  -> normalized MeshDocument
  -> editor state/history/selection
  -> Three.js renderer adapter
  -> triangulated GPU geometry
```

Texture and palette resources flow beside the mesh document:

```text
palettes.master.json + base-textures.json + texture-mapping.json
  -> TexturePaletteRegistry
  -> palette-resolved Three.js materials
```

The renderer consumes the document. It does not own the map model.

The original binary/lossless path remains separate:

```text
lossless .gmapx + source offsets/raw bytes
  -> provenance and future binary patching authority
```

This split lets the web editor stay practical while still respecting original-format compatibility.


- `web/src/loaders/MapPackageLoader.ts` normalizes loader input.
- `web/src/domain/mapDocument.ts` owns the editor document model.
- `web/src/domain/editCommandHistory.ts` and `web/src/domain/selectionStore.ts` manage editor state.
- `web/src/renderer/GaneshaThreeRendererAdapter.ts` consumes the document and builds renderable meshes.
- `web/src/renderer/texturePaletteRegistry.ts` resolves indexed texture data through map palettes.


***

## Current Implementation

>[!WARNING] The application i still in early stagess. I can not guarantee whether this tool witll run as epeted on  othis sywill or wont work
The active browser migration lives in [`web/`](web/).

**Implemented so far:**

- Bun + Vite + TypeScript scaffold.
- Uses **WebGPU first** and falls back to **WebGL2** when WebGPU is unavailable.
- Renderer adapter boundary.
- Consolidated JSON package loader.
- MAP001 import tooling for generated `gmapx-consolidated` reports.
- Loads local, ignored `gmapx-consolidated` mesh packages through `web/public/ganeshadxw.local.json`.
- Ships a safe empty package index by default so generated map meshes are not baked into source.
- Falls back to a bundled TypeScript sample document if the JSON fixture cannot be loaded.
- Source-format/provenance model.
- Geometry builder for triangles and quads.
- GaneshaDX/GLB-verified triangle and quad winding for the current MAP001 render path.
- Mostly one-sided mesh rendering by default, with double-sided rendering reserved for explicit future cases.
- Atlas UV generation for textured polygons using source texture records.
- Real indexed base texture loading from the consolidated package.
- Palette master loading from the consolidated package.
- Texture mapping loading from the consolidated package.
- Texture/palette registry with material keys based on indexed texture and palette identity.
- Palette-resolved texture materials using the current CPU-generated `DataTexture` path.
- Transparent black-entry masking for source-compatible texture cutouts.
- Texture upload conventions aligned with the verified MAP001 GLB reference.
- UV chart/debug display mode with `U` hotkey.
- Flat black untextured perimeter rendering.
- GaneshaDX compatibility validation and sanitization for GaneshaDX-style limits for vertex ranges, UV ranges, palette IDs, texture pages, and terrain fields.
- Document-driven scene tree.
- Collapsible side-tabbed left and right panels.
- Panels overlay the viewport so opening tools does not move the render area.
- Camera reset, focus-selection, hardcoded perspective presets, and game-view toggle.
- Perspective/orthographic projection toggle without changing camera location or rotation.
- Right-click camera orbit and middle-click camera pan.
- Zoom controls through buttons and `+`/`-` hotkeys.
- Mouse-wheel zoom disabled to avoid accidental viewport changes.
- Externalized viewport and camera tuning constants.
- Polygon selection from UI.
- Vertex selection from UI.
- Face-first viewport picking, with near-corner vertex picking.
- Canvas raycast polygon picking.
- Near-vertex picking path.
- Visible vertex handles in the viewport.
- Per-vertex translation controls.
- Drag-based vertex translation.
- Keyboard nudging.
- Undo/redo and reset-to-loaded-document edit history.
- Modified `mesh.json` export/download.
- Visible compatibility status panel.

***

## Local Map Data

Generated map mesh payloads are runtime/test data, not source code.

- `web/public/ganeshadxw.local.json` is intentionally ignored.
- `web/public/ganeshadxw.local.example.json` documents the local config shape.
- `web/public/reports/` is intentionally ignored.
- Local dev can keep MAP001 or other generated packages under `web/public/reports/gmapx-consolidated/`.
- Generated meshes, metadata, palette masters, base textures, texture mappings, and package indexes must not be committed.

This lets contributors test against their own extracted/generated data without committing game-derived map meshes to the repository.

***

## Compatibility Rules

The web editor must stay compatible with constraints enforced by the original GaneshaDX and the underlying game data.

**Initial compatibility guardrails include:**

- Polygons must be triangles or quads.
- Textured polygons must have UV counts matching vertex counts.
- Palette IDs stay in `0..15`.
- Texture pages stay in `0..3`.
- UVs stay page-local within the original `256x256` texture page.
- Terrain X stays in `0..255`.
- Terrain Z stays in `0..127`.
- Terrain level stays in `0..1`.
- Unknown byte-backed fields stay in `0..255`.
- Vertex positions are clamped to signed 16-bit integer-compatible values.
- Unknown/source-preserved fields should be carried forward, not discarded.

***

## What Remains

The detailed scope is now tracked in [`Web-Migration/V1-MIGRATION-SCOPE.md`](Web-Migration/V1-MIGRATION-SCOPE.md).

**V1.0 target:**

- Local generated package loading without tracking generated map resources.
- Accurate visual mesh rendering with source-compatible texture, palette, UV, and alpha behavior.
- Face, vertex, UV, and terrain-binding editing for the visual mesh.
- Format-safe inspectors and field-level validation for editable source-backed records.
- Consolidated-schema export that preserves source/provenance fields.
- Undo/redo coverage for every V1 edit operation.
- Browser smoke tests and release documentation for the supported V1 workflow.

**Full GaneshaDX parity remains a long-term checklist, not the V1 definition.**

***

## 🛣️📍 Roadmap 🚗🛣️

### Phase 0 - Preserve the Reference

- Keep the MonoGame/GaneshaDX implementation as behavior reference.
- Keep source profiles and migration docs close to implementation.
- Avoid guessing when source-backed evidence exists.

### Phase 1 - Real Consolidated Data

- Generate real `MAP001` consolidated output.
- Prove loader compatibility against real mesh, texture, palette, texture mapping, and metadata files.
- Keep source/provenance fields attached where the current package model exposes them.
- **Status:** implemented for the active MAP001 render baseline.

### Phase 2 - Verified Palette Rendering

- Build palette and texture registries.
- Upload indexed texture data through palette-resolved texture materials.
- Match the source texture page, palette, alpha-mask, winding, and UV conventions against the verified MAP001 GLB reference.
- Keep shader-native indexed sampling as an optimization/accuracy option, not a V1 blocker.
- **Status:** implemented for MAP001 verification, with regression tests still needed.

### Phase 3 - Editor Usability

- Maintain the anchored viewport with overlay panels.
- Keep camera movement, presets, focus, projection, zoom, and orbit behavior predictable.
- Harden face/vertex picking, hover state, and selected-face vertex handling.
- Extend command history to every new edit operation.
- Build the selected-face texture/UV/terrain inspector.
- **Status:** core viewport ergonomics are implemented; inspector workflows remain.

### Phase 4 - Format-Safe Editing

- Export modified `mesh.json` in the consolidated schema shape.
- Preserve raw/source/provenance fields.
- Add validation for every editable field that maps back to original GaneshaDX/game constraints.
- Add exact-field compatibility warnings before export.
- Add targeted tests for every enforced original-format limit.

### Phase 5 - Variant and Material Systems

- Add variant overlays and selector.
- Add fallback relationships.
- Add render properties and invisibility flag editing.
- Add UV and palette animation preview support.
- Keep lighting/material layers secondary to source-compatible texture correctness.

### Phase 6 - Packaging and Release

- Add package/session save behavior.
- Add renderer screenshot regression checks.
- Document supported workflows and known limits.
- Decide the first deployment target.
- Publish test maps and screenshots.
- Invite FFHactics/GaneshaDX community testing before calling it stable.

### Phase 7 - Post-1.0 Editor Growth

- Revisit the temporary GUI architecture.
- Add dockable panels and reusable advanced controls.
- Add command palette and richer shortcuts.
- Explore original binary import/export lanes.
- Add larger editor workflows after the V1 compatibility baseline is stable.

### Post-Parity Planned Features

These are planned after the editor has reached full GaneshaDX feature parity. They are not V1 blockers and should not displace source-compatible editing, export safety, or parity work.

1. Add automated hidden surface flagging for simplified PSX mod optimization.
2. Add mesh animation editor interface.
3. Add UV animation preview and editor interface, including integration or migration of existing tooling into a unified workflow.
4. Add event manager and cutscene creation system.
5. Add WoTL PSP compatibility.
6. Add unified version constraint configuration.
7. Add customization options.
8. Integrate the overhauled spritesheet editor and manager.
9. Add cutscene creator with video export.

***

## ⚙️⚡️⚙️ Running the Web Editor ⚙️⚡️⚙️

```bash
cd web
bun install
bun run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

Build check:

```bash
cd web
bun run build
```

***

## 📓📑 Repository Notes 🗒️✍️

- Root MonoGame files are retained as source/reference material.
- Web migration documentation lives in [`Web-Migration/`](Web-Migration/).
- The active browser implementation lives in [`web/`](web/).
- Generated `web/dist/` and `web/node_modules/` are intentionally ignored.

***

```text
⥍│                                        ☄︎                    ✧                   │
⥾│  " 𝓝  𝛢  𝜧  𝝣  𝚂        ~                  ✦                        ✧          │
⥏│             ~       d o n ' t       ~                         ⚬                 ⦙│
⇵│  ⚬     ✧                   ~       𝚖  𝚊  𝚝  𝚝  𝚎  𝚛       ~       ✦         ✧    │
⥿│                  ✦                           ✧                                  │
⥽│  ✧                        ⚭         ⚬                                  ✦        │
⥯│   What's   important   is     𝛨 𝟶 𝝎   you   𝐋 𝐈 𝐕 𝐄   your   𝙻 𝙸 𝙵 𝙴            │
⥽│     ✧                       ☓        ☓            ⚬      ✧                 ✦    ⦙│
⥍│               ☌                                                               ⭐︎ │
⥼│       ⥏     ✦    T h e   m o m e n t    '𝕻 𝕽 𝕴 𝕯 𝕰'      is       𝖑 𝖔 𝔰 𝔱 ,      │
⥿│  ⚭                                                                              ⦙│
⥼│⥌       '_𝙁_._𝙍_._𝙀_._𝙀_._𝘿_._𝙊_._𝙈_'     i s    a l s o    ⫶𝐥⫶   ⫶𝐨⫶   ⫶𝐬⫶   𝐭⫶ . . . "│
⥌│    ☌                                                    ☌                        │
⥑│            ☩                    ⚬                   ⚬                         ☽  │
⦙│     /\___        _     _    __  /\__      ⚬  ⚬_          ☼     _     /\/\        │
│/\  /     \/\  /\/ \_ ⚭/ \__/  \/    \_/\  /\/ \_/\____  __   / \  _/    \/ \  /\│
   \/         \/      \/                  \/            \/  \_/   \/          \/ 
   
      🎮 🧝🏻‍♀️ ⚔️     ₲₳₦€𝗦₶₳ 𝙳𝕏𝙻    ⛓️‍💥 📀     𝓕¡𝜂𝕒𝘓 𝓕𝞪⨅†𝜶𝛓𝜓 ℍ∆©𝜯𝚒¢₷     🛡️ 🧙 💻
```
