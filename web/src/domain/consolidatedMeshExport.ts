import type { MapPolygon, MeshDocument, Vec2, Vec3 } from "./mapDocument";

interface EditableMeshJson {
  mapId?: string;
  meshDefinitions?: EditableMeshDefinition[];
  meshUses?: unknown[];
  editModel?: Record<string, unknown>;
}

interface EditableMeshDefinition {
  meshRef?: string;
  data?: EditableMeshSection;
}

interface EditableMeshSection {
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

export function exportConsolidatedMeshJson(
  rawMeshJson: unknown,
  document: MeshDocument,
): unknown {
  if (!isEditableMeshJson(rawMeshJson)) {
    return document;
  }

  const exported = structuredClone(rawMeshJson) as EditableMeshJson;
  const polygonsById = new Map<string, MapPolygon>();
  for (const section of document.sections) {
    for (const polygon of section.polygons) {
      polygonsById.set(polygon.id, polygon);
    }
  }

  for (const meshDefinition of exported.meshDefinitions ?? []) {
    const section = meshDefinition.data;
    if (!section) {
      continue;
    }

    const sectionId = meshDefinition.meshRef ?? section.meshType ?? "primary-mesh";
    patchPolygonBucket(
      sectionId,
      "textured-triangle",
      section.texturedTriangles,
      polygonsById,
      document,
    );
    patchPolygonBucket(
      sectionId,
      "textured-quad",
      section.texturedQuads,
      polygonsById,
      document,
    );
    patchPolygonBucket(
      sectionId,
      "untextured-triangle",
      section.untexturedTriangles,
      polygonsById,
      document,
    );
    patchPolygonBucket(
      sectionId,
      "untextured-quad",
      section.untexturedQuads,
      polygonsById,
      document,
    );
  }

  exported.editModel = {
    ...(exported.editModel ?? {}),
    lastExport:
      "Source-shaped export. Editable projections were updated; original source offsets and raw evidence are preserved.",
  };

  return exported;
}

function patchPolygonBucket(
  sectionId: string,
  polygonClass: string,
  bucket: EditablePolygon[] | undefined,
  polygonsById: ReadonlyMap<string, MapPolygon>,
  document: MeshDocument,
): void {
  for (const [bucketIndex, rawPolygon] of bucket?.entries() ?? []) {
    const polygonId = `${sectionId}-${polygonClass}-${rawPolygon.polygonIndex ?? bucketIndex}`;
    const polygon = polygonsById.get(polygonId);
    if (!polygon) {
      continue;
    }

    patchVertices(rawPolygon, polygon, document);
    patchTexture(rawPolygon, polygon);
    patchTerrain(rawPolygon, polygon);
    patchRenderingProperties(rawPolygon, polygon);
  }
}

function patchVertices(
  rawPolygon: EditablePolygon,
  polygon: MapPolygon,
  document: MeshDocument,
): void {
  for (const [vertexIndex, rawVertex] of rawPolygon.vertices?.entries() ?? []) {
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
    "meshDefinitions" in value &&
    Array.isArray((value as { meshDefinitions?: unknown }).meshDefinitions)
  );
}
