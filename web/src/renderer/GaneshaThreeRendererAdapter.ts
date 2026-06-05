import * as THREE from "three";
import type { MapPolygon, MeshDocument, MeshDocumentStore, Vec3 } from "../domain/mapDocument";
import type { RenderResourceBundle } from "../domain/renderResources";
import { InMemoryMeshDocumentStore } from "../domain/mapDocument";
import { editorTuning } from "../config/editorTuning";
import { GeometryBuilder } from "./geometryBuilder";
import { MaterialResolver } from "./materialResolver";
import type {
  CameraViewMode,
  GaneshaCameraDirection,
  GaneshaCameraElevation,
  GaneshaRendererAdapter,
  RenderablePolygonMesh,
  RendererDisplayOptions,
  RendererAdapterStatus,
  RendererPickResult,
  TextureResourceStatus,
} from "./types";

type ThreeRenderer = THREE.WebGLRenderer | {
  domElement: HTMLCanvasElement;
  setPixelRatio(pixelRatio: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
};

const ganeshaCameraDirections: Record<GaneshaCameraDirection, number> = {
  northwest: 225,
  northeast: 315,
  southwest: 135,
  southeast: 45,
};

const ganeshaCameraElevations: Record<GaneshaCameraElevation, number> = {
  bottom: 26.54,
  top: 39.37,
};

const directionLabels: Record<GaneshaCameraDirection, string> = {
  northwest: "NW",
  northeast: "NE",
  southwest: "SW",
  southeast: "SE",
};

export class GaneshaThreeRendererAdapter implements GaneshaRendererAdapter {
  readonly status: RendererAdapterStatus;
  readonly domElement: HTMLCanvasElement;

  private store: MeshDocumentStore | null = null;
  private animationFrameId = 0;
  private selectedPolygonId: string | null = null;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 1, 5000);
  private readonly raycaster = new THREE.Raycaster();
  private readonly dragPlane = new THREE.Plane();
  private readonly root = new THREE.Group();
  private readonly polygonMeshes = new Map<string, RenderablePolygonMesh>();
  private readonly vertexHandleMeshes = new Map<string, THREE.Mesh>();
  private readonly polygonLabelSprites = new Map<string, THREE.Sprite>();
  private readonly geometryBuilder = new GeometryBuilder();
  private readonly materialResolver = new MaterialResolver();
  private readonly renderer: ThreeRenderer;
  private selectionObject: THREE.Object3D | null = null;
  private selectedVertexId: string | null = null;
  private readonly cameraTarget = new THREE.Vector3(0, 0, 0);
  private readonly basePixelsPerWorldUnit: number = editorTuning.camera.basePixelsPerWorldUnit;
  private readonly cameraDistance: number = editorTuning.camera.cameraDistance;
  private readonly minElevationDegrees: number = editorTuning.camera.minElevationDegrees;
  private readonly maxElevationDegrees: number = editorTuning.camera.maxElevationDegrees;
  private readonly minZoomLevel: number = editorTuning.camera.minZoom;
  private readonly maxZoomLevel: number = editorTuning.camera.maxZoom;
  private readonly minCameraClearance: number = editorTuning.camera.minCameraClearance;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private zoomLevel: number = editorTuning.camera.defaultZoom;
  private viewMode: CameraViewMode = "isometric";
  private displayOptions: RendererDisplayOptions = {
    mode: "textured",
    showTexturedPolygons: true,
    showUntexturedPolygons: false,
    showVertexHandles: true,
    showPolygonLabels: false,
  };
  private yawDegrees = ganeshaCameraDirections.northwest;
  private elevationDegrees = ganeshaCameraElevations.bottom;
  private lowestVertexY = 0;
  private panBounds = {
    minX: -24,
    maxX: 24,
    minZ: -24,
    maxZ: 24,
  };
  private readonly vertexHandleGeometry = new THREE.SphereGeometry(
    editorTuning.picking.vertexHandleRadius,
    12,
    8,
  );
  private readonly vertexHandleMaterial = new THREE.MeshBasicMaterial({
    color: 0xdcecff,
    depthTest: false,
  });
  private readonly selectedVertexHandleMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff176,
    depthTest: false,
  });

  constructor(renderer: ThreeRenderer, status: RendererAdapterStatus) {
    this.renderer = renderer;
    this.status = status;
    this.domElement = renderer.domElement;
    this.scene.background = new THREE.Color(0x111418);
    this.updateCameraTransform();
    this.scene.add(this.root);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2.8, 5, 3.5);
    this.scene.add(keyLight);
  }

  get zoom(): number {
    return this.zoomLevel;
  }

  get cameraViewMode(): CameraViewMode {
    return this.viewMode;
  }

  get cameraPresetLabel(): string {
    const direction = this.nearestGaneshaDirection();
    const elevation = this.nearestGaneshaElevation();
    const directionLabel = direction ? directionLabels[direction] : `${Math.round(this.yawDegrees)} deg`;
    const elevationLabel = elevation ?? `${this.elevationDegrees.toFixed(1)} deg`;
    return `${this.viewMode} / ${directionLabel} ${elevationLabel} / ${this.zoomLevel.toFixed(2)}x`;
  }

  get textureResourceStatus(): TextureResourceStatus {
    return this.materialResolver.getTextureResourceStatus();
  }

  setDisplayOptions(options: RendererDisplayOptions): void {
    this.displayOptions = options;
    this.materialResolver.setDisplayMode(options.mode);
    this.rebuildScene();
  }

  setRenderResources(resources: RenderResourceBundle | undefined): void {
    this.materialResolver.setRenderResources(resources);
    this.rebuildScene();
  }

  loadDocument(document: MeshDocument): void {
    this.store = new InMemoryMeshDocumentStore(document);
    this.updateCameraBounds(document);
    this.rebuildScene();
  }

  updatePolygonDocument(document: MeshDocument, polygonId: string): void {
    this.store = new InMemoryMeshDocumentStore(document);
    const polygon = this.findPolygon(document, polygonId);
    const existing = this.polygonMeshes.get(polygonId);
    if (!polygon || !existing) {
      this.loadDocument(document);
      return;
    }

    const built = this.geometryBuilder.buildPolygonGeometry(document, polygon);
    this.disposeGeometry(existing.geometry);
    existing.geometry = built.geometry;
    existing.material = this.materialResolver.resolvePolygonMaterial(polygon);
    existing.visible = this.isPolygonVisible(polygon);
    existing.userData = {
      polygonId: polygon.id,
      vertexIds: polygon.vertexIds,
    };
    this.syncSelectionOverlay();
  }

  selectPolygon(polygonId: string | null): void {
    this.selectedPolygonId = polygonId;
    this.syncSelectionOverlay();
  }

  selectVertex(vertexId: string | null): void {
    this.selectedVertexId = vertexId;
    this.syncVertexHandleMaterials();
  }

  updateVertexPosition(vertexId: string, position: Vec3): void {
    if (!this.store) {
      return;
    }

    this.store = this.store.updateVertexPosition(vertexId, position);
    this.rebuildAffectedPolygonMeshes(vertexId);
    this.syncVertexHandles();
    this.syncSelectionOverlay();
  }

  pick(clientX: number, clientY: number): RendererPickResult | null {
    const document = this.store?.document;
    if (!document) {
      return null;
    }

    const rect = this.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1),
    );

    this.raycaster.setFromCamera(pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(
      [...this.polygonMeshes.values()].filter((mesh) => mesh.visible),
      false,
    );
    const firstHit = intersections[0]?.object;
    if (!firstHit || !(firstHit instanceof THREE.Mesh)) {
      return this.pickNearestVisibleVertex(document, clientX, clientY, rect);
    }

    const polygonMesh = firstHit as RenderablePolygonMesh;
    return {
      polygonId: polygonMesh.userData.polygonId,
      vertexId: this.pickNearestVertex(
        polygonMesh.userData.vertexIds,
        document,
        clientX,
        clientY,
        rect,
      ),
    };
  }

  screenPointToWorldOnPlane(clientX: number, clientY: number, planeY: number): Vec3 | null {
    const rect = this.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1),
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    this.dragPlane.set(new THREE.Vector3(0, 1, 0), -planeY);
    const intersection = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.dragPlane, intersection);
    return hit ? [intersection.x, planeY, intersection.z] : null;
  }

  resize(width: number, height: number): void {
    this.viewportWidth = Math.max(width, 1);
    this.viewportHeight = Math.max(height, 1);
    this.updateCameraProjection();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
  }

  setZoom(zoom: number): void {
    this.zoomLevel = THREE.MathUtils.clamp(zoom, this.minZoomLevel, this.maxZoomLevel);
    this.updateCameraProjection();
  }

  adjustZoom(delta: number): number {
    this.setZoom(this.zoomLevel + delta);
    return this.zoomLevel;
  }

  setCameraViewMode(mode: CameraViewMode): void {
    this.viewMode = mode;
    this.updateCameraProjection();
  }

  setGaneshaCameraPreset(
    direction: GaneshaCameraDirection,
    elevation: GaneshaCameraElevation,
  ): void {
    this.viewMode = "isometric";
    this.yawDegrees = ganeshaCameraDirections[direction];
    this.elevationDegrees = ganeshaCameraElevations[elevation];
    this.updateCameraTransform();
  }

  panCamera(delta: Vec3): void {
    this.cameraTarget.add(new THREE.Vector3(delta[0], delta[1], delta[2]));
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  panCameraInViewDirection(deltaRight: number, deltaUp: number): void {
    const right = this.getCameraRightOnGround();
    const up = this.getCameraUpOnGround();
    const pan = right
      .multiplyScalar(deltaRight)
      .add(up.multiplyScalar(deltaUp));
    this.cameraTarget.add(pan);
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  panCameraByScreenDelta(deltaX: number, deltaY: number): void {
    const worldPerPixel = 1 / (this.basePixelsPerWorldUnit * this.zoomLevel);
    this.camera.updateMatrixWorld(true);

    const right = this.getCameraRightOnGround();
    const up = this.getCameraUpOnGround();
    const pan = right
      .multiplyScalar(-deltaX * worldPerPixel)
      .add(up.multiplyScalar(deltaY * worldPerPixel));
    this.cameraTarget.add(pan);
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  orbitCamera(deltaYawDegrees: number, deltaElevationDegrees: number): void {
    this.yawDegrees = this.wrapDegrees(this.yawDegrees + deltaYawDegrees);
    this.elevationDegrees = THREE.MathUtils.clamp(
      this.elevationDegrees + deltaElevationDegrees,
      this.minElevationDegrees,
      this.maxElevationDegrees,
    );
    this.updateCameraTransform();
  }

  focusCameraOnPoint(point: Vec3): void {
    this.cameraTarget.set(point[0], point[1], point[2]);
    this.clampCameraTarget();
    this.updateCameraTransform();
  }

  resetCamera(): void {
    this.cameraTarget.set(
      (this.panBounds.minX + this.panBounds.maxX) / 2,
      Math.max(this.lowestVertexY + this.minCameraClearance, 0),
      (this.panBounds.minZ + this.panBounds.maxZ) / 2,
    );
    this.yawDegrees = ganeshaCameraDirections.northwest;
    this.elevationDegrees = ganeshaCameraElevations.bottom;
    this.zoomLevel = editorTuning.camera.defaultZoom;
    this.updateCameraProjection();
    this.updateCameraTransform();
  }

  start(): void {
    if (this.animationFrameId !== 0) {
      return;
    }

    const render = () => {
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = window.requestAnimationFrame(render);
    };

    render();
  }

  stop(): void {
    if (this.animationFrameId !== 0) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  dispose(): void {
    this.stop();
    this.clearRoot();
    this.materialResolver.dispose();
    this.disposeGeometry(this.vertexHandleGeometry);
    this.vertexHandleMaterial.dispose();
    this.selectedVertexHandleMaterial.dispose();
    this.renderer.dispose();
  }

  private rebuildScene(): void {
    this.clearRoot();
    const document = this.store?.document;
    if (!document) {
      return;
    }

    for (const built of this.geometryBuilder.buildPolygonGeometries(document)) {
      const mesh = new THREE.Mesh(
        built.geometry,
        this.materialResolver.resolvePolygonMaterial(built.polygon),
      ) as RenderablePolygonMesh;
      mesh.userData = {
        polygonId: built.polygon.id,
        vertexIds: built.polygon.vertexIds,
      };
      mesh.visible = this.isPolygonVisible(built.polygon);
      this.root.add(mesh);
      this.polygonMeshes.set(built.polygon.id, mesh);
    }

    this.syncVertexHandles();
    this.syncPolygonLabels(document);
    this.syncSelectionOverlay();
  }

  private updateCameraTransform(): void {
    this.clampCameraTarget();

    const yaw = THREE.MathUtils.degToRad(this.yawDegrees);
    const elevation = THREE.MathUtils.degToRad(this.elevationDegrees);
    const horizontalDistance = Math.cos(elevation) * this.cameraDistance;
    this.camera.up.set(0, 1, 0);
    this.camera.position.set(
      this.cameraTarget.x + Math.cos(yaw) * horizontalDistance,
      Math.max(
        this.cameraTarget.y + Math.sin(elevation) * this.cameraDistance,
        this.lowestVertexY + this.minCameraClearance,
      ),
      this.cameraTarget.z + Math.sin(yaw) * horizontalDistance,
    );

    this.camera.lookAt(this.cameraTarget);
    this.camera.updateMatrixWorld(true);
  }

  private updateCameraProjection(): void {
    const aspect = this.viewportWidth / this.viewportHeight;
    const frustumHeight = this.viewportHeight / (this.basePixelsPerWorldUnit * this.zoomLevel);
    this.camera.left = (-frustumHeight * aspect) / 2;
    this.camera.right = (frustumHeight * aspect) / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  private updateCameraBounds(document: MeshDocument): void {
    if (document.vertices.length === 0) {
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const vertex of document.vertices) {
      const [x, y, z] = vertex.ganeshaDxPosition;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }

    const extent = Math.max(maxX - minX, maxZ - minZ, 1);
    const margin = Math.max(
      editorTuning.camera.panBoundsMinimumMargin,
      extent * editorTuning.camera.panBoundsMarginScale,
    );
    this.lowestVertexY = minY;
    this.panBounds = {
      minX: minX - margin,
      maxX: maxX + margin,
      minZ: minZ - margin,
      maxZ: maxZ + margin,
    };
    this.clampCameraTarget();
  }

  private clampCameraTarget(): void {
    this.cameraTarget.x = THREE.MathUtils.clamp(
      this.cameraTarget.x,
      this.panBounds.minX,
      this.panBounds.maxX,
    );
    this.cameraTarget.z = THREE.MathUtils.clamp(
      this.cameraTarget.z,
      this.panBounds.minZ,
      this.panBounds.maxZ,
    );
    this.cameraTarget.y = Math.max(this.cameraTarget.y, this.lowestVertexY);
  }

  private wrapDegrees(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
  }

  private nearestGaneshaDirection(): GaneshaCameraDirection | null {
    for (const [direction, degrees] of Object.entries(ganeshaCameraDirections)) {
      const delta = Math.abs(this.shortestAngleDelta(this.yawDegrees, degrees));
      if (delta <= editorTuning.camera.presetSnapToleranceDegrees) {
        return direction as GaneshaCameraDirection;
      }
    }

    return null;
  }

  private nearestGaneshaElevation(): GaneshaCameraElevation | null {
    for (const [elevation, degrees] of Object.entries(ganeshaCameraElevations)) {
      if (Math.abs(this.elevationDegrees - degrees) <= editorTuning.camera.presetSnapToleranceDegrees) {
        return elevation as GaneshaCameraElevation;
      }
    }

    return null;
  }

  private shortestAngleDelta(a: number, b: number): number {
    return ((a - b + 540) % 360) - 180;
  }

  private getCameraRightOnGround(): THREE.Vector3 {
    this.camera.updateMatrixWorld(true);
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    right.y = 0;
    return right.lengthSq() > 0.000001 ? right.normalize() : new THREE.Vector3(1, 0, 0);
  }

  private getCameraUpOnGround(): THREE.Vector3 {
    this.camera.updateMatrixWorld(true);
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
    up.y = 0;
    if (up.lengthSq() > 0.000001) {
      return up.normalize();
    }

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    return forward.lengthSq() > 0.000001
      ? forward.normalize()
      : new THREE.Vector3(0, 0, -1);
  }

  private rebuildAffectedPolygonMeshes(vertexId: string): void {
    const document = this.store?.document;
    if (!document) {
      return;
    }

    const affectedPolygonIds = new Set<string>();
    for (const section of document.sections) {
      for (const polygon of section.polygons) {
        if (polygon.vertexIds.includes(vertexId)) {
          affectedPolygonIds.add(polygon.id);
        }
      }
    }

    const rebuilt = this.geometryBuilder.buildPolygonGeometries(document);
    for (const built of rebuilt) {
      if (!affectedPolygonIds.has(built.polygon.id)) {
        this.disposeGeometry(built.geometry);
        continue;
      }

      const existing = this.polygonMeshes.get(built.polygon.id);
      if (!existing) {
        this.disposeGeometry(built.geometry);
        continue;
      }

      this.disposeGeometry(existing.geometry);
      existing.geometry = built.geometry;
    }
  }

  private syncVertexHandles(): void {
    for (const mesh of this.vertexHandleMeshes.values()) {
      this.root.remove(mesh);
    }
    this.vertexHandleMeshes.clear();

    const document = this.store?.document;
    if (!document) {
      return;
    }

    for (const vertex of document.vertices) {
      const handle = new THREE.Mesh(
        this.vertexHandleGeometry,
        this.isSelectedVertexHandle(vertex.id)
          ? this.selectedVertexHandleMaterial
          : this.vertexHandleMaterial,
      );
      handle.position.set(
        vertex.ganeshaDxPosition[0],
        vertex.ganeshaDxPosition[1] + editorTuning.picking.vertexHandleYOffset,
        vertex.ganeshaDxPosition[2],
      );
      handle.renderOrder = 20;
      handle.visible = this.displayOptions.showVertexHandles;
      handle.userData = {
        vertexId: vertex.id,
      };
      this.root.add(handle);
      this.vertexHandleMeshes.set(vertex.id, handle);
    }
  }

  private syncVertexHandleMaterials(): void {
    for (const [vertexId, mesh] of this.vertexHandleMeshes) {
      mesh.material = this.isSelectedVertexHandle(vertexId)
        ? this.selectedVertexHandleMaterial
        : this.vertexHandleMaterial;
    }
  }

  private syncSelectionOverlay(): void {
    if (this.selectionObject) {
      this.root.remove(this.selectionObject);
      if (this.selectionObject instanceof THREE.LineSegments) {
        this.disposeGeometry(this.selectionObject.geometry);
      }
      this.selectionObject = null;
    }

    if (!this.selectedPolygonId) {
      return;
    }

    const selectedMesh = this.polygonMeshes.get(this.selectedPolygonId);
    if (!selectedMesh || !selectedMesh.visible) {
      return;
    }

    this.selectionObject = new THREE.LineSegments(
      new THREE.EdgesGeometry(selectedMesh.geometry),
      this.materialResolver.resolveSelectionMaterial(),
    );
    this.selectionObject.position.y += 0.025;
    this.selectionObject.renderOrder = 10;
    this.root.add(this.selectionObject);
  }

  private clearRoot(): void {
    this.selectionObject = null;
    const vertexHandles = new Set(this.vertexHandleMeshes.values());
    const labelSprites = new Set(this.polygonLabelSprites.values());
    this.polygonMeshes.clear();
    this.vertexHandleMeshes.clear();
    this.polygonLabelSprites.clear();
    for (const child of [...this.root.children]) {
      this.root.remove(child);
      if (child instanceof THREE.Mesh && !vertexHandles.has(child)) {
        this.disposeGeometry(child.geometry);
      }
      if (child instanceof THREE.LineSegments) {
        this.disposeGeometry(child.geometry);
      }
      if (child instanceof THREE.Sprite && labelSprites.has(child)) {
        this.disposeLabelSprite(child);
      }
    }
  }

  private pickNearestVertex(
    vertexIds: readonly string[],
    document: MeshDocument,
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ): string | null {
    const maxDistancePx = editorTuning.picking.cornerSelectionRadiusPx;
    let nearest: { vertexId: string; distance: number } | null = null;

    this.root.updateMatrixWorld(true);
    for (const vertexId of vertexIds) {
      const vertex = document.vertices.find((candidate) => candidate.id === vertexId);
      if (!vertex) {
        continue;
      }

      const projected = this.projectWorldPoint(vertex.ganeshaDxPosition);
      const screenX = rect.left + ((projected.x + 1) / 2) * rect.width;
      const screenY = rect.top + ((1 - projected.y) / 2) * rect.height;
      const distance = Math.hypot(clientX - screenX, clientY - screenY);
      if (distance <= maxDistancePx && (!nearest || distance < nearest.distance)) {
        nearest = { vertexId, distance };
      }
    }

    return nearest?.vertexId ?? null;
  }

  private pickNearestVisibleVertex(
    document: MeshDocument,
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ): RendererPickResult | null {
    const nearestVertexId = this.pickNearestVertex(
      document.vertices.map((vertex) => vertex.id),
      document,
      clientX,
      clientY,
      rect,
    );
    const polygonId = nearestVertexId ? this.findPolygonIdForVertex(document, nearestVertexId) : null;
    return nearestVertexId && polygonId
      ? {
          polygonId,
          vertexId: nearestVertexId,
        }
      : null;
  }

  private projectWorldPoint(position: Vec3): THREE.Vector3 {
    const point = new THREE.Vector3(position[0], position[1], position[2]);
    this.root.localToWorld(point);
    return point.project(this.camera);
  }

  private findPolygonIdForVertex(document: MeshDocument, vertexId: string): string | null {
    if (this.selectedPolygonId) {
      const selectedPolygon = [...this.polygonMeshes.values()]
        .find((mesh) => mesh.userData.polygonId === this.selectedPolygonId);
      if (selectedPolygon?.userData.vertexIds.includes(vertexId)) {
        return this.selectedPolygonId;
      }
    }

    for (const section of document.sections) {
      for (const polygon of section.polygons) {
        if (polygon.vertexIds.includes(vertexId)) {
          return polygon.id;
        }
      }
    }

    return null;
  }

  private findPolygon(document: MeshDocument, polygonId: string): MapPolygon | null {
    for (const section of document.sections) {
      const polygon = section.polygons.find((candidate) => candidate.id === polygonId);
      if (polygon) {
        return polygon;
      }
    }

    return null;
  }

  private isSelectedVertexHandle(vertexId: string): boolean {
    if (this.selectedVertexId) {
      return vertexId === this.selectedVertexId;
    }

    if (!this.selectedPolygonId) {
      return false;
    }

    const selectedPolygon = this.polygonMeshes.get(this.selectedPolygonId);
    return selectedPolygon?.userData.vertexIds.includes(vertexId) ?? false;
  }

  private isPolygonVisible(polygon: MapPolygon): boolean {
    return polygon.isTextured
      ? this.displayOptions.showTexturedPolygons
      : this.displayOptions.showUntexturedPolygons;
  }

  private syncPolygonLabels(document: MeshDocument): void {
    if (!this.displayOptions.showPolygonLabels) {
      return;
    }

    const visiblePolygonCount = document.sections.reduce(
      (sum, section) =>
        sum + section.polygons.filter((polygon) => this.isPolygonVisible(polygon)).length,
      0,
    );
    if (visiblePolygonCount > editorTuning.labels.maxVisibleLabels) {
      return;
    }

    const vertexById = new Map(
      document.vertices.map((vertex) => [vertex.id, vertex.ganeshaDxPosition]),
    );

    for (const section of document.sections) {
      for (const polygon of section.polygons) {
        if (!this.isPolygonVisible(polygon)) {
          continue;
        }

        const positions = polygon.vertexIds
          .map((vertexId) => vertexById.get(vertexId))
          .filter((position) => position !== undefined);
        if (positions.length === 0) {
          continue;
        }

        const center = positions.reduce(
          (sum, position) => {
            sum.x += position[0];
            sum.y += position[1];
            sum.z += position[2];
            return sum;
          },
          new THREE.Vector3(),
        ).multiplyScalar(1 / positions.length);
        center.y += editorTuning.labels.polygonLabelYOffset;

        const sprite = this.createLabelSprite(polygon.id);
        sprite.position.copy(center);
        sprite.renderOrder = 30;
        this.root.add(sprite);
        this.polygonLabelSprites.set(polygon.id, sprite);
      }
    }
  }

  private createLabelSprite(label: string): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = editorTuning.labels.polygonLabelWidth;
    canvas.height = editorTuning.labels.polygonLabelHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create label canvas context");
    }

    context.fillStyle = "rgba(9, 13, 18, 0.82)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(132, 197, 255, 0.72)";
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    context.fillStyle = "#f7fbff";
    context.font = "700 30px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(
      editorTuning.labels.polygonLabelScaleX,
      editorTuning.labels.polygonLabelScaleY,
      1,
    );
    return sprite;
  }

  private disposeLabelSprite(sprite: THREE.Sprite): void {
    const material = sprite.material;
    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
  }

  private disposeGeometry(geometry: THREE.BufferGeometry): void {
    try {
      geometry.dispose();
    } catch (error) {
      console.warn("Failed to dispose geometry after renderer backend state changed", error);
    }
  }
}
