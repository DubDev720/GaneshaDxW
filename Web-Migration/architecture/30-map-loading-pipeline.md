# Map Loading Pipeline - Working Draft

```mermaid
flowchart TD
  File["Map / project file"]
  IO["File IO layer"]
  Parser["Parser / deserializer"]
  State["CurrentMapState / StateData"]
  Domain["Map domain objects"]
  Geometry["Polygon / vertex / UV data"]
  Renderer["SceneRenderer"]
  Shader["FFTPolygonShader / material params"]
  Viewport["Editor viewport"]

  File --> IO
  IO --> Parser
  Parser --> State
  State --> Domain
  Domain --> Geometry
  Geometry --> Renderer
  Renderer --> Shader
  Shader --> Viewport
```

## Three.js rebuild target

```text
File
  -> ArrayBuffer / DataView reader
  -> TypeScript parser
  -> MapDocument
  -> PolygonModel[] / TexturePage[] / Palette[]
  -> THREE.BufferGeometry
  -> ShaderMaterial uniforms
  -> WebGL viewport
```

## Investigation checklist

- Identify exact file readers/writers.
- Identify canonical in-memory map state type.
- Identify polygon/vertex ownership.
- Identify texture/palette ownership.
- Identify UV animation ownership.
- Identify save/export path.
