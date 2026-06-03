import type { LoadedMapPackage } from "../domain/sourceFormat";
import type { MapPolygon, MapVertex, MeshDocument, Vec2, Vec3 } from "../domain/mapDocument";
import {
  sanitizeMeshDocumentForGaneshaDx,
  validateMeshDocumentForGaneshaDx,
} from "../domain/compatibility";

export interface MapPackageLoader {
  loadConsolidatedMapPackage(baseUrl: string): Promise<LoadedMapPackage>;
  loadOriginalGaneshaPackage(file: File): Promise<LoadedMapPackage>;
}

type NormalizedMeshJson = MeshDocument;

interface ConsolidatedMeshJson {
  mapId?: string;
  label?: string;
  meshes?: readonly ConsolidatedMeshSection[];
}

interface ConsolidatedMeshSection {
  meshType?: string;
  id?: string;
  label?: string;
  texturedTriangles?: readonly ConsolidatedPolygon[];
  texturedQuads?: readonly ConsolidatedPolygon[];
  untexturedTriangles?: readonly ConsolidatedPolygon[];
  untexturedQuads?: readonly ConsolidatedPolygon[];
}

interface ConsolidatedPolygon {
  polygonIndex?: number;
  polygonType?: string;
  isTextured?: boolean;
  vertices?: readonly ConsolidatedVertex[];
  terrainBinding?: {
    terrainX?: number;
    terrainZ?: number;
    terrainLevel?: number;
  };
  renderingProperties?: unknown;
  untexturedControl?: unknown;
  texture?: {
    paletteId?: number;
    texturePage?: number;
    textureSource?: number;
    paletteRaw?: number;
    unknownTextureValue3?: number;
    unknownTextureValue6A?: number;
    unknownTextureValue7?: number;
    normalizedUvCoordinates?: readonly ConsolidatedVec2[];
    uvCoordinates?: readonly ConsolidatedVec2[];
  } | null;
}

interface ConsolidatedVertex {
  id?: string;
  ganeshaDxPosition?: ConsolidatedVec3;
  position?: ConsolidatedVec3;
}

type ConsolidatedVec2 = Vec2 | { x: number; y: number };
type ConsolidatedVec3 = Vec3 | { x: number; y: number; z: number };

export class BrowserMapPackageLoader implements MapPackageLoader {
  async loadConsolidatedMapPackage(baseUrl: string): Promise<LoadedMapPackage> {
    const mesh = await this.fetchJson<NormalizedMeshJson | ConsolidatedMeshJson>(
      `${baseUrl}/mesh.json`,
    );
    const normalizedDocument = this.normalizeMeshJson(mesh);
    const sanitized = sanitizeMeshDocumentForGaneshaDx(normalizedDocument);
    const compatibilityIssues = [
      ...sanitized.issues,
      ...validateMeshDocumentForGaneshaDx(sanitized.document),
    ];

    return {
      document: sanitized.document,
      provenance: {
        format: "gmapx-consolidated",
        sourcePath: baseUrl,
        mapId: sanitized.document.id,
      },
      compatibilityIssues,
    };
  }

  async loadOriginalGaneshaPackage(file: File): Promise<LoadedMapPackage> {
    await file.arrayBuffer();
    throw new Error(
      "Original GaneshaDX binary loading is intentionally deferred; keep this path separate from the renderer.",
    );
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  private normalizeMeshJson(mesh: NormalizedMeshJson | ConsolidatedMeshJson): MeshDocument {
    if (this.isNormalizedMeshDocument(mesh)) {
      return mesh;
    }

    const verticesById = new Map<string, MapVertex>();
    const sections = (mesh.meshes ?? []).map((meshSection, sectionIndex) => {
      const sectionId = meshSection.id ?? meshSection.meshType ?? `mesh-section-${sectionIndex}`;
      const polygons = [
        ...this.normalizePolygonList(
          sectionId,
          "textured-triangle",
          meshSection.texturedTriangles,
          verticesById,
        ),
        ...this.normalizePolygonList(
          sectionId,
          "textured-quad",
          meshSection.texturedQuads,
          verticesById,
        ),
        ...this.normalizePolygonList(
          sectionId,
          "untextured-triangle",
          meshSection.untexturedTriangles,
          verticesById,
        ),
        ...this.normalizePolygonList(
          sectionId,
          "untextured-quad",
          meshSection.untexturedQuads,
          verticesById,
        ),
      ];

      return {
        id: sectionId,
        label: meshSection.label ?? meshSection.meshType ?? `Mesh section ${sectionIndex + 1}`,
        polygons,
      };
    });

    return {
      id: mesh.mapId ?? "consolidated-map",
      label: mesh.label ?? mesh.mapId ?? "Consolidated map",
      vertices: [...verticesById.values()],
      sections,
    };
  }

  private isNormalizedMeshDocument(mesh: unknown): mesh is MeshDocument {
    return (
      typeof mesh === "object" &&
      mesh !== null &&
      "vertices" in mesh &&
      "sections" in mesh
    );
  }

  private normalizePolygonList(
    sectionId: string,
    polygonClass: string,
    polygons: readonly ConsolidatedPolygon[] = [],
    verticesById: Map<string, MapVertex>,
  ): MapPolygon[] {
    return polygons.map((polygon, polygonIndex) => {
      const isTextured = Boolean(polygon.isTextured ?? polygon.texture);
      const vertexIds = (polygon.vertices ?? []).map((vertex, vertexIndex) => {
        const vertexId = this.vertexId(
          sectionId,
          polygonClass,
          polygonIndex,
          vertex,
          vertexIndex,
        );
        if (!verticesById.has(vertexId)) {
          verticesById.set(vertexId, {
            id: vertexId,
            ganeshaDxPosition: this.normalizeVec3(
              vertex.ganeshaDxPosition ?? vertex.position,
            ),
          });
        }
        return vertexId;
      });

      return {
        id: `${sectionId}-${polygonClass}-${polygon.polygonIndex ?? polygonIndex}`,
        sectionId,
        vertexIds,
        uv: isTextured ? this.normalizeUvs(polygon.texture) : undefined,
        texturePage: polygon.texture?.texturePage,
        paletteId: polygon.texture?.paletteId,
        terrainBinding: polygon.terrainBinding
          ? {
              terrainX: polygon.terrainBinding.terrainX ?? 255,
              terrainZ: polygon.terrainBinding.terrainZ ?? 127,
              terrainLevel: polygon.terrainBinding.terrainLevel ?? 0,
            }
          : undefined,
        preserved: {
          polygonType: polygon.polygonType,
          renderingProperties: polygon.renderingProperties,
          texture: polygon.texture
            ? {
                paletteRaw: polygon.texture.paletteRaw,
                textureSource: polygon.texture.textureSource,
                unknownTextureValue3: polygon.texture.unknownTextureValue3,
                unknownTextureValue6A: polygon.texture.unknownTextureValue6A,
                unknownTextureValue7: polygon.texture.unknownTextureValue7,
              }
            : undefined,
          untexturedControl: polygon.untexturedControl,
        },
        isTextured,
      };
    });
  }

  private vertexId(
    sectionId: string,
    polygonClass: string,
    polygonIndex: number,
    vertex: ConsolidatedVertex,
    vertexIndex: number,
  ): string {
    return vertex.id ?? `${sectionId}-${polygonClass}-${polygonIndex}-v${vertexIndex}`;
  }

  private normalizeUvs(texture: ConsolidatedPolygon["texture"]): Vec2[] | undefined {
    const rawUvs = texture?.uvCoordinates;
    if (rawUvs) {
      return rawUvs.map((uv) => this.normalizeVec2(uv));
    }

    const normalizedUvs = texture?.normalizedUvCoordinates;
    if (normalizedUvs) {
      return normalizedUvs.map((uv) => {
        const normalized = this.normalizeVec2(uv);
        return [
          Math.round(normalized[0] * 256),
          Math.round((normalized[1] * 1024) % 256),
        ] as Vec2;
      });
    }

    return undefined;
  }

  private normalizeVec2(uv: ConsolidatedVec2): Vec2 {
    if (this.isVec2Tuple(uv)) {
      return [uv[0], uv[1]];
    }
    return [uv.x, uv.y];
  }

  private normalizeVec3(position: ConsolidatedVec3 | undefined): Vec3 {
    if (!position) {
      return [0, 0, 0];
    }
    if (this.isVec3Tuple(position)) {
      return [position[0], position[1], position[2]];
    }
    return [position.x, position.y, position.z];
  }

  private isVec2Tuple(value: ConsolidatedVec2): value is Vec2 {
    return Array.isArray(value);
  }

  private isVec3Tuple(value: ConsolidatedVec3): value is Vec3 {
    return Array.isArray(value);
  }
}
