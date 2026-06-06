import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { buildMeshDocumentExport, exportBlockingIssues } from "../src/domain/documentImportExport";
import { BrowserMapPackageLoader } from "../src/loaders/MapPackageLoader";
import type { MeshDocument } from "../src/domain/mapDocument";

interface RoundTripResult {
  path: string;
  mapId: string;
  polygonCount: number;
  sourceChanged: boolean;
}

const explicitPaths = Bun.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const strictSource = Bun.argv.includes("--strict-source");
const meshPaths = explicitPaths.length > 0 ? explicitPaths : await discoverDefaultMeshPaths();

if (meshPaths.length === 0) {
  console.error(
    "No mesh.json files supplied or discovered. Pass paths explicitly, e.g. bun scripts/golden-round-trip.ts MAP001/mesh.json",
  );
  process.exit(1);
}

const loader = new BrowserMapPackageLoader();
const results: RoundTripResult[] = [];
const failures: string[] = [];

for (const meshPath of meshPaths) {
  try {
    const rawMeshJson = await Bun.file(meshPath).json() as unknown;
    const loadedPackage = loader.loadConsolidatedMeshJson(rawMeshJson, meshPath);
    const exportResult = buildMeshDocumentExport(loadedPackage, loadedPackage.document);
    const blockingIssues = exportBlockingIssues(exportResult);
    if (blockingIssues.length > 0) {
      failures.push(
        `${meshPath}: export blocked by ${blockingIssues.length} compatibility error(s)`,
      );
      continue;
    }

    const roundTripPackage = loader.loadConsolidatedMeshJson(
      exportResult.payload,
      `${meshPath}#round-trip`,
    );
    const before = stableDocumentSnapshot(loadedPackage.document);
    const after = stableDocumentSnapshot(roundTripPackage.document);
    if (before !== after) {
      failures.push(`${meshPath}: exported mesh imports to a different editable document`);
      continue;
    }

    const sourceChanged = sourcePayloadChanged(rawMeshJson, exportResult.payload);
    if (sourceChanged && strictSource) {
      failures.push(`${meshPath}: source payload changed outside ignored export metadata`);
      continue;
    }

    results.push({
      path: meshPath,
      mapId: loadedPackage.document.id,
      polygonCount: polygonCount(loadedPackage.document),
      sourceChanged,
    });
  } catch (error) {
    failures.push(`${meshPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const result of results) {
  const sourceNote = result.sourceChanged
    ? "source payload changed"
    : "source payload stable";
  console.log(
    `ok ${result.mapId}: ${result.polygonCount} polygons, ${sourceNote} (${result.path})`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`golden round-trip passed for ${results.length} mesh document(s)`);

async function discoverDefaultMeshPaths(): Promise<string[]> {
  const candidates: string[] = [];
  const localMapRoot = "MAP-001-003";
  const localEntries = await readDirectory(localMapRoot);
  if (localEntries) {
    for (const entry of localEntries) {
      if (entry.isDirectory()) {
        const meshPath = join(localMapRoot, entry.name, "mesh.json");
        if (await Bun.file(meshPath).exists()) {
          candidates.push(meshPath);
        }
      }
    }
  }

  const publicMapRoot = "public/reports/gmapx-consolidated";
  const publicEntries = await readDirectory(publicMapRoot);
  if (publicEntries) {
    for (const entry of publicEntries) {
      if (entry.isDirectory()) {
        const meshPath = join(publicMapRoot, entry.name, "mesh.json");
        if (await Bun.file(meshPath).exists()) {
          candidates.push(meshPath);
        }
      }
    }
  }

  return candidates;
}

async function readDirectory(path: string): Promise<Awaited<ReturnType<typeof readdir>> | null> {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return null;
  }
}

function polygonCount(document: MeshDocument): number {
  return document.sections.reduce((sum, section) => sum + section.polygons.length, 0);
}

function sourcePayloadChanged(before: unknown, after: unknown): boolean {
  return stableJson(stripExportMetadata(before)) !== stableJson(stripExportMetadata(after));
}

function stripExportMetadata(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "editModel")
    .map(([key, entryValue]) => [key, stripExportMetadata(entryValue)]);
  return Object.fromEntries(entries);
}

function stableDocumentSnapshot(document: MeshDocument): string {
  return stableJson(document);
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, sortJsonValue(entryValue)]),
  );
}
