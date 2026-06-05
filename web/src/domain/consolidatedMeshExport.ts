import type {
  MapPolygon,
  MeshDocument,
  PolygonBucketName,
  Vec2,
  Vec3,
} from "./mapDocument";

interface EditableMeshJson {
  mapId?: string;
  meshes?: EditableMeshSection[];
  meshDefinitions?: EditableMeshDefinition[];
  meshUses?: unknown[];
  editModel?: Record<string, unknown>;
}

interface EditableMeshDefinition {
  meshRef?: string;
  data?: EditableMeshSection;
}

interface EditableMeshSection {
  id?: string;
  meshType?: string;
  texturedTriangles?: EditablePolygon[];
  texturedQuads?: EditablePolygon[];
  untexturedTriangles?: EditablePolygon[];
  untexturedQuads?: EditablePolygon[];
}

interface EditablePolygon {
  polygonIndex?: number;
  vertices?: EditableVertex[];
  texture?: EditableTexture | null;
  terrainBinding?: EditableTerrainBinding;
  renderingProperties?: Record<string, unknown>;
}

interface EditableVertex {
  vertex?: string;
  raw?: {
    x?: number;
    y?: number;
    z?: number;
  };
  ganeshaDxPosition?: {
    x?: number;
    y?: number;
    z?: number;
  };
}

interface EditableTexture {
  paletteId?: number;
  texturePage?: number;
  uvCoordinates?: EditableUv[];
  normalizedUvCoordinates?: EditableUv[];
}

interface EditableUv {
  vertex?: string;
  u?: number;
  v?: number;
}

interface EditableTerrainBinding {
  terrainX?: number;
  terrainZ?: number;
  terrainLevel?: number;
  packedTerrainZAndLevel?: number;
}

interface PolygonLookup {
  byId: ReadonlyMap<string, MapPolygon>;
  bySource: ReadonlyMap<string, MapPolygon>;
}

export function exportConsolidatedMeshJson(
  rawMeshJson: unknown,
  document: MeshDocument,
): unknown {
  if (!isEditableMeshJson(rawMeshJson)) {
    return document;
  }

  const exported = structuredClone(rawMeshJson) as EditableMeshJson;
  const lookup = buildPolygonLookup(document);

  patchMeshDefinitions(exported, lookup, document);
  patchMeshSections(exported.meshes, "consolidatedMeshJson", lookup, document);

  exported.editModel = {
    ...(exported.editModel ?? {}),
    lastExport:
      "Source-shaped export. Editable projections were updated; original source offsets and raw evidence are preserved.",
  };

  return exported;
}

function patchMeshDefinitions(
  exported: EditableMeshJson,
  lookup: PolygonLookup,
  document: MeshDocument,
): void {
  for (const [meshDefinitionIndex, meshDefinition] of (exported.meshDefinitions ?? []).entries()) {
    const section = meshDefinition.data;
    if (!section) {
      continue;
    }

    patchPolygonBucket({
      bucketName: "texturedTriangles",
      bucket: section.texturedTriangles,
      schema: "editableMeshJson",
      sectionId: meshDefinition.meshRef ?? section.id ?? section.meshType ?? "primary-mesh",
      sectionIndex: 0,
      meshDefinitionIndex,
      lookup,
      document,
    });
    patchPolygonBucket({
      bucketName: "texturedQuads",
      bucket: section.texturedQuads,
      schema: "editableMeshJson",
      sectionId: meshDefinition.meshRef ?? section.id ?? section.meshType ?? "primary-mesh",
      sectionIndex: 0,
      meshDefinitionIndex,
      lookup,
      document,
    });
    patchPolygonBucket({
      bucketName: "untexturedTriangles",
      bucket: section.untexturedTriangles,
      schema: "editableMeshJson",
      sectionId: meshDefinition.meshRef ?? section.id ?? section.meshType ?? "primary-mesh",
      sectionIndex: 0,
      meshDefinitionIndex,
      lookup,
      document,
    });
    patchPolygonBucket({
      bucketName: "untexturedQuads",
      bucket: section.untexturedQuads,
      schema: "editableMeshJson",
      sectionId: meshDefinition.meshRef ?? section.id ?? section.meshType ?? "primary-mesh",
      sectionIndex: 0,
      meshDefinitionIndex,
      lookup,
      document,
    });
  }
}

function patchMeshSections(
  sections: EditableMeshSection[] | undefined,
  schema: "editableMeshJson" | "consolidatedMeshJson",
  lookup: PolygonLookup,
  document: MeshDocument,
): void {
  for (const [sectionIndex, section] of (sections ?? []).entries()) {
    const sectionId = section.id ?? section.meshType ?? `mesh-section-${sectionIndex}`;
    patchPolygonBucket({
      bucketName: "texturedTriangles",
      bucket: section.texturedTriangles,
      schema,
      sectionId,
      sectionIndex,
      lookup,
      document,
    });
    patchPolygonBucket({
      bucketName: "texturedQuads",
      bucket: section.texturedQuads,
      schema,
      sectionId,
      sectionIndex,
      lookup,
      document,
    });
    patchPolygonBucket({
      bucketName: "untexturedTriangles",
      bucket: section.untexturedTriangles,
      schema,
      sectionId,
      sectionIndex,
      lookup,
      document,
    });
    patchPolygonBucket({
      bucketName: "untexturedQuads",
      bucket: section.untexturedQuads,
      schema,
      sectionId,
      sectionIndex,
      lookup,
      document,
    });
  }
}

function patchPolygonBucket(args: {
  bucketName: PolygonBucketName;
  bucket: EditablePolygon[] | undefined;
  schema: "editableMeshJson" | "consolidatedMeshJson";
  sectionId: string;
  sectionIndex: number;
  meshDefinitionIndex?: number;
  lookup: PolygonLookup;
  document: MeshDocument;
}): void {
  for (const [bucketIndex, rawPolygon] of (args.bucket ?? []).entries()) {
    const polygon = findSourcePolygon(args, rawPolygon, bucketIndex);
    if (!polygon) {
      continue;
    }

    patchVertices(rawPolygon, polygon, args.document);
    patchTexture(rawPolygon, polygon);
    patchTerrain(rawPolygon, polygon);
    patchRenderingProperties(rawPolygon, polygon);
  }
}

function findSourcePolygon(
  args: {
    bucketName: PolygonBucketName;
    schema: "editableMeshJson" | "consolidatedMeshJson";
    sectionId: string;
    sectionIndex: number;
    meshDefinitionIndex?: number;
    lookup: PolygonLookup;
  },
  rawPolygon: EditablePolygon,
  bucketIndex: number,
): MapPolygon | undefined {
  const polygonIndex = rawPolygon.polygonIndex ?? bucketIndex;
  const sourceCandidates = [
    sourceKey({
      schema: args.schema,
      sectionId: args.sectionId,
      sectionIndex: args.sectionIndex,
      meshDefinitionIndex: args.meshDefinitionIndex,
      bucketName: args.bucketName,
      polygonIndex,
      bucketIndex,
    }),
    sourceKey({
      schema: args.schema,
      sectionId: args.sectionId,
      sectionIndex: args.sectionIndex,
      bucketName: args.bucketName,
      polygonIndex,
      bucketIndex,
    }),
  ];

  for (const candidate of sourceCandidates) {
    const polygon = args.lookup.bySource.get(candidate);
    if (polygon) {
      return polygon;
    }
  }

  return args.lookup.byId.get(
    `${args.sectionId}-${polygonClassForBucket(args.bucketName)}-${polygonIndex}`,
  );
}

function buildPolygonLookup(document: MeshDocument): PolygonLookup {
  const byId = new Map<string, MapPolygon>();
  const bySource = new Map<string, MapPolygon>();
  for (const section of document.sections) {
    for (const polygon of section.polygons) {
      byId.set(polygon.id, polygon);
      if (polygon.source) {
        bySource.set(sourceKey(polygon.source), polygon);
        bySource.set(sourceKey({ ...polygon.source, meshDefinitionIndex: undefined }), polygon);
      }
    }
  }

  return { byId, bySource };
}

function sourceKey(source: {
  schema: "editableMeshJson" | "consolidatedMeshJson";
  sectionId: string;
  sectionIndex?: number;
  meshDefinitionIndex?: number;
  bucketName: PolygonBucketName;
  polygonIndex: number;
  bucketIndex: number;
}): string {
  return [
    source.schema,
    source.sectionId,
    source.sectionIndex ?? "",
    source.meshDefinitionIndex ?? "",
    source.bucketName,
    source.polygonIndex,
    source.bucketIndex,
  ].join("|");
}

function polygonClassForBucket(bucketName: PolygonBucketName): string {
  if (bucketName === "texturedTriangles") {
    return "textured-triangle";
  }
  if (bucketName === "texturedQuads") {
    return "textured-quad";
  }
  if (bucketName === "untexturedTriangles") {
    return "untextured-triangle";
  }
  return "untextured-quad";
}

function patchVertices(
  rawPolygon: EditablePolygon,
  polygon: MapPolygon,
  document: MeshDocument,
): void {
  for (const [vertexIndex, rawVertex] of (rawPolygon.vertices ?? []).entries()) {
    const vertexId = polygon.vertexIds[vertexIndex];
    const vertex = document.vertices.find((candidate) => candidate.id === vertexId);
    if (!vertex) {
      continue;
    }

    rawVertex.ganeshaDxPosition = vec3Object(vertex.ganeshaDxPosition);
    rawVertex.raw = {
      ...(rawVertex.raw ?? {}),
      x: -vertex.ganeshaDxPosition[0],
      y: -vertex.ganeshaDxPosition[1],
      z: vertex.ganeshaDxPosition[2],
    };
  }
}

function patchTexture(rawPolygon: EditablePolygon, polygon: MapPolygon): void {
  if (!polygon.isTextured) {
    rawPolygon.texture = null;
    return;
  }

  const texture = rawPolygon.texture ?? {};
  texture.paletteId = polygon.paletteId ?? 0;
  texture.texturePage = polygon.texturePage ?? 0;
  texture.uvCoordinates = uvObjects(polygon.uv);
  texture.normalizedUvCoordinates = normalizedUvObjects(
    polygon.uv,
    texture.texturePage,
  );
  rawPolygon.texture = texture;
}

function patchTerrain(rawPolygon: EditablePolygon, polygon: MapPolygon): void {
  if (!polygon.terrainBinding) {
    return;
  }

  const terrainBinding = rawPolygon.terrainBinding ?? {};
  terrainBinding.terrainX = polygon.terrainBinding.terrainX;
  terrainBinding.terrainZ = polygon.terrainBinding.terrainZ;
  terrainBinding.terrainLevel = polygon.terrainBinding.terrainLevel;
  terrainBinding.packedTerrainZAndLevel =
    polygon.terrainBinding.terrainZ * 2 + polygon.terrainBinding.terrainLevel;
  rawPolygon.terrainBinding = terrainBinding;
}

function patchRenderingProperties(rawPolygon: EditablePolygon, polygon: MapPolygon): void {
  const renderingProperties = polygon.preserved?.renderingProperties;
  if (
    renderingProperties &&
    typeof renderingProperties === "object" &&
    !Array.isArray(renderingProperties)
  ) {
    rawPolygon.renderingProperties = {
      ...(rawPolygon.renderingProperties ?? {}),
      ...renderingProperties,
    };
  }
}

function uvObjects(uvs: readonly Vec2[] | undefined): EditableUv[] {
  return (uvs ?? []).map((uv, index) => ({
    vertex: String.fromCharCode(65 + index),
    u: uv[0],
    v: uv[1],
  }));
}

function normalizedUvObjects(
  uvs: readonly Vec2[] | undefined,
  texturePage: number,
): EditableUv[] {
  return (uvs ?? []).map((uv, index) => ({
    vertex: String.fromCharCode(65 + index),
    u: uv[0] / 256,
    v: (texturePage * 256 + uv[1]) / 1024,
  }));
}

function vec3Object(position: Vec3): { x: number; y: number; z: number } {
  return {
    x: position[0],
    y: position[1],
    z: position[2],
  };
}

function isEditableMeshJson(value: unknown): value is EditableMeshJson {
  return (
    typeof value === "object" &&
    value !== null &&
    (("meshDefinitions" in value && Array.isArray((value as EditableMeshJson).meshDefinitions)) ||
      ("meshes" in value && Array.isArray((value as EditableMeshJson).meshes)))
  );
}
