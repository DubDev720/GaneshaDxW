import { sanitizeVertexPosition } from "./compatibility";

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
  source?: MapPolygonSource;
  uv?: readonly Vec2[];
  texturePage?: number;
  paletteId?: number;
  terrainBinding?: {
    terrainX: number;
    terrainZ: number;
    terrainLevel: number;
  };
  preserved?: Record<string, unknown>;
  isTextured: boolean;
}

export type PolygonBucketName =
  | "texturedTriangles"
  | "texturedQuads"
  | "untexturedTriangles"
  | "untexturedQuads";

export interface MapPolygonSource {
  schema: "editableMeshJson" | "consolidatedMeshJson";
  sectionId: string;
  sectionIndex?: number;
  meshRef?: string;
  meshDefinitionIndex?: number;
  meshUseIndex?: number;
  bucketName: PolygonBucketName;
  polygonClass: string;
  polygonIndex: number;
  bucketIndex: number;
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

export function getPolygon(document: MeshDocument, polygonId: string | null): MapPolygon | undefined {
  if (!polygonId) {
    return undefined;
  }

  for (const section of document.sections) {
    const polygon = section.polygons.find((candidate) => candidate.id === polygonId);
    if (polygon) {
      return polygon;
    }
  }

  return undefined;
}

export function updateVertexPositionInDocument(
  document: MeshDocument,
  vertexId: string,
  position: Vec3,
): MeshDocument {
  return new InMemoryMeshDocumentStore(document).updateVertexPosition(vertexId, position).document;
}

export function updatePolygonInDocument(
  document: MeshDocument,
  polygonId: string,
  updater: (polygon: MapPolygon) => MapPolygon,
): MeshDocument {
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      polygons: section.polygons.map((polygon) =>
        polygon.id === polygonId ? updater(polygon) : polygon
      ),
    })),
  };
}

export function nudgeVertexPosition(
  document: MeshDocument,
  vertexId: string,
  delta: Vec3,
): MeshDocument {
  const vertex = document.vertices.find((candidate) => candidate.id === vertexId);
  if (!vertex) {
    return document;
  }

  return updateVertexPositionInDocument(document, vertexId, [
    vertex.ganeshaDxPosition[0] + delta[0],
    vertex.ganeshaDxPosition[1] + delta[1],
    vertex.ganeshaDxPosition[2] + delta[2],
  ]);
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
    const compatiblePosition = sanitizeVertexPosition(position);

    return new InMemoryMeshDocumentStore({
      ...this.document,
      vertices: this.document.vertices.map((vertex) =>
        vertex.id === vertexId
          ? {
              ...vertex,
              ganeshaDxPosition: compatiblePosition,
            }
          : vertex,
      ),
    });
  }
}
