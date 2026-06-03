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
consolidated JSON
  -> normalized MeshDocument
  -> editable document store
  -> renderer adapter
  -> GPU buffers
```

The renderer consumes the document. It does not own the map model.

The original binary/lossless path remains separate:

```text
lossless .gmapx + source offsets/raw bytes
  -> provenance and future binary patching authority
```

This split lets the web editor stay practical while still respecting original-format compatibility.

***

## Current Implementation

The active browser migration lives in [`web/`](web/).

**Implemented so far:**

- Bun + Vite + TypeScript scaffold.
- Three.js WebGPU renderer with WebGL2 fallback.
- Renderer adapter boundary.
- Consolidated JSON loader scaffold.
- `MAP001` test fixture under `web/public/reports/gmapx-consolidated/`.
- Normalized `MeshDocument` model.
- Source-format/provenance model.
- Geometry builder for triangles and quads.
- Material resolver with temporary visual materials.
- Flat black untextured perimeter rendering.
- GaneshaDX compatibility validation and clamping.
- Document-driven scene tree.
- Polygon selection from UI.
- Vertex selection from UI.
- Canvas raycast polygon picking.
- Near-vertex picking path.
- Per-vertex translation controls.
- Undo/redo edit history.
- Modified `mesh.json` export/download.
- Visible compatibility status panel.

*Current testing GUI note:*
 
 The current hand-written DOM GUI is good enough for early testing. Once more editing tools are incorporated, the project should evaluate a more durable GUI approach: React, Solid, Svelte, dockable panels, command palette, keyboard shortcuts, inspector forms, and reusable editor components.

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

**Core data and rendering:**

- Replace the scaffold fixture with real generated `reports/gmapx-consolidated` data.
- Implement `PaletteRegistry`.
- Implement `TextureRegistry`.
- Load `palettes.master.json`.
- Load `base-textures.json`.
- Load `texture-mapping.json`.
- Load and display `metadata.json`.
- Implement real indexed texture upload.
- Implement palette lookup shader.
- Apply polygon `paletteId` in the shader.
- Apply `texturePage` and page-local UV mapping correctly.
- Add material keys based on texture and palette identity.
- Preserve consolidated schema shape on export.

**Editor tools:**

- Add visible vertex handles in the viewport.
- Add drag-based vertex translation.
- Add keyboard nudging.
- Add polygon create/delete tools.
- Add textured/untextured conversion.
- Add triangle/quad conversion or split tools where safe.
- Add UV editor.
- Add texture page preview.
- Add terrain binding editor.
- Add render properties and invisibility flags editor.
- Add unknown/source-preserved byte editor.
- Add validation warnings tied to exact fields.

**Map systems:**

- Add `VariantResolver`.
- Add variant selector.
- Preserve base-state fallback relationships.
- Add lighting/material layer.
- Add UV animation support.
- Add palette animation support.
- Add animated mesh sections.
- Keep tactical grid as a separate later layer.

**Packaging and release:**

- Add a map/package chooser.
- Add project/session save behavior.
- Add automated tests for compatibility limits.
- Add browser smoke tests.
- Add screenshot regression checks for renderer output.
- Add build/release instructions.
- Decide deployment target.
- Decide long-term GUI framework.

***

## Roadmap

### Phase 0 - Preserve the Reference

- Keep the MonoGame/GaneshaDX implementation as behavior reference.
- Keep source profiles and migration docs close to implementation.
- Avoid guessing when source-backed evidence exists.

### Phase 1 - Real Consolidated Data

- Replace scaffold fixture with real `MAP001` consolidated output.
- Prove loader compatibility against real mesh, texture, palette, and metadata files.
- Keep unknown/source-preserved fields attached.

### Phase 2 - Real Palette Rendering

- Build `PaletteRegistry`.
- Build `TextureRegistry`.
- Upload indexed texture data.
- Implement palette lookup shader path.
- Render textured polygons through palette lookup instead of temporary colors.

### Phase 3 - Editor Usability

- Add viewport vertex handles.
- Add drag transforms.
- Add keyboard controls.
- Add command history for all edit operations.
- Improve selection, hover, and inspector state.

### Phase 4 - Format-Safe Editing

- Export modified `mesh.json` in the consolidated schema shape.
- Preserve raw/source/provenance fields.
- Add validation for every editable field that maps back to original GaneshaDX/game constraints.

### Phase 5 - Variant and Material Systems

- Add variant overlays.
- Add fallback relationships.
- Add lighting/material layer.
- Add UV and palette animation support.

### Phase 6 - Tooling and GUI Upgrade

- Decide whether to migrate the testing GUI to React, Solid, Svelte, or another editor-oriented UI stack.
- Add dockable panels and reusable controls.
- Add command palette and shortcuts.
- Add richer editor workflows without coupling UI state to renderer state.

### Phase 7 - Public Release

- Package the web app.
- Document supported workflows.
- Include compatibility warnings.
- Publish test maps and screenshots.
- Invite FFHactics/GaneshaDX community testing before calling it stable.

***

## Running the Web Editor

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

## Repository Notes

- Root MonoGame files are retained as source/reference material.
- Web migration documentation lives in [`Web-Migration/`](Web-Migration/).
- The active browser implementation lives in [`web/`](web/).
- Generated `web/dist/` and `web/node_modules/` are intentionally ignored.

***

```text
│                                                                                 │
│   "N  A  M  E  S                                                                │
│                     d o n ' t                                                   │
│                                   m  a  t  t  e  r  .  .  .                     │
│                                                                                 │
│                                                                                 │
│   What's important  is      H O W   Y O U   L I V E   your   L I F E .          │
│                                                                                 │
│                                                                                 │
│                 T h e   m o m e n t    'P R I D E'      is       l o s t ,      │
│                                                                                 │
│         'F   R   E   E   D   O   M'     i s    a l s o    L   O   S   T . . ."  │
│                                                                                 │
│                                                                                 │
│     /\___        _     _    __  /\__         _                _     /\/\        │
│/\  /     \/\  /\/ \_  / \__/  \/    \_/\/\  / \_/\____  __   / \  _/    \/ \  /\│
   \/         \/      \/                   \/           \/  \_/   \/          \/ 
   
      🎮 🧝🏻‍♀️ ⚔️     GaneshaDXW     ⛓️‍💥 📀     Final Fantasy Hactics     🛡️ 🧙 💻
```
