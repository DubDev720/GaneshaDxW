import type { MeshDocument } from "./mapDocument";

export const sampleMapDocument: MeshDocument = {
  id: "MAP001-sample",
  label: "MAP001 Web Renderer Scaffold",
  vertices: [
    { id: "v0", ganeshaDxPosition: [-2.4, 0, -1.6] },
    { id: "v1", ganeshaDxPosition: [0, 0.65, -1.6] },
    { id: "v2", ganeshaDxPosition: [2.4, 0, -1.6] },
    { id: "v3", ganeshaDxPosition: [-2.6, 0, 0] },
    { id: "v4", ganeshaDxPosition: [0, 0.35, 0] },
    { id: "v5", ganeshaDxPosition: [2.6, 0, 0] },
    { id: "v6", ganeshaDxPosition: [-2.2, 0, 1.7] },
    { id: "v7", ganeshaDxPosition: [0, -0.35, 1.7] },
    { id: "v8", ganeshaDxPosition: [2.2, 0, 1.7] },
  ],
  sections: [
    {
      id: "textured",
      label: "Textured polygons",
      polygons: [
        {
          id: "poly-0",
          sectionId: "textured",
          vertexIds: ["v0", "v1", "v4", "v3"],
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          texturePage: 0,
          paletteId: 0,
          isTextured: true,
        },
        {
          id: "poly-1",
          sectionId: "textured",
          vertexIds: ["v1", "v2", "v5", "v4"],
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          texturePage: 0,
          paletteId: 1,
          isTextured: true,
        },
        {
          id: "poly-2",
          sectionId: "textured",
          vertexIds: ["v3", "v4", "v7", "v6"],
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          texturePage: 0,
          paletteId: 2,
          isTextured: true,
        },
        {
          id: "poly-3",
          sectionId: "textured",
          vertexIds: ["v4", "v5", "v8", "v7"],
          uv: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          texturePage: 0,
          paletteId: 3,
          isTextured: true,
        },
      ],
    },
    {
      id: "perimeter",
      label: "Untextured perimeter",
      polygons: [
        {
          id: "poly-perimeter",
          sectionId: "perimeter",
          vertexIds: ["v0", "v2", "v8", "v6"],
          isTextured: false,
        },
      ],
    },
  ],
};
