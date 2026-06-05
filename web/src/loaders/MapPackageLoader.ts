import type {
  ConsolidatedMapPackageIndex,
  ConsolidatedMapPackageMetadata,
  LoadedMapPackage,
  PackageHealth,
  PackageHealthCheck,
} from "../domain/sourceFormat";
import type { MapPolygon, MapVertex, MeshDocument, Vec2, Vec3 } from "../domain/mapDocument";
import type {
  BaseTexturesJson,
  PaletteMasterJson,
  RenderResourceBundle,
  TextureMappingJson,
} from "../domain/renderResources";
import {
  sanitizeMeshDocumentForGaneshaDx,
  validateMeshDocumentForGaneshaDx,
} from "../domain/compatibility";

export interface MapPackageLoader {
  loadConsolidatedMapIndex(baseUrl: string): Promise<ConsolidatedMapPackageIndex>;
  loadConsolidatedMapPackage(baseUrl: string): Promise<LoadedMapPackage>;
  loadOriginalGaneshaPackage(file: File): Promise<LoadedMapPackage>;
}

type NormalizedMeshJson = MeshDocument;

interface EditableMeshJson {
  mapId?: string;
  meshDefinitions?: readonly EditableMeshDefinition[];
  meshUses?: readonly EditableMeshUse[];
}

interface EditableMeshDefinition {
  meshRef?: string;
  canonicalSource?: string;
  data?: ConsolidatedMeshSection;
}

interface EditableMeshUse {
  meshResource?: string;
  meshType?: string;
  meshRef?: string;
  state?: {
    arrangement?: string;
    time?: string;
    weather?: string;
  };
}

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
  vertex?: string;
  ganeshaDxPosition?: ConsolidatedVec3;
  position?: ConsolidatedVec3;
}

type ConsolidatedVec2 = Vec2 | { x: number; y: number } | { u: number; v: number };
type ConsolidatedVec3 = Vec3 | { x: number; y: number; z: number };

export class BrowserMapPackageLoader implements MapPackageLoader {
  async loadConsolidatedMapIndex(baseUrl: string): Promise<ConsolidatedMapPackageIndex> {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const index = await this.fetchJson<ConsolidatedMapPackageIndex>(
      `${normalizedBaseUrl}/index.json`,
    );

    return {
      maps: (index.maps ?? [])
        .filter((entry) => entry.mapId && entry.path)
        .map((entry) => ({
          mapId: entry.mapId,
          path: entry.path,
          label: entry.label,
        })),
    };
  }

  async loadConsolidatedMapPackage(baseUrl: string): Promise<LoadedMapPackage> {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const collectionBaseUrl = normalizedBaseUrl.replace(/\/[^/]+$/, "");
    const [mesh, metadata, renderResources] = await Promise.all([
      this.fetchJson<NormalizedMeshJson | ConsolidatedMeshJson | EditableMeshJson>(
        `${normalizedBaseUrl}/mesh.json`,
      ),
      this.fetchMaybeJson<ConsolidatedMapPackageMetadata>(
        `${normalizedBaseUrl}/metadata.json`,
      ),
      this.loadRenderResources(normalizedBaseUrl, collectionBaseUrl),
    ]);
    const normalizedDocument = this.normalizeMeshJson(mesh);
    const sanitized = sanitizeMeshDocumentForGaneshaDx(normalizedDocument);
    const compatibilityIssues = [
      ...sanitized.issues,
      ...validateMeshDocumentForGaneshaDx(sanitized.document),
    ];
    const packageHealth = this.buildPackageHealth(
      sanitized.document,
      metadata,
      renderResources,
      compatibilityIssues,
    );

    return {
      document: sanitized.document,
      provenance: {
        format: "gmapx-consolidated",
        sourcePath: normalizedBaseUrl,
        mapId: sanitized.document.id,
      },
      rawMeshJson: mesh,
      metadata,
      compatibilityIssues,
      packageHealth,
      renderResources,
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

  private async fetchOptionalJson<T>(url: string, fallback: T): Promise<T> {
    try {
      return await this.fetchJson<T>(url);
    } catch (error) {
      console.warn(`Optional render resource unavailable: ${url}`, error);
      return fallback;
    }
  }

  private async fetchMaybeJson<T>(url: string): Promise<T | undefined> {
    try {
      return await this.fetchJson<T>(url);
    } catch (error) {
      console.warn(`Optional package metadata unavailable: ${url}`, error);
      return undefined;
    }
  }

  private async loadRenderResources(
    mapBaseUrl: string,
    collectionBaseUrl: string,
  ): Promise<RenderResourceBundle> {
    const [palettes, baseTextures, textureMapping] = await Promise.all([
      this.fetchOptionalJson<PaletteMasterJson>(
        `${collectionBaseUrl}/palettes.master.json`,
        { palettes: [] },
      ),
      this.fetchOptionalJson<BaseTexturesJson>(
        `${mapBaseUrl}/base-textures.json`,
        { textures: [] },
      ),
      this.fetchOptionalJson<TextureMappingJson>(
        `${mapBaseUrl}/texture-mapping.json`,
        { mappings: [] },
      ),
    ]);

    return {
      palettes,
      baseTextures,
      textureMapping,
    };
  }

  private buildPackageHealth(
    document: MeshDocument,
    metadata: ConsolidatedMapPackageMetadata | undefined,
    renderResources: RenderResourceBundle,
    compatibilityIssues: readonly { severity: "error" | "warning" }[],
  ): PackageHealth {
    const polygonCount = document.sections.reduce(
      (sum, section) => sum + section.polygons.length,
      0,
    );
    const errorCount = compatibilityIssues.filter((issue) => issue.severity === "error").length;
    const warningCount = compatibilityIssues.filter((issue) => issue.severity === "warning").length;
    const checks: PackageHealthCheck[] = [
      {
        id: "metadata",
        label: "Metadata",
        status: metadata ? "ok" : "warning",
        detail: metadata
          ? `${metadata.format ?? "metadata"} v${metadata.version ?? "unknown"} loaded`
          : "metadata.json was not found; package counts and source references are unavailable",
      },
      {
        id: "mesh",
        label: "Mesh document",
        status: document.vertices.length > 0 && polygonCount > 0 ? "ok" : "error",
        detail: `${document.vertices.length} vertices, ${document.sections.length} sections, ${polygonCount} polygons`,
      },
      {
        id: "palettes",
        label: "Palette master",
        status: (renderResources.palettes.palettes?.length ?? 0) > 0 ? "ok" : "warning",
        detail: `${renderResources.palettes.palettes?.length ?? 0} palettes loaded`,
      },
      {
        id: "textures",
        label: "Indexed textures",
        status: (renderResources.baseTextures.textures?.length ?? 0) > 0 ? "ok" : "warning",
        detail: `${renderResources.baseTextures.textures?.length ?? 0} indexed texture payloads loaded`,
      },
      {
        id: "texture-mapping",
        label: "Texture mappings",
        status:
          (renderResources.textureMapping.mappings?.length ?? 0) > 0 ||
          (renderResources.textureMapping.meshMappings?.length ?? 0) > 0
            ? "ok"
            : "warning",
        detail: `${renderResources.textureMapping.mappings?.length ?? 0} polygon mappings, ${renderResources.textureMapping.meshMappings?.length ?? 0} mesh mappings`,
      },
      {
        id: "compatibility",
        label: "Compatibility",
        status: errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "ok",
        detail: errorCount > 0 || warningCount > 0
          ? `${errorCount} errors, ${warningCount} warnings`
          : "Loaded values fit current GaneshaDX guardrails",
      },
    ];

    return {
      status: checks.some((check) => check.status === "error")
        ? "error"
        : checks.some((check) => check.status === "warning")
          ? "warning"
          : "healthy",
      checks,
    };
  }

  private normalizeMeshJson(
    mesh: NormalizedMeshJson | ConsolidatedMeshJson | EditableMeshJson,
  ): MeshDocument {
    if (this.isNormalizedMeshDocument(mesh)) {
      return mesh;
    }

    if (this.isEditableMeshJson(mesh)) {
      return this.normalizeEditableMeshJson(mesh);
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

  private isEditableMeshJson(mesh: unknown): mesh is EditableMeshJson {
    return (
      typeof mesh === "object" &&
      mesh !== null &&
      "meshDefinitions" in mesh &&
      "meshUses" in mesh
    );
  }

  private normalizeEditableMeshJson(mesh: EditableMeshJson): MeshDocument {
    const meshUse = mesh.meshUses?.[0];
    const meshDefinition = mesh.meshDefinitions?.find(
      (definition) => definition.meshRef === meshUse?.meshRef,
    ) ?? mesh.meshDefinitions?.[0];
    const meshData = meshDefinition?.data;
    const verticesById = new Map<string, MapVertex>();

    if (!meshData) {
      return {
        id: mesh.mapId ?? "editable-map",
        label: mesh.mapId ?? "Editable map",
        vertices: [],
        sections: [],
      };
    }

    const sectionId = meshDefinition?.meshRef ?? meshData.meshType ?? "primary-mesh";
    const stateLabel = meshUse?.state
      ? `${meshUse.state.arrangement ?? "State"} ${meshUse.state.time ?? ""} ${meshUse.state.weather ?? ""}`.trim()
      : "Primary";
    const polygons = [
      ...this.normalizePolygonList(
        sectionId,
        "textured-triangle",
        meshData.texturedTriangles,
        verticesById,
        meshUse,
        meshDefinition,
      ),
      ...this.normalizePolygonList(
        sectionId,
        "textured-quad",
        meshData.texturedQuads,
        verticesById,
        meshUse,
        meshDefinition,
      ),
      ...this.normalizePolygonList(
        sectionId,
        "untextured-triangle",
        meshData.untexturedTriangles,
        verticesById,
        meshUse,
        meshDefinition,
      ),
      ...this.normalizePolygonList(
        sectionId,
        "untextured-quad",
        meshData.untexturedQuads,
        verticesById,
        meshUse,
        meshDefinition,
      ),
    ];

    return {
      id: mesh.mapId ?? "editable-map",
      label: `${mesh.mapId ?? "Editable map"} ${stateLabel}`,
      vertices: [...verticesById.values()],
      sections: [
        {
          id: sectionId,
          label: `${meshData.meshType ?? "Mesh"} ${stateLabel}`,
          polygons,
        },
      ],
    };
  }

  private normalizePolygonList(
    sectionId: string,
    polygonClass: string,
    polygons: readonly ConsolidatedPolygon[] = [],
    verticesById: Map<string, MapVertex>,
    meshUse?: EditableMeshUse,
    meshDefinition?: EditableMeshDefinition,
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
          meshResource: meshUse?.meshResource,
          meshRef: meshDefinition?.meshRef,
          canonicalSource: meshDefinition?.canonicalSource,
          state: meshUse?.state,
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
    return vertex.id ?? `${sectionId}-${polygonClass}-${polygonIndex}-${vertex.vertex ?? `v${vertexIndex}`}`;
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
    if ("x" in uv) {
      return [uv.x, uv.y];
    }
    return [uv.u, uv.v];
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
