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

## Commands

```bash
bun install
bun run dev
bun run build
```
