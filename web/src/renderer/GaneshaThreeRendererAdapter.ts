import * as THREE from "three";
import type { MeshDocument, MeshDocumentStore, Vec3 } from "../domain/mapDocument";
import { InMemoryMeshDocumentStore } from "../domain/mapDocument";
import { GeometryBuilder } from "./geometryBuilder";
import { MaterialResolver } from "./materialResolver";
import type {
  GaneshaRendererAdapter,
  RenderablePolygonMesh,
  RendererAdapterStatus,
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
  private readonly root = new THREE.Group();
  private readonly polygonMeshes = new Map<string, RenderablePolygonMesh>();
  private readonly geometryBuilder = new GeometryBuilder();
  private readonly materialResolver = new MaterialResolver();
  private readonly renderer: ThreeRenderer;
  private selectionMesh: THREE.Mesh | null = null;

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

  resize(width: number, height: number): void {
    const aspect = width / Math.max(height, 1);
    const frustumHeight = 6;
    this.camera.left = (-frustumHeight * aspect) / 2;
    this.camera.right = (frustumHeight * aspect) / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
  }

  start(): void {
    if (this.animationFrameId !== 0) {
      return;
    }

    const render = () => {
      this.root.rotation.y = Math.sin(performance.now() * 0.00025) * 0.12;
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
    if (this.selectionMesh) {
      this.root.remove(this.selectionMesh);
      this.selectionMesh.geometry.dispose();
      this.selectionMesh = null;
    }

    if (!this.selectedPolygonId) {
      return;
    }

    const selectedMesh = this.polygonMeshes.get(this.selectedPolygonId);
    if (!selectedMesh) {
      return;
    }

    this.selectionMesh = new THREE.Mesh(
      selectedMesh.geometry.clone(),
      this.materialResolver.resolveSelectionMaterial(),
    );
    this.selectionMesh.position.y += 0.025;
    this.root.add(this.selectionMesh);
  }

  private clearRoot(): void {
    this.selectionMesh = null;
    this.polygonMeshes.clear();
    for (const child of [...this.root.children]) {
      this.root.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }
  }
}
