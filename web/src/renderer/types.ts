import type * as THREE from "three";
import type { MeshDocument, Vec3 } from "../domain/mapDocument";

export type RendererBackend = "webgpu" | "webgl2";

export interface RendererAdapterStatus {
  backend: RendererBackend;
  reason: string;
}

export interface RendererPickResult {
  polygonId: string;
  vertexId: string | null;
}

export interface GaneshaRendererAdapter {
  readonly status: RendererAdapterStatus;
  readonly domElement: HTMLCanvasElement;
  readonly zoom: number;
  loadDocument(document: MeshDocument): void;
  selectPolygon(polygonId: string | null): void;
  updateVertexPosition(vertexId: string, position: Vec3): void;
  pick(clientX: number, clientY: number): RendererPickResult | null;
  resize(width: number, height: number): void;
  setZoom(zoom: number): void;
  adjustZoom(delta: number): number;
  start(): void;
  stop(): void;
  dispose(): void;
}

export interface RenderablePolygonMesh extends THREE.Mesh {
  userData: {
    polygonId: string;
    vertexIds: readonly string[];
  };
}
