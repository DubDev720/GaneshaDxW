import {
  validateMeshDocumentForGaneshaDx,
  type CompatibilityIssue,
} from "./compatibility";
import { exportConsolidatedMeshJson } from "./consolidatedMeshExport";
import type { MeshDocument } from "./mapDocument";
import type { LoadedMapPackage } from "./sourceFormat";

export interface MeshDocumentExportResult {
  fileName: string;
  payload: unknown;
  json: string;
  issues: readonly CompatibilityIssue[];
}

export function buildMeshDocumentExport(
  loadedPackage: LoadedMapPackage | null,
  document: MeshDocument,
): MeshDocumentExportResult {
  const issues = validateMeshDocumentForGaneshaDx(document);
  const exportPayload = loadedPackage?.rawMeshJson
    ? exportConsolidatedMeshJson(loadedPackage.rawMeshJson, document)
    : document;

  return {
    fileName: loadedPackage?.rawMeshJson
      ? `${document.id}.consolidated.mesh.json`
      : `${document.id}.mesh.json`,
    payload: exportPayload,
    json: serializeJsonDocument(exportPayload),
    issues,
  };
}

export function exportBlockingIssues(
  exportResult: MeshDocumentExportResult,
): readonly CompatibilityIssue[] {
  return exportResult.issues.filter((issue) => issue.severity === "error");
}

export function serializeJsonDocument(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
