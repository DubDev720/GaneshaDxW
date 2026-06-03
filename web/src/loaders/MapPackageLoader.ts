import type { LoadedMapPackage } from "../domain/sourceFormat";
import type { MeshDocument } from "../domain/mapDocument";

export interface MapPackageLoader {
  loadConsolidatedMapPackage(baseUrl: string): Promise<LoadedMapPackage>;
  loadOriginalGaneshaPackage(file: File): Promise<LoadedMapPackage>;
}

export class BrowserMapPackageLoader implements MapPackageLoader {
  async loadConsolidatedMapPackage(baseUrl: string): Promise<LoadedMapPackage> {
    const mesh = await this.fetchJson<MeshDocument>(`${baseUrl}/mesh.json`);

    return {
      document: mesh,
      provenance: {
        format: "gmapx-consolidated",
        sourcePath: baseUrl,
        mapId: mesh.id,
      },
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
}
