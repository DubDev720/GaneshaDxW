export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export interface MapVertex {
  id: string;
  ganeshaDxPosition: Vec3;
}

export interface MapPolygon {
  id: string;
  sectionId: string;
  vertexIds: readonly string[];
  uv?: readonly Vec2[];
  texturePage?: number;
  paletteId?: number;
  isTextured: boolean;
}

export interface MeshSection {
  id: string;
  label: string;
  polygons: readonly MapPolygon[];
}

export interface MeshDocument {
  id: string;
  label: string;
  vertices: readonly MapVertex[];
  sections: readonly MeshSection[];
}

export interface MeshDocumentStore {
  readonly document: MeshDocument;
  getVertex(id: string): MapVertex | undefined;
  updateVertexPosition(vertexId: string, position: Vec3): MeshDocumentStore;
}

export class InMemoryMeshDocumentStore implements MeshDocumentStore {
  readonly document: MeshDocument;

  constructor(document: MeshDocument) {
    this.document = document;
  }

  getVertex(id: string): MapVertex | undefined {
    return this.document.vertices.find((vertex) => vertex.id === id);
  }

  updateVertexPosition(vertexId: string, position: Vec3): MeshDocumentStore {
    return new InMemoryMeshDocumentStore({
      ...this.document,
      vertices: this.document.vertices.map((vertex) =>
        vertex.id === vertexId
          ? {
              ...vertex,
              ganeshaDxPosition: position,
            }
          : vertex,
      ),
    });
  }
}
