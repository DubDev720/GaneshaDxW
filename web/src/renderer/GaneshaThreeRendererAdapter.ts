import * as THREE from "three";
import type { MeshDocument, MeshDocumentStore, Vec3 } from "../domain/mapDocument";
import { InMemoryMeshDocumentStore } from "../domain/mapDocument";
import { GeometryBuilder } from "./geometryBuilder";
import { MaterialResolver } from "./materialResolver";
import type {
  GaneshaRendererAdapter,
  RenderablePolygonMesh,
  RendererAdapterStatus,
  RendererPickResult,
} from "./types";

type ThreeRenderer = THREE.WebGLRenderer | {
  domElement: HTMLCanvasElement;
  setPixelRatio(pixelRatio: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
};

export class GaneshaThreeRendererAdapter implements GaneshaRendererAdapter {
  readonly status: RendererAdapterStatus;
  readonly domElement: HTMLCanvasElement;

  private store: MeshDocumentStore | null = null;
  private animationFrameId = 0;
  private selectedPolygonId: string | null = null;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
  private readonly raycaster = new THREE.Raycaster();
  private readonly root = new THREE.Group();
  private readonly polygonMeshes = new Map<string, RenderablePolygonMesh>();
  private readonly geometryBuilder = new GeometryBuilder();
  private readonly materialResolver = new MaterialResolver();
  private readonly renderer: ThreeRenderer;
  private selectionObject: THREE.Object3D | null = null;
  private readonly basePixelsPerWorldUnit = 180;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private zoomLevel = 1;

  constructor(renderer: ThreeRenderer, status: RendererAdapterStatus) {
    this.renderer = renderer;
    this.status = status;
    this.domElement = renderer.domElement;
    this.scene.background = new THREE.Color(0x111418);
    this.camera.position.set(0, 4.8, 5.5);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.root);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2.8, 5, 3.5);
    this.scene.add(keyLight);
  }

  get zoom(): number {
    return this.zoomLevel;
  }

  loadDocument(document: MeshDocument): void {
    this.store = new InMemoryMeshDocumentStore(document);
    this.rebuildScene();
  }

  selectPolygon(polygonId: string | null): void {
    this.selectedPolygonId = polygonId;
    this.syncSelectionOverlay();
  }

  updateVertexPosition(vertexId: string, position: Vec3): void {
    if (!this.store) {
      return;
    }

    this.store = this.store.updateVertexPosition(vertexId, position);
    this.rebuildAffectedPolygonMeshes(vertexId);
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
    const intersections = this.raycaster.intersectObjects([...this.polygonMeshes.values()], false);
    const firstHit = intersections[0]?.object;
    if (!firstHit || !(firstHit instanceof THREE.Mesh)) {
      return null;
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

  resize(width: number, height: number): void {
    this.viewportWidth = Math.max(width, 1);
    this.viewportHeight = Math.max(height, 1);
    this.updateCameraProjection();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
  }

  setZoom(zoom: number): void {
    this.zoomLevel = THREE.MathUtils.clamp(zoom, 0.35, 6);
    this.updateCameraProjection();
  }

  adjustZoom(delta: number): number {
    this.setZoom(this.zoomLevel + delta);
    return this.zoomLevel;
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
      this.root.add(mesh);
      this.polygonMeshes.set(built.polygon.id, mesh);
    }

    this.syncSelectionOverlay();
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
        built.geometry.dispose();
        continue;
      }

      const existing = this.polygonMeshes.get(built.polygon.id);
      if (!existing) {
        built.geometry.dispose();
        continue;
      }

      existing.geometry.dispose();
      existing.geometry = built.geometry;
    }
  }

  private syncSelectionOverlay(): void {
    if (this.selectionObject) {
      this.root.remove(this.selectionObject);
      if (this.selectionObject instanceof THREE.LineSegments) {
        this.selectionObject.geometry.dispose();
      }
      this.selectionObject = null;
    }

    if (!this.selectedPolygonId) {
      return;
    }

    const selectedMesh = this.polygonMeshes.get(this.selectedPolygonId);
    if (!selectedMesh) {
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
    this.polygonMeshes.clear();
    for (const child of [...this.root.children]) {
      this.root.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
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
    const maxDistancePx = 18;
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

  private projectWorldPoint(position: Vec3): THREE.Vector3 {
    const point = new THREE.Vector3(position[0], position[1], position[2]);
    this.root.localToWorld(point);
    return point.project(this.camera);
  }
}
