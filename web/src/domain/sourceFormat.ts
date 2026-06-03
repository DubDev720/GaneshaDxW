import type { MeshDocument } from "./mapDocument";

export type SourceFormat = "gmapx-consolidated" | "ganesha-original";

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
}
