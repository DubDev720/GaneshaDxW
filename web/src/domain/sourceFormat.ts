import type { MeshDocument } from "./mapDocument";
import type { CompatibilityIssue } from "./compatibility";
import type { RenderResourceBundle } from "./renderResources";

export type SourceFormat = "gmapx-consolidated" | "ganesha-original";
export type PackageHealthStatus = "healthy" | "warning" | "error";
export type PackageHealthCheckStatus = "ok" | "warning" | "error";

export interface ConsolidatedMapPackageIndex {
  maps: readonly ConsolidatedMapPackageIndexEntry[];
}

export interface ConsolidatedMapPackageIndexEntry {
  mapId: string;
  path: string;
  label?: string;
}

export interface ConsolidatedMapPackageMetadata {
  format?: string;
  version?: number;
  mapId?: string;
  files?: Record<string, string>;
  sourcePackage?: Record<string, string>;
  variants?: readonly {
    arrangement?: string;
    time?: string;
    weather?: string;
    id?: string;
  }[];
  resources?: readonly {
    resourceType?: string;
    resourceFile?: string;
    xFile?: number;
  }[];
  counts?: {
    resourceCount?: number;
    variantCount?: number;
    textureAliases?: number;
    uniqueTextures?: number;
    meshDefinitions?: number;
    meshUses?: number;
  };
}

export interface PackageHealthCheck {
  id: string;
  label: string;
  status: PackageHealthCheckStatus;
  detail: string;
}

export interface PackageHealth {
  status: PackageHealthStatus;
  checks: readonly PackageHealthCheck[];
}

export interface SourceProvenance {
  format: SourceFormat;
  sourcePath?: string;
  mapId?: string;
  sourceOffsets?: Record<string, number>;
  rawByteRefs?: Record<string, string>;
}

export interface LoadedMapPackage {
  document: MeshDocument;
  provenance: SourceProvenance;
  rawMeshJson?: unknown;
  metadata?: ConsolidatedMapPackageMetadata;
  compatibilityIssues: readonly CompatibilityIssue[];
  packageHealth: PackageHealth;
  renderResources?: RenderResourceBundle;
}
