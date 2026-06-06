import type { MapPolygon, MeshDocument, Vec2, Vec3 } from "./mapDocument";
import { editorTuning } from "../config/editorTuning";

export interface CompatibilityIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  fieldPath?: string;
  recordKind?: "document" | "polygon" | "vertex";
  fieldKey?: string;
  polygonId?: string;
  vertexId?: string;
}

export const ganeshaDxCompatibility = editorTuning.ganeshaDxConstraints;

export function sanitizeMeshDocumentForGaneshaDx(document: MeshDocument): {
  document: MeshDocument;
  issues: CompatibilityIssue[];
} {
  const issues: CompatibilityIssue[] = [];

  const sanitizedVertices = document.vertices.map((vertex) => {
    const position = sanitizeVertexPosition(vertex.ganeshaDxPosition);
    if (!sameVec3(position, vertex.ganeshaDxPosition)) {
      issues.push({
        severity: "warning",
        code: "vertex.position.clamped",
        message: "Vertex position was clamped to signed 16-bit integer range.",
        fieldPath: `vertices.${vertex.id}.ganeshaDxPosition`,
        recordKind: "vertex",
        fieldKey: "ganeshaDxPosition",
        vertexId: vertex.id,
      });
    }

    return {
      ...vertex,
      ganeshaDxPosition: position,
    };
  });

  return {
    document: {
      ...document,
      vertices: sanitizedVertices,
      sections: document.sections.map((section) => ({
        ...section,
        polygons: section.polygons.map((polygon) => sanitizePolygon(polygon, issues)),
      })),
    },
    issues,
  };
}

export function validateMeshDocumentForGaneshaDx(
  document: MeshDocument,
): CompatibilityIssue[] {
  const vertexIds = new Set(document.vertices.map((vertex) => vertex.id));
  const issues: CompatibilityIssue[] = [];

  for (const section of document.sections) {
    for (const polygon of section.polygons) {
      if (
        !(ganeshaDxCompatibility.polygonVertexCounts as readonly number[]).includes(
          polygon.vertexIds.length,
        )
      ) {
        issues.push({
          severity: "error",
          code: "polygon.vertexCount.invalid",
          message: "GaneshaDX polygons must be triangles or quads.",
          recordKind: "polygon",
          fieldKey: "vertexIds",
          fieldPath: "vertexIds",
          polygonId: polygon.id,
        });
      }

      for (const vertexId of polygon.vertexIds) {
        if (!vertexIds.has(vertexId)) {
          issues.push({
            severity: "error",
            code: "polygon.vertexRef.missing",
            message: "Polygon references a missing vertex.",
            recordKind: "polygon",
            fieldKey: "vertexIds",
            fieldPath: "vertexIds",
            polygonId: polygon.id,
            vertexId,
          });
        }
      }

      if (polygon.isTextured && (!polygon.uv || polygon.uv.length !== polygon.vertexIds.length)) {
        issues.push({
          severity: "error",
          code: "polygon.uvCount.invalid",
          message: "Textured polygon UV count must match its vertex count.",
          fieldPath: "texture.uvCoordinates",
          recordKind: "polygon",
          fieldKey: "uv",
          polygonId: polygon.id,
        });
      }

      if (!polygon.isTextured && polygon.uv && polygon.uv.length > 0) {
        issues.push({
          severity: "warning",
          code: "polygon.uv.untextured",
          message: "Untextured perimeter polygons should not carry UV data.",
          fieldPath: "texture.uvCoordinates",
          recordKind: "polygon",
          fieldKey: "uv",
          polygonId: polygon.id,
        });
      }

      validateRange(
        polygon.paletteId,
        ganeshaDxCompatibility.paletteId,
        issues,
        "polygon.paletteId.range",
        "Palette IDs must stay in the original 0-15 range.",
        polygon.id,
        "texture.paletteId",
        "paletteId",
      );
      validateRange(
        polygon.texturePage,
        ganeshaDxCompatibility.texturePage,
        issues,
        "polygon.texturePage.range",
        "Texture pages must stay in the original 0-3 atlas page range.",
        polygon.id,
        "texture.texturePage",
        "texturePage",
      );
      validateRange(
        polygon.terrainBinding?.terrainX,
        ganeshaDxCompatibility.terrainX,
        issues,
        "polygon.terrainX.range",
        "Terrain X must stay in the original 0-255 range.",
        polygon.id,
        "terrainBinding.terrainX",
        "terrainX",
      );
      validateRange(
        polygon.terrainBinding?.terrainZ,
        ganeshaDxCompatibility.terrainZ,
        issues,
        "polygon.terrainZ.range",
        "Terrain Z must stay in the original 0-127 range.",
        polygon.id,
        "terrainBinding.terrainZ",
        "terrainZ",
      );
      validateRange(
        polygon.terrainBinding?.terrainLevel,
        ganeshaDxCompatibility.terrainLevel,
        issues,
        "polygon.terrainLevel.range",
        "Terrain level must stay in the original 0-1 range.",
        polygon.id,
        "terrainBinding.terrainLevel",
        "terrainLevel",
      );

      for (const [uvIndex, uv] of polygon.uv?.entries() ?? []) {
        validateRange(
          uv[0],
          { min: 0, max: ganeshaDxCompatibility.textureAtlas.pageWidth - 1 },
          issues,
          "polygon.uv.u.range",
          "UV U must stay in the original 0-255 page-local range.",
          polygon.id,
          `texture.uvCoordinates[${uvIndex}].u`,
          `uv:${uvIndex}:u`,
        );
        validateRange(
          uv[1],
          { min: 0, max: ganeshaDxCompatibility.textureAtlas.pageHeight - 1 },
          issues,
          "polygon.uv.v.range",
          "UV V must stay in the original 0-255 page-local range.",
          polygon.id,
          `texture.uvCoordinates[${uvIndex}].v`,
          `uv:${uvIndex}:v`,
        );
      }
    }
  }

  return issues;
}

export function sanitizeVertexPosition(position: Vec3): Vec3 {
  return [
    clampInteger(position[0], ganeshaDxCompatibility.vertexPosition.x),
    clampInteger(position[1], ganeshaDxCompatibility.vertexPosition.y),
    clampInteger(position[2], ganeshaDxCompatibility.vertexPosition.z),
  ];
}

function sanitizePolygon(
  polygon: MapPolygon,
  issues: CompatibilityIssue[],
): MapPolygon {
  const paletteId =
    polygon.paletteId === undefined
      ? undefined
      : clampInteger(polygon.paletteId, ganeshaDxCompatibility.paletteId);
  const texturePage =
    polygon.texturePage === undefined
      ? undefined
      : clampInteger(polygon.texturePage, ganeshaDxCompatibility.texturePage);
  const uv = sanitizeUvs(polygon, issues);
  const terrainBinding = polygon.terrainBinding
    ? {
        terrainX: clampInteger(polygon.terrainBinding.terrainX, ganeshaDxCompatibility.terrainX),
        terrainZ: clampInteger(polygon.terrainBinding.terrainZ, ganeshaDxCompatibility.terrainZ),
        terrainLevel: clampInteger(
          polygon.terrainBinding.terrainLevel,
          ganeshaDxCompatibility.terrainLevel,
        ),
      }
    : undefined;

  if (paletteId !== polygon.paletteId) {
    issues.push({
      severity: "warning",
      code: "polygon.paletteId.clamped",
      message: "Palette ID was clamped to the original 0-15 range.",
      fieldPath: "texture.paletteId",
      recordKind: "polygon",
      fieldKey: "paletteId",
      polygonId: polygon.id,
    });
  }

  if (texturePage !== polygon.texturePage) {
    issues.push({
      severity: "warning",
      code: "polygon.texturePage.clamped",
      message: "Texture page was clamped to the original 0-3 range.",
      fieldPath: "texture.texturePage",
      recordKind: "polygon",
      fieldKey: "texturePage",
      polygonId: polygon.id,
    });
  }

  if (
    terrainBinding &&
    polygon.terrainBinding &&
    terrainBinding.terrainX !== polygon.terrainBinding.terrainX
  ) {
    issues.push({
      severity: "warning",
      code: "polygon.terrainX.clamped",
      message: "Terrain X was clamped to the original 0-255 range.",
      fieldPath: "terrainBinding.terrainX",
      recordKind: "polygon",
      fieldKey: "terrainX",
      polygonId: polygon.id,
    });
  }

  if (
    terrainBinding &&
    polygon.terrainBinding &&
    terrainBinding.terrainZ !== polygon.terrainBinding.terrainZ
  ) {
    issues.push({
      severity: "warning",
      code: "polygon.terrainZ.clamped",
      message: "Terrain Z was clamped to the original 0-127 range.",
      fieldPath: "terrainBinding.terrainZ",
      recordKind: "polygon",
      fieldKey: "terrainZ",
      polygonId: polygon.id,
    });
  }

  if (
    terrainBinding &&
    polygon.terrainBinding &&
    terrainBinding.terrainLevel !== polygon.terrainBinding.terrainLevel
  ) {
    issues.push({
      severity: "warning",
      code: "polygon.terrainLevel.clamped",
      message: "Terrain level was clamped to the original 0-1 range.",
      fieldPath: "terrainBinding.terrainLevel",
      recordKind: "polygon",
      fieldKey: "terrainLevel",
      polygonId: polygon.id,
    });
  }

  return {
    ...polygon,
    paletteId,
    texturePage,
    terrainBinding,
    uv,
  };
}

function sanitizeUvs(
  polygon: MapPolygon,
  issues: CompatibilityIssue[],
): readonly Vec2[] | undefined {
  if (!polygon.isTextured) {
    return undefined;
  }

  if (!polygon.uv) {
    return polygon.uv;
  }

  const sanitizedUvs = polygon.uv.map((uv): Vec2 => [
    clampInteger(uv[0], { min: 0, max: ganeshaDxCompatibility.textureAtlas.pageWidth - 1 }),
    clampInteger(uv[1], { min: 0, max: ganeshaDxCompatibility.textureAtlas.pageHeight - 1 }),
  ]);

  if (sanitizedUvs.some((uv, index) => !sameVec2(uv, polygon.uv?.[index] ?? uv))) {
    issues.push({
      severity: "warning",
      code: "polygon.uv.clamped",
      message: "UVs were clamped to the original 256x256 page-local byte range.",
      fieldPath: "texture.uvCoordinates",
      recordKind: "polygon",
      fieldKey: "uv",
      polygonId: polygon.id,
    });
  }

  return sanitizedUvs;
}

function validateRange(
  value: number | undefined,
  range: { min: number; max: number },
  issues: CompatibilityIssue[],
  code: string,
  message: string,
  polygonId: string,
  fieldPath?: string,
  fieldKey?: string,
): void {
  if (value === undefined) {
    return;
  }

  if (value < range.min || value > range.max || !Number.isInteger(value)) {
    issues.push({
      severity: "error",
      code,
      message,
      fieldPath,
      recordKind: "polygon",
      fieldKey,
      polygonId,
    });
  }
}

function clampInteger(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

function sameVec2(left: Vec2, right: Vec2): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function sameVec3(left: Vec3, right: Vec3): boolean {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
}
