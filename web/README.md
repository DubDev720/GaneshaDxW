# GaneshaDXW Web

This is the browser migration surface for GaneshaDXW.

## Stack

- Bun
- Vite
- TypeScript
- Three.js `WebGPURenderer`
- WebGL2 fallback

## Architecture Boundary

The renderer consumes a normalized `MeshDocument`. It does not own the map data
model and does not require the editor to stay JSON-only forever.

The intended V1 loader path is `reports/gmapx-consolidated/MAP###` because it is
the smoothest web editor format:

- direct JSON loading
- editable mesh definitions
- quads preserved in document state
- triangulation only at renderer time
- palette and texture references preserved

The original GaneshaDX binary format remains a separate source/provenance path.
The loader surface already has a placeholder for that route so binary patching or
lossless round-tripping can be added without rewriting the renderer.

```text
gmapx-consolidated JSON -> normalized MeshDocument -> renderer adapter
original GaneshaDX data  -> normalized MeshDocument -> renderer adapter
```

## Local Map Data

Generated map payloads should stay local. Put local package settings in
`public/ganeshadxw.local.json` using `public/ganeshadxw.local.example.json` as
the template. The whole `public/reports/` tree is ignored so the editor can load
generated meshes, metadata, palettes, texture mappings, and base textures locally
without shipping them in source.

## Commands

```bash
bun install
bun run dev
bun run build
bun run golden:round-trip
```

`bun run golden:round-trip` imports local consolidated `mesh.json` files,
exports them through the same source-shaped document exporter used by the UI,
then imports the result again and verifies that the editable `MeshDocument`
round-trips without changing. Pass explicit mesh paths to check specific files.
