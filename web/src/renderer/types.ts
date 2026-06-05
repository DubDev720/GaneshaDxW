import type * as THREE from "three";
import type { MeshDocument, Vec3 } from "../domain/mapDocument";
import type { RenderResourceBundle } from "../domain/renderResources";

export type RendererBackend = "webgpu" | "webgl2";
export type CameraViewMode = "isometric" | "orthogonal";
export type GaneshaCameraDirection = "northwest" | "northeast" | "southwest" | "southeast";
export type GaneshaCameraElevation = "top" | "bottom";
export type RendererDisplayMode = "textured" | "uv-debug" | "solid" | "wireframe";

export interface RendererDisplayOptions {
  readonly mode: RendererDisplayMode;
  readonly showTexturedPolygons: boolean;
  readonly showUntexturedPolygons: boolean;
  readonly showVertexHandles: boolean;
  readonly showPolygonLabels: boolean;
}

export interface TextureResourceStatus {
  readonly paletteCount: number;
  readonly textureCount: number;
  readonly mappingCount: number;
  readonly usingFallbackTexture: boolean;
}

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
  readonly cameraViewMode: CameraViewMode;
  readonly cameraPresetLabel: string;
  readonly textureResourceStatus: TextureResourceStatus;
  setDisplayOptions(options: RendererDisplayOptions): void;
  setRenderResources(resources: RenderResourceBundle | undefined): void;
  loadDocument(document: MeshDocument): void;
  updatePolygonDocument(document: MeshDocument, polygonId: string): void;
  selectPolygon(polygonId: string | null): void;
  selectVertex(vertexId: string | null): void;
  updateVertexPosition(vertexId: string, position: Vec3): void;
  pick(clientX: number, clientY: number): RendererPickResult | null;
  screenPointToWorldOnPlane(clientX: number, clientY: number, planeY: number): Vec3 | null;
  resize(width: number, height: number): void;
  setZoom(zoom: number): void;
  adjustZoom(delta: number): number;
  setCameraViewMode(mode: CameraViewMode): void;
  setGaneshaCameraPreset(
    direction: GaneshaCameraDirection,
    elevation: GaneshaCameraElevation,
  ): void;
  panCamera(delta: Vec3): void;
  panCameraInViewDirection(deltaRight: number, deltaUp: number): void;
  panCameraByScreenDelta(deltaX: number, deltaY: number): void;
  orbitCamera(deltaYawDegrees: number, deltaElevationDegrees: number): void;
  focusCameraOnPoint(point: Vec3): void;
  resetCamera(): void;
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
