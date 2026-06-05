import "./styles.css";
import { sampleMapDocument } from "./domain/sampleMapDocument";
import { editorTuning } from "./config/editorTuning";
import { BrowserMapPackageLoader } from "./loaders/MapPackageLoader";
import { createThreeRenderer } from "./renderer/createThreeRenderer";
import { GaneshaThreeRendererAdapter } from "./renderer/GaneshaThreeRendererAdapter";
import type {
  GaneshaCameraDirection,
  GaneshaCameraElevation,
  RendererDisplayMode,
  RendererDisplayOptions,
} from "./renderer/types";
import {
  getPolygon,
  nudgeVertexPosition,
  updatePolygonInDocument,
  updateVertexPositionInDocument,
  type MeshDocument,
  type MapPolygon,
  type Vec2,
  type Vec3,
} from "./domain/mapDocument";
import { EditCommandHistory } from "./domain/editCommandHistory";
import { SelectionStore } from "./domain/selectionStore";
import { exportConsolidatedMeshJson } from "./domain/consolidatedMeshExport";
import type {
  IndexedTextureJson,
  MeshTextureMappingJsonRecord,
  PaletteJson,
  TextureMappingJsonRecord,
} from "./domain/renderResources";
import type {
  ConsolidatedMapPackageIndexEntry,
  LoadedMapPackage,
  PackageHealthStatus,
} from "./domain/sourceFormat";
import {
  sanitizeMeshDocumentForGaneshaDx,
  validateMeshDocumentForGaneshaDx,
  type CompatibilityIssue,
} from "./domain/compatibility";

const DEFAULT_CONSOLIDATED_PACKAGE_ROOT = "/reports/gmapx-consolidated";
const LOCAL_RUNTIME_CONFIG_URL = "/ganeshadxw.local.json";

interface LocalRuntimeConfig {
  consolidatedPackageRoot?: string;
  maps?: readonly ConsolidatedMapPackageIndexEntry[];
}

type RenderHint =
  | {
      kind: "document";
    }
  | {
      kind: "polygon";
      polygonId: string;
    };

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="app-shell" data-left-collapsed="false" data-right-collapsed="false">
    <aside class="side-panel side-panel-left" data-side-panel="left" aria-label="Map data">
      <nav class="side-tabs" aria-label="Map data tabs">
        <button class="side-collapse-button" data-toggle-panel="left" type="button">
          <span>Hide</span>
        </button>
        <button class="side-tab-button" data-panel-tab="left" data-tab-target="scene" type="button">
          <span>Scene</span>
        </button>
        <button class="side-tab-button" data-panel-tab="left" data-tab-target="vertices" type="button">
          <span>Vertices</span>
        </button>
      </nav>
      <div class="panel-body">
        <section class="panel-page" data-panel-side="left" data-panel-page="scene">
          <div class="panel-heading">
            <h1>GaneshaDXW</h1>
            <p>WebGPU-first editor scaffold with GaneshaDX-compatible mesh editing.</p>
          </div>
          <div class="control-group">
            <h2>Package</h2>
            <label class="field-label" for="map-package-select">Active map</label>
            <select id="map-package-select" class="package-select">
              <option>Loading packages</option>
            </select>
            <p id="package-load-status" class="inline-status">Reading package index.</p>
          </div>
          <div class="control-group">
            <h2>Metadata</h2>
            <dl id="metadata-summary" class="facts compact"></dl>
          </div>
          <div class="control-group">
            <h2>Package Health</h2>
            <div id="package-health-summary" class="health-summary" data-health-status="warning">
              Checking package
            </div>
            <ul id="package-health-list" class="health-list"></ul>
          </div>
          <div class="control-group">
            <h2>Source References</h2>
            <dl id="source-reference-list" class="facts compact"></dl>
          </div>
          <div class="control-group">
            <h2>Scene Tree</h2>
            <div id="scene-tree" class="scene-tree"></div>
          </div>
        </section>

        <section class="panel-page" data-panel-side="left" data-panel-page="vertices" hidden>
          <div class="panel-heading">
            <h1>Polygon Data</h1>
            <p>Selected polygon vertices and source coordinates.</p>
          </div>
          <div class="control-group">
            <h2>Vertices</h2>
            <div id="vertex-list" class="vertex-list"></div>
          </div>
          <dl class="facts">
            <div>
              <dt>Selected vertex</dt>
              <dd id="selected-vertex">none</dd>
            </div>
          </dl>
        </section>
      </div>
    </aside>

    <section class="viewport-panel" aria-label="Map renderer">
      <canvas class="renderer-canvas" aria-label="GaneshaDXW WebGPU renderer"></canvas>
      <div class="game-view-overlay" data-game-view-overlay hidden>
        <div class="game-view-frame"></div>
      </div>
      <div class="status-bar">
        <span class="status-label">Renderer</span>
        <strong id="backend-status">Starting</strong>
        <span class="status-label">Mode</span>
        <strong id="render-mode-status">Textured</strong>
      </div>
    </section>

    <aside class="side-panel side-panel-right" data-side-panel="right" aria-label="Renderer tools">
      <nav class="side-tabs" aria-label="Renderer tool tabs">
        <button class="side-collapse-button" data-toggle-panel="right" type="button">
          <span>Hide</span>
        </button>
        <button class="side-tab-button" data-panel-tab="right" data-tab-target="edit" type="button">
          <span>Edit</span>
        </button>
        <button class="side-tab-button" data-panel-tab="right" data-tab-target="face" type="button">
          <span>Face</span>
        </button>
        <button class="side-tab-button" data-panel-tab="right" data-tab-target="history" type="button">
          <span>History</span>
        </button>
        <button class="side-tab-button" data-panel-tab="right" data-tab-target="status" type="button">
          <span>Status</span>
        </button>
      </nav>
      <div class="panel-body">
        <section class="panel-page" data-panel-side="right" data-panel-page="edit">
          <div class="panel-heading">
            <h1>Tools</h1>
            <p>Temporary mesh editing controls.</p>
          </div>
          <div class="control-group">
            <h2>Viewport</h2>
            <div class="display-mode-row">
              <button class="control-button secondary" data-render-mode="textured" type="button">Textured</button>
              <button class="control-button secondary" data-render-mode="uv-debug" type="button">UV Chart</button>
              <button class="control-button secondary" data-render-mode="solid" type="button">Solid</button>
              <button class="control-button secondary" data-render-mode="wireframe" type="button">Wire</button>
            </div>
            <div class="display-toggle-grid">
              <button class="control-button secondary" data-display-toggle="showTexturedPolygons" type="button">Textured faces</button>
              <button class="control-button secondary" data-display-toggle="showUntexturedPolygons" type="button">Perimeter</button>
              <button class="control-button secondary" data-display-toggle="showVertexHandles" type="button">Handles</button>
              <button class="control-button secondary" data-display-toggle="showPolygonLabels" type="button">Labels</button>
            </div>
          </div>
          <div class="control-group">
            <h2>Camera</h2>
            <div class="button-row">
              <button class="control-button secondary" data-view-mode="isometric" type="button">Iso view</button>
              <button class="control-button secondary" data-view-mode="orthogonal" type="button">Ortho view</button>
            </div>
            <div class="button-row">
              <button class="control-button secondary" data-focus-selection type="button">Focus</button>
              <button class="control-button secondary" data-game-view type="button">Game view</button>
            </div>
            <div class="camera-preset-grid" aria-label="GaneshaDX camera presets">
              <span>Bottom</span>
              <button class="control-button secondary" data-camera-preset="northwest,bottom" type="button">NW</button>
              <button class="control-button secondary" data-camera-preset="northeast,bottom" type="button">NE</button>
              <button class="control-button secondary" data-camera-preset="southwest,bottom" type="button">SW</button>
              <button class="control-button secondary" data-camera-preset="southeast,bottom" type="button">SE</button>
              <span>Top</span>
              <button class="control-button secondary" data-camera-preset="northwest,top" type="button">NW</button>
              <button class="control-button secondary" data-camera-preset="northeast,top" type="button">NE</button>
              <button class="control-button secondary" data-camera-preset="southwest,top" type="button">SW</button>
              <button class="control-button secondary" data-camera-preset="southeast,top" type="button">SE</button>
            </div>
            <div class="orbit-grid" aria-label="Camera orbit">
              <button class="control-button secondary" data-camera-orbit="0,${editorTuning.camera.orbitButtonElevationStep}" type="button">Tilt +</button>
              <button class="control-button secondary" data-camera-orbit="${-editorTuning.camera.orbitButtonYawStep},0" type="button">Yaw -</button>
              <button class="control-button secondary" data-camera-reset type="button">Reset</button>
              <button class="control-button secondary" data-camera-orbit="${editorTuning.camera.orbitButtonYawStep},0" type="button">Yaw +</button>
              <button class="control-button secondary" data-camera-orbit="0,${-editorTuning.camera.orbitButtonElevationStep}" type="button">Tilt -</button>
            </div>
            <div class="subcontrol-label">Viewport pan</div>
            <div class="pan-grid">
              <button class="control-button secondary" data-camera-pan="0,${editorTuning.camera.viewportPanStep}" type="button">Up</button>
              <button class="control-button secondary" data-camera-pan="${-editorTuning.camera.viewportPanStep},0" type="button">Left</button>
              <button class="control-button secondary" data-camera-reset type="button">Reset</button>
              <button class="control-button secondary" data-camera-pan="${editorTuning.camera.viewportPanStep},0" type="button">Right</button>
              <button class="control-button secondary" data-camera-pan="0,${-editorTuning.camera.viewportPanStep}" type="button">Down</button>
            </div>
            <dl class="facts compact">
              <div>
                <dt>View mode</dt>
                <dd id="camera-mode">isometric</dd>
              </div>
            </dl>
          </div>

          <div class="control-group">
            <h2>Translate Vertex</h2>
            <div class="nudge-grid">
              <button class="control-button" data-nudge="${-editorTuning.editing.vertexNudgeStep},0,0">X -</button>
              <button class="control-button" data-nudge="${editorTuning.editing.vertexNudgeStep},0,0">X +</button>
              <button class="control-button" data-nudge="0,${-editorTuning.editing.vertexNudgeStep},0">Y -</button>
              <button class="control-button" data-nudge="0,${editorTuning.editing.vertexNudgeStep},0">Y +</button>
              <button class="control-button" data-nudge="0,0,${-editorTuning.editing.vertexNudgeStep}">Z -</button>
              <button class="control-button" data-nudge="0,0,${editorTuning.editing.vertexNudgeStep}">Z +</button>
            </div>
          </div>
          <div class="control-group">
            <h2>Zoom</h2>
            <div class="button-row">
              <button class="control-button secondary" data-zoom="out" type="button">Zoom -</button>
              <button class="control-button secondary" data-zoom="in" type="button">Zoom +</button>
            </div>
            <div class="zoom-preset-row">
              <button class="control-button secondary" data-zoom-preset="${editorTuning.camera.farZoomPreset}" type="button">Far</button>
              <button class="control-button secondary" data-zoom-preset="${editorTuning.camera.gameZoomPreset}" type="button">Game</button>
              <button class="control-button secondary" data-zoom-preset="${editorTuning.camera.nearZoomPreset}" type="button">Near</button>
            </div>
            <button class="control-button secondary" data-zoom="reset" type="button">Reset zoom</button>
          </div>
        </section>

        <section class="panel-page" data-panel-side="right" data-panel-page="face" hidden>
          <div class="panel-heading">
            <h1>Selected Face</h1>
            <p>Format-safe texture, UV, terrain, visibility, and source fields.</p>
          </div>
          <div id="face-inspector" class="face-inspector"></div>
        </section>

        <section class="panel-page" data-panel-side="right" data-panel-page="history" hidden>
          <div class="panel-heading">
            <h1>History</h1>
            <p>Edit stack and document export controls.</p>
          </div>
          <div class="control-group">
            <h2>Commands</h2>
            <div class="button-row">
              <button class="control-button secondary" data-undo type="button">Undo</button>
              <button class="control-button secondary" data-redo type="button">Redo</button>
            </div>
            <button class="control-button secondary" data-reset-document type="button">Reset document</button>
            <button class="control-button" data-export-document type="button">Save mesh.json</button>
          </div>
        </section>

        <section class="panel-page" data-panel-side="right" data-panel-page="status" hidden>
          <div class="panel-heading">
            <h1>Status</h1>
            <p>Loader provenance and original GaneshaDX compatibility checks.</p>
          </div>
          <div class="compatibility-panel">
            <h2>Compatibility</h2>
            <p id="compatibility-status">Checking GaneshaDX limits</p>
          </div>
          <dl class="facts">
            <div>
              <dt>Input path</dt>
              <dd id="input-path">loading</dd>
            </div>
            <div>
              <dt>Renderer boundary</dt>
              <dd>adapter consumes document state</dd>
            </div>
            <div>
              <dt>Viewport pick</dt>
              <dd id="viewport-pick">none</dd>
            </div>
            <div>
              <dt>Texture resources</dt>
              <dd id="texture-resource-status">checking</dd>
            </div>
          </dl>
        </section>
      </div>
    </aside>
  </main>
`;

const appShell = queryElement<HTMLElement>(".app-shell");
const canvas = queryElement<HTMLCanvasElement>(".renderer-canvas");
const viewportPanel = queryElement<HTMLElement>(".viewport-panel");
const gameViewOverlay = queryElement<HTMLElement>("[data-game-view-overlay]");
const statusText = queryElement<HTMLElement>("#backend-status");
const renderModeStatusText = queryElement<HTMLElement>("#render-mode-status");
const inputPathText = queryElement<HTMLElement>("#input-path");
const mapPackageSelect = queryElement<HTMLSelectElement>("#map-package-select");
const packageLoadStatusText = queryElement<HTMLElement>("#package-load-status");
const metadataSummary = queryElement<HTMLElement>("#metadata-summary");
const packageHealthSummary = queryElement<HTMLElement>("#package-health-summary");
const packageHealthList = queryElement<HTMLElement>("#package-health-list");
const sourceReferenceList = queryElement<HTMLElement>("#source-reference-list");
const compatibilityStatusText = queryElement<HTMLElement>("#compatibility-status");
const sceneTree = queryElement<HTMLElement>("#scene-tree");
const vertexList = queryElement<HTMLElement>("#vertex-list");
const selectedVertexText = queryElement<HTMLElement>("#selected-vertex");
const viewportPickText = queryElement<HTMLElement>("#viewport-pick");
const cameraModeText = queryElement<HTMLElement>("#camera-mode");
const textureResourceStatusText = queryElement<HTMLElement>("#texture-resource-status");
const faceInspector = queryElement<HTMLElement>("#face-inspector");

const { renderer, status } = await createThreeRenderer(canvas);
const adapter = new GaneshaThreeRendererAdapter(renderer, status);
const mapPackageLoader = new BrowserMapPackageLoader();
const selectionStore = new SelectionStore();
let loadedDocument = sampleMapDocument;
let activeLoadedPackage: LoadedMapPackage | null = null;
let availableMapPackages: readonly ConsolidatedMapPackageIndexEntry[] = [];
let consolidatedPackageRoot = DEFAULT_CONSOLIDATED_PACKAGE_ROOT;
let history = new EditCommandHistory<MeshDocument, RenderHint>(loadedDocument);
let activeLeftTab: string = initialPanelTab("leftTab", ["scene", "vertices"], "scene");
let activeRightTab: string = initialPanelTab(
  "rightTab",
  ["edit", "face", "history", "status"],
  "edit",
);
let gameViewEnabled = false;
let displayOptions: RendererDisplayOptions = {
  mode: "textured",
  showTexturedPolygons: true,
  showUntexturedPolygons: false,
  showVertexHandles: true,
  showPolygonLabels: false,
};
let activeVertexDrag: {
  pointerId: number;
  vertexId: string;
  polygonId: string;
  planeY: number;
  latestPosition: Vec3;
  moved: boolean;
} | null = null;
let activeCameraDrag: {
  pointerId: number;
  previousClientX: number;
  previousClientY: number;
  mode: "pan" | "orbit";
} | null = null;
let isDisposed = false;

statusText.textContent = `${adapter.status.backend.toUpperCase()} - ${adapter.status.reason}`;
adapter.setDisplayOptions(displayOptions);

await initializeMapPackages();
syncPanelTabs();
syncCameraMode();
syncDisplayControls();
syncGameViewOverlay();
adapter.start();

const resizeObserver = new ResizeObserver(([entry]) => {
  if (!entry) {
    return;
  }

  const { width, height } = entry.contentRect;
  adapter.resize(width, height);
});

resizeObserver.observe(viewportPanel);

canvas.addEventListener("pointerdown", (event) => {
  if (event.button === 2) {
    event.preventDefault();
    activeCameraDrag = {
      pointerId: event.pointerId,
      previousClientX: event.clientX,
      previousClientY: event.clientY,
      mode: "orbit",
    };
    viewportPickText.textContent = "right-drag camera orbit";
    canvas.setPointerCapture(event.pointerId);
    return;
  }

  if (event.button === 1) {
    event.preventDefault();
    activeCameraDrag = {
      pointerId: event.pointerId,
      previousClientX: event.clientX,
      previousClientY: event.clientY,
      mode: "pan",
    };
    canvas.setPointerCapture(event.pointerId);
    return;
  }

  const pick = adapter.pick(event.clientX, event.clientY);
  if (!pick) {
    return;
  }

  selectionStore.selectPolygon(pick.polygonId);
  selectionStore.selectVertex(pick.vertexId);
  viewportPickText.textContent = pick.vertexId
    ? `${pick.polygonId} / ${pick.vertexId}`
    : pick.polygonId;
  if (pick.vertexId) {
    const vertex = history.state.vertices.find((candidate) => candidate.id === pick.vertexId);
    if (vertex) {
      activeVertexDrag = {
        pointerId: event.pointerId,
        vertexId: pick.vertexId,
        polygonId: pick.polygonId,
        planeY: vertex.ganeshaDxPosition[1],
        latestPosition: vertex.ganeshaDxPosition,
        moved: false,
      };
      canvas.setPointerCapture(event.pointerId);
    }
  }
  renderDocumentUi();
});

canvas.addEventListener("pointermove", (event) => {
  if (activeCameraDrag?.pointerId === event.pointerId) {
    const deltaX = event.clientX - activeCameraDrag.previousClientX;
    const deltaY = event.clientY - activeCameraDrag.previousClientY;
    if (activeCameraDrag.mode === "orbit") {
      adapter.orbitCamera(
        deltaX * editorTuning.camera.orbitYawSensitivity,
        deltaY * editorTuning.camera.orbitElevationSensitivity,
      );
      syncCameraMode();
    } else {
      adapter.panCameraByScreenDelta(deltaX, deltaY);
    }
    activeCameraDrag = {
      pointerId: event.pointerId,
      previousClientX: event.clientX,
      previousClientY: event.clientY,
      mode: activeCameraDrag.mode,
    };
    return;
  }

  if (!activeVertexDrag || activeVertexDrag.pointerId !== event.pointerId) {
    return;
  }

  const nextPosition = adapter.screenPointToWorldOnPlane(
    event.clientX,
    event.clientY,
    activeVertexDrag.planeY,
  );
  if (!nextPosition) {
    return;
  }

  activeVertexDrag.latestPosition = nextPosition;
  activeVertexDrag.moved = true;
  adapter.updateVertexPosition(activeVertexDrag.vertexId, nextPosition);
  renderSelectedVertex(
    updateVertexPositionInDocument(history.state, activeVertexDrag.vertexId, nextPosition),
  );
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

window.addEventListener("pointerup", (event) => {
  if (activeCameraDrag?.pointerId === event.pointerId) {
    activeCameraDrag = null;
    return;
  }

  if (!activeVertexDrag || activeVertexDrag.pointerId !== event.pointerId) {
    return;
  }

  const completedDrag = activeVertexDrag;
  activeVertexDrag = null;
  if (!completedDrag.moved) {
    return;
  }

  const nextDocument = updateVertexPositionInDocument(
    history.state,
    completedDrag.vertexId,
    completedDrag.latestPosition,
  );
  const sanitized = sanitizeMeshDocumentForGaneshaDx(nextDocument);
  history.execute(sanitized.document, { kind: "document" });
  selectionStore.selectPolygon(completedDrag.polygonId);
  selectionStore.selectVertex(completedDrag.vertexId);
  renderDocument();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const panelTabButton = target.closest<HTMLElement>("[data-panel-tab]");
  if (panelTabButton?.dataset.panelTab && panelTabButton.dataset.tabTarget) {
    setActivePanelTab(panelTabButton.dataset.panelTab, panelTabButton.dataset.tabTarget);
    return;
  }

  const panelToggleButton = target.closest<HTMLElement>("[data-toggle-panel]");
  if (panelToggleButton?.dataset.togglePanel) {
    togglePanel(panelToggleButton.dataset.togglePanel);
    return;
  }

  const zoomButton = target.closest<HTMLElement>("[data-zoom]");
  if (zoomButton?.dataset.zoom) {
    updateViewportZoom(zoomButton.dataset.zoom);
    return;
  }

  const renderModeButton = target.closest<HTMLElement>("[data-render-mode]");
  if (renderModeButton?.dataset.renderMode) {
    setRenderMode(renderModeButton.dataset.renderMode);
    return;
  }

  const displayToggleButton = target.closest<HTMLElement>("[data-display-toggle]");
  if (displayToggleButton?.dataset.displayToggle) {
    toggleDisplayOption(displayToggleButton.dataset.displayToggle);
    return;
  }

  const viewModeButton = target.closest<HTMLElement>("[data-view-mode]");
  if (viewModeButton?.dataset.viewMode) {
    updateCameraViewMode(viewModeButton.dataset.viewMode);
    return;
  }

  const cameraPresetButton = target.closest<HTMLElement>("[data-camera-preset]");
  if (cameraPresetButton?.dataset.cameraPreset) {
    setCameraPreset(cameraPresetButton.dataset.cameraPreset);
    return;
  }

  const cameraOrbitButton = target.closest<HTMLElement>("[data-camera-orbit]");
  if (cameraOrbitButton?.dataset.cameraOrbit) {
    const [deltaYaw, deltaElevation] = parsePair(cameraOrbitButton.dataset.cameraOrbit);
    adapter.orbitCamera(deltaYaw, deltaElevation);
    syncCameraMode();
    return;
  }

  if (target.closest("[data-focus-selection]")) {
    focusCameraOnCurrentSelection();
    syncCameraMode();
    return;
  }

  if (target.closest("[data-game-view]")) {
    gameViewEnabled = !gameViewEnabled;
    syncGameViewOverlay();
    syncCameraMode();
    return;
  }

  const cameraPanButton = target.closest<HTMLElement>("[data-camera-pan]");
  if (cameraPanButton?.dataset.cameraPan) {
    const [deltaRight, deltaUp] = parsePair(cameraPanButton.dataset.cameraPan);
    adapter.panCameraInViewDirection(deltaRight, deltaUp);
    syncCameraMode();
    return;
  }

  if (target.closest("[data-camera-reset]")) {
    adapter.resetCamera();
    syncCameraMode();
    return;
  }

  const zoomPresetButton = target.closest<HTMLElement>("[data-zoom-preset]");
  if (zoomPresetButton?.dataset.zoomPreset) {
    adapter.setZoom(Number(zoomPresetButton.dataset.zoomPreset));
    syncCameraMode();
    return;
  }

  const polygonButton = target.closest<HTMLElement>("[data-polygon-id]");
  if (polygonButton?.dataset.polygonId) {
    selectionStore.selectPolygon(polygonButton.dataset.polygonId);
    selectionStore.selectVertex(null);
    renderDocumentUi();
    return;
  }

  const vertexButton = target.closest<HTMLElement>("[data-vertex-id]");
  if (vertexButton?.dataset.vertexId) {
    selectionStore.selectVertex(vertexButton.dataset.vertexId);
    renderDocumentUi();
    return;
  }

  const nudgeButton = target.closest<HTMLElement>("[data-nudge]");
  if (nudgeButton?.dataset.nudge) {
    nudgeSelectedVertex(parseNudge(nudgeButton.dataset.nudge));
    return;
  }

  if (target.closest("[data-undo]")) {
    history.undo();
    renderHistoryTransition();
    return;
  }

  if (target.closest("[data-redo]")) {
    history.redo();
    renderHistoryTransition();
    return;
  }

  if (target.closest("[data-reset-document]")) {
    history.reset(loadedDocument);
    selectInitialPolygon();
    renderDocument();
    return;
  }

  if (target.closest("[data-export-document]")) {
    exportMeshDocument(history.state);
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  const field = target.dataset.polygonField;
  if (!field) {
    return;
  }

  updateSelectedPolygonField(field, target);
});

mapPackageSelect.addEventListener("change", () => {
  const selectedPackage = availableMapPackages.find(
    (entry) => entry.path === mapPackageSelect.value,
  );
  if (!selectedPackage) {
    return;
  }

  void loadMapPackage(selectedPackage);
});

window.addEventListener("pagehide", disposeApp);
window.addEventListener("beforeunload", disposeApp);

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || isTextInputTarget(event.target)) {
    return;
  }

  if (event.key.toLowerCase() === "o") {
    event.preventDefault();
    adapter.setCameraViewMode(
      adapter.cameraViewMode === "isometric" ? "orthogonal" : "isometric",
    );
    syncCameraMode();
    return;
  }

  if (event.key.toLowerCase() === "g") {
    event.preventDefault();
    gameViewEnabled = !gameViewEnabled;
    syncGameViewOverlay();
    syncCameraMode();
    return;
  }

  if (event.key.toLowerCase() === "u") {
    event.preventDefault();
    setRenderMode(displayOptions.mode === "uv-debug" ? "textured" : "uv-debug");
    return;
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    focusCameraOnCurrentSelection();
    syncCameraMode();
    return;
  }

  const keyboardZoom = zoomActionForEvent(event);
  if (keyboardZoom) {
    event.preventDefault();
    updateViewportZoom(keyboardZoom);
    return;
  }

  const keyboardNudge = keyboardNudgeForEvent(event);
  if (keyboardNudge) {
    event.preventDefault();
    nudgeSelectedVertex(keyboardNudge);
    return;
  }

  const cameraPan = cameraPanForEvent(event);
  if (cameraPan) {
    event.preventDefault();
    adapter.panCameraInViewDirection(cameraPan[0], cameraPan[1]);
    syncCameraMode();
  }
});

async function initializeMapPackages(): Promise<void> {
  try {
    const localConfig = await loadLocalRuntimeConfig();
    consolidatedPackageRoot =
      localConfig?.consolidatedPackageRoot ?? DEFAULT_CONSOLIDATED_PACKAGE_ROOT;
    if (localConfig?.maps?.length) {
      availableMapPackages = localConfig.maps.filter((entry) => entry.mapId && entry.path);
      packageLoadStatusText.textContent = "Using local package config.";
    } else {
      const packageIndex = await mapPackageLoader.loadConsolidatedMapIndex(
        consolidatedPackageRoot,
      );
      availableMapPackages = packageIndex.maps;
    }
    renderPackageChooser();

    const initialPackage = availableMapPackages[0];
    if (!initialPackage) {
      throw new Error("No consolidated map packages are listed in index.json.");
    }

    await loadMapPackage(initialPackage);
  } catch (error) {
    console.warn("Falling back to bundled sample document", error);
    activeLoadedPackage = null;
    availableMapPackages = [];
    renderPackageChooser();
    adapter.setRenderResources(undefined);
    inputPathText.textContent = "bundled TypeScript fallback";
    packageLoadStatusText.textContent = "Package index unavailable; using bundled sample.";
    loadedDocument = sampleMapDocument;
    history = new EditCommandHistory<MeshDocument, RenderHint>(loadedDocument);
    selectInitialPolygon();
    renderDocument();
    updateCompatibilityStatus(validateMeshDocumentForGaneshaDx(loadedDocument));
    renderPackageMetadata(null);
    syncTextureResourceStatus();
  }
}

async function loadMapPackage(packageEntry: ConsolidatedMapPackageIndexEntry): Promise<void> {
  setPackageChooserBusy(true);
  packageLoadStatusText.textContent = `Loading ${packageEntry.mapId}.`;

  try {
    const loadedPackage = await mapPackageLoader.loadConsolidatedMapPackage(
      `${consolidatedPackageRoot}/${packageEntry.path}`,
    );
    activeLoadedPackage = loadedPackage;
    loadedDocument = loadedPackage.document;
    history = new EditCommandHistory<MeshDocument, RenderHint>(loadedDocument);
    adapter.setRenderResources(loadedPackage.renderResources);
    inputPathText.textContent = `${loadedPackage.provenance.format} ${loadedPackage.provenance.mapId}`;
    mapPackageSelect.value = packageEntry.path;
    packageLoadStatusText.textContent = `${packageEntry.label ?? packageEntry.mapId} loaded.`;
    selectInitialPolygon();
    renderDocument();
    updateCompatibilityStatus(loadedPackage.compatibilityIssues);
    renderPackageMetadata(loadedPackage);
    syncTextureResourceStatus();
  } catch (error) {
    console.error(`Failed to load package ${packageEntry.mapId}`, error);
    packageLoadStatusText.textContent = `Failed to load ${packageEntry.mapId}; keeping current document.`;
  } finally {
    setPackageChooserBusy(false);
  }
}

async function loadLocalRuntimeConfig(): Promise<LocalRuntimeConfig | null> {
  try {
    const response = await fetch(LOCAL_RUNTIME_CONFIG_URL, {
      cache: "no-store",
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<LocalRuntimeConfig>;
  } catch (error) {
    console.warn("Local runtime config unavailable; using tracked package index.", error);
    return null;
  }
}

function renderPackageChooser(): void {
  if (availableMapPackages.length === 0) {
    mapPackageSelect.innerHTML = `<option value="">No packages found</option>`;
    mapPackageSelect.disabled = true;
    return;
  }

  mapPackageSelect.innerHTML = availableMapPackages
    .map(
      (entry) => `
        <option value="${escapeHtml(entry.path)}">
          ${escapeHtml(entry.label ?? entry.mapId)}
        </option>
      `,
    )
    .join("");
  mapPackageSelect.disabled = availableMapPackages.length <= 1;
}

function setPackageChooserBusy(isBusy: boolean): void {
  mapPackageSelect.disabled = isBusy || availableMapPackages.length <= 1;
  mapPackageSelect.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function renderDocument(): void {
  adapter.loadDocument(history.state);
  renderDocumentUi();
}

function renderChangedPolygon(polygonId: string): void {
  adapter.updatePolygonDocument(history.state, polygonId);
  renderDocumentUi();
}

function renderHistoryTransition(): void {
  const hint = history.lastTransitionMetadata;
  if (hint?.kind === "polygon" && getPolygon(history.state, hint.polygonId)) {
    selectionStore.selectPolygon(hint.polygonId);
    renderChangedPolygon(hint.polygonId);
    return;
  }

  renderDocument();
}

function renderDocumentUi(): void {
  adapter.selectPolygon(selectionStore.current.polygonId);
  adapter.selectVertex(selectionStore.current.vertexId);
  renderSceneTree(history.state);
  renderVertexList(history.state);
  renderSelectedVertex(history.state);
  renderFaceInspector(history.state);
  updateCompatibilityStatus(validateMeshDocumentForGaneshaDx(history.state));
  renderPackageMetadata(activeLoadedPackage);
  syncCameraMode();
  syncTextureResourceStatus();
}

function disposeApp(): void {
  if (isDisposed) {
    return;
  }

  isDisposed = true;
  activeCameraDrag = null;
  activeVertexDrag = null;
  resizeObserver.disconnect();
  adapter.dispose();
}

function setActivePanelTab(side: string, tab: string): void {
  if (side === "left") {
    activeLeftTab = tab;
    appShell.dataset.leftCollapsed = "false";
  } else if (side === "right") {
    activeRightTab = tab;
    appShell.dataset.rightCollapsed = "false";
  }

  syncPanelTabs();
}

function togglePanel(side: string): void {
  if (side === "left") {
    appShell.dataset.leftCollapsed =
      appShell.dataset.leftCollapsed === "true" ? "false" : "true";
  } else if (side === "right") {
    appShell.dataset.rightCollapsed =
      appShell.dataset.rightCollapsed === "true" ? "false" : "true";
  }

  syncPanelToggles();
}

function syncPanelTabs(): void {
  for (const button of app!.querySelectorAll<HTMLElement>("[data-panel-tab]")) {
    const side = button.dataset.panelTab;
    const target = button.dataset.tabTarget;
    const active = (side === "left" && target === activeLeftTab) ||
      (side === "right" && target === activeRightTab);
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  }

  for (const page of app!.querySelectorAll<HTMLElement>("[data-panel-page]")) {
    const side = page.dataset.panelSide;
    const target = page.dataset.panelPage;
    page.hidden = !(
      (side === "left" && target === activeLeftTab) ||
      (side === "right" && target === activeRightTab)
    );
  }

  syncPanelToggles();
}

function syncPanelToggles(): void {
  for (const button of app!.querySelectorAll<HTMLElement>("[data-toggle-panel]")) {
    const side = button.dataset.togglePanel;
    const collapsed = side === "left"
      ? appShell.dataset.leftCollapsed === "true"
      : appShell.dataset.rightCollapsed === "true";
    const label = button.querySelector("span");
    if (label) {
      label.textContent = collapsed ? "Show" : "Hide";
    }
    button.setAttribute("aria-pressed", collapsed ? "true" : "false");
  }
}

function updateViewportZoom(action: string): void {
  if (action === "in") {
    adapter.adjustZoom(editorTuning.camera.buttonZoomStep);
  } else if (action === "out") {
    adapter.adjustZoom(-editorTuning.camera.buttonZoomStep);
  } else if (action === "reset") {
    adapter.setZoom(editorTuning.camera.defaultZoom);
  }
  syncCameraMode();
}

function updateCameraViewMode(mode: string): void {
  if (mode !== "isometric" && mode !== "orthogonal") {
    return;
  }

  adapter.setCameraViewMode(mode);
  syncCameraMode();
}

function setRenderMode(mode: string): void {
  if (!isRendererDisplayMode(mode)) {
    return;
  }

  displayOptions = {
    ...displayOptions,
    mode,
  };
  adapter.setDisplayOptions(displayOptions);
  renderDocumentUi();
  syncDisplayControls();
  syncTextureResourceStatus();
}

function toggleDisplayOption(option: string): void {
  if (!isDisplayToggle(option)) {
    return;
  }

  displayOptions = {
    ...displayOptions,
    [option]: !displayOptions[option],
  };
  adapter.setDisplayOptions(displayOptions);
  renderDocumentUi();
  syncDisplayControls();
}

function syncCameraMode(): void {
  cameraModeText.textContent = adapter.cameraPresetLabel;
  for (const button of app!.querySelectorAll<HTMLElement>("[data-game-view]")) {
    button.classList.toggle("active", gameViewEnabled);
    button.setAttribute("aria-pressed", gameViewEnabled ? "true" : "false");
  }
}

function syncDisplayControls(): void {
  renderModeStatusText.textContent = displayModeLabel(displayOptions.mode);

  for (const button of app!.querySelectorAll<HTMLElement>("[data-render-mode]")) {
    const active = button.dataset.renderMode === displayOptions.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  for (const button of app!.querySelectorAll<HTMLElement>("[data-display-toggle]")) {
    const toggle = button.dataset.displayToggle;
    const active = isDisplayToggle(toggle) ? displayOptions[toggle] : false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function displayModeLabel(mode: RendererDisplayMode): string {
  if (mode === "uv-debug") {
    return "UV Chart";
  }
  if (mode === "wireframe") {
    return "Wire";
  }
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function syncTextureResourceStatus(): void {
  const resourceStatus = adapter.textureResourceStatus;
  textureResourceStatusText.textContent = resourceStatus.usingFallbackTexture
    ? `${resourceStatus.paletteCount} palettes, no texture payload; fallback atlas`
    : `${resourceStatus.paletteCount} palettes, ${resourceStatus.textureCount} textures, ${resourceStatus.mappingCount} mappings`;
}

function renderPackageMetadata(loadedPackage: LoadedMapPackage | null): void {
  if (!loadedPackage) {
    metadataSummary.innerHTML = `
      <div>
        <dt>Active package</dt>
        <dd>Bundled sample fallback</dd>
      </div>
    `;
    packageHealthSummary.dataset.healthStatus = "warning";
    packageHealthSummary.textContent = "Package metadata unavailable";
    packageHealthList.innerHTML = `
      <li class="health-item" data-health-check="warning">
        <strong>Fallback document</strong>
        <span>No consolidated package index was loaded.</span>
      </li>
    `;
    sourceReferenceList.innerHTML = `
      <div>
        <dt>Source</dt>
        <dd>Bundled TypeScript sample</dd>
      </div>
    `;
    return;
  }

  const metadata = loadedPackage.metadata;
  const polygonCount = loadedPackage.document.sections.reduce(
    (sum, section) => sum + section.polygons.length,
    0,
  );
  const counts = metadata?.counts;
  metadataSummary.innerHTML = `
    <div>
      <dt>Map ID</dt>
      <dd>${escapeHtml(metadata?.mapId ?? loadedPackage.provenance.mapId ?? loadedPackage.document.id)}</dd>
    </div>
    <div>
      <dt>Format</dt>
      <dd>${escapeHtml(formatMetadataFormat(metadata))}</dd>
    </div>
    <div>
      <dt>Document</dt>
      <dd>${loadedPackage.document.vertices.length} vertices, ${loadedPackage.document.sections.length} sections, ${polygonCount} polygons</dd>
    </div>
    <div>
      <dt>Resources</dt>
      <dd>${counts?.resourceCount ?? metadata?.resources?.length ?? "unknown"} resources, ${counts?.uniqueTextures ?? "unknown"} unique textures</dd>
    </div>
    <div>
      <dt>Variants</dt>
      <dd>${counts?.variantCount ?? metadata?.variants?.length ?? "unknown"} variants, ${counts?.meshUses ?? "unknown"} mesh uses</dd>
    </div>
  `;

  renderPackageHealth(loadedPackage);
  renderSourceReferences(loadedPackage);
}

function renderPackageHealth(loadedPackage: LoadedMapPackage): void {
  const status = loadedPackage.packageHealth.status;
  packageHealthSummary.dataset.healthStatus = status;
  packageHealthSummary.textContent = healthStatusLabel(status);
  packageHealthList.innerHTML = loadedPackage.packageHealth.checks
    .map(
      (check) => `
        <li class="health-item" data-health-check="${escapeHtml(check.status)}">
          <strong>${escapeHtml(check.label)}</strong>
          <span>${escapeHtml(check.detail)}</span>
        </li>
      `,
    )
    .join("");
}

function renderSourceReferences(loadedPackage: LoadedMapPackage): void {
  const sourcePackage = loadedPackage.metadata?.sourcePackage;
  if (!sourcePackage || Object.keys(sourcePackage).length === 0) {
    sourceReferenceList.innerHTML = `
      <div>
        <dt>Package path</dt>
        <dd>${escapeHtml(loadedPackage.provenance.sourcePath ?? "unknown")}</dd>
      </div>
    `;
    return;
  }

  sourceReferenceList.innerHTML = Object.entries(sourcePackage)
    .map(
      ([label, value]) => `
        <div>
          <dt>${escapeHtml(splitCamelCase(label))}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `,
    )
    .join("");
}

function formatMetadataFormat(loadedPackageMetadata: LoadedMapPackage["metadata"]): string {
  if (!loadedPackageMetadata) {
    return "metadata unavailable";
  }

  const version = loadedPackageMetadata.version === undefined
    ? "unknown"
    : String(loadedPackageMetadata.version);
  return `${loadedPackageMetadata.format ?? "consolidated metadata"} v${version}`;
}

function healthStatusLabel(status: PackageHealthStatus): string {
  if (status === "healthy") {
    return "Healthy package";
  }
  if (status === "error") {
    return "Package has blocking errors";
  }
  return "Package has warnings";
}

function splitCamelCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function syncGameViewOverlay(): void {
  gameViewOverlay.hidden = !gameViewEnabled;
}

function setCameraPreset(value: string): void {
  const [direction, elevation] = value.split(",");
  if (!isGaneshaDirection(direction) || !isGaneshaElevation(elevation)) {
    return;
  }

  adapter.setGaneshaCameraPreset(direction, elevation);
  syncCameraMode();
}

function focusCameraOnCurrentSelection(): void {
  const selectedVertex = history.state.vertices.find(
    (vertex) => vertex.id === selectionStore.current.vertexId,
  );
  if (selectedVertex) {
    adapter.focusCameraOnPoint(selectedVertex.ganeshaDxPosition);
    return;
  }

  const polygon = getPolygon(history.state, selectionStore.current.polygonId);
  if (!polygon) {
    return;
  }

  const positions = polygon.vertexIds
    .map((vertexId) => history.state.vertices.find((vertex) => vertex.id === vertexId))
    .filter((vertex) => vertex !== undefined)
    .map((vertex) => vertex.ganeshaDxPosition);
  if (positions.length === 0) {
    return;
  }

  const average = positions.reduce<Vec3>(
    (sum, position) => [
      sum[0] + position[0],
      sum[1] + position[1],
      sum[2] + position[2],
    ],
    [0, 0, 0],
  );
  adapter.focusCameraOnPoint([
    average[0] / positions.length,
    average[1] / positions.length,
    average[2] / positions.length,
  ]);
}

function isGaneshaDirection(value: string | undefined): value is GaneshaCameraDirection {
  return value === "northwest" ||
    value === "northeast" ||
    value === "southwest" ||
    value === "southeast";
}

function isGaneshaElevation(value: string | undefined): value is GaneshaCameraElevation {
  return value === "top" || value === "bottom";
}

function isRendererDisplayMode(value: string): value is RendererDisplayMode {
  return value === "textured" ||
    value === "uv-debug" ||
    value === "solid" ||
    value === "wireframe";
}

function isDisplayToggle(
  value: string | undefined,
): value is "showTexturedPolygons" | "showUntexturedPolygons" | "showVertexHandles" | "showPolygonLabels" {
  return value === "showTexturedPolygons" ||
    value === "showUntexturedPolygons" ||
    value === "showVertexHandles" ||
    value === "showPolygonLabels";
}

function renderSceneTree(document: MeshDocument): void {
  sceneTree.innerHTML = document.sections
    .map(
      (section) => `
        <section class="tree-section">
          <h3>${escapeHtml(section.label)}</h3>
          ${section.polygons
            .map((polygon) => {
              const selected = selectionStore.current.polygonId === polygon.id;
              const label = `${polygon.isTextured ? "Textured" : "Untextured"} ${
                polygon.vertexIds.length === 4 ? "quad" : "triangle"
              }`;
              return `
                <button
                  class="tree-item ${selected ? "selected" : ""}"
                  data-polygon-id="${escapeHtml(polygon.id)}"
                  type="button"
                >
                  <span>${escapeHtml(label)}</span>
                  <small>${escapeHtml(polygon.id)}</small>
                </button>
              `;
            })
            .join("")}
        </section>
      `,
    )
    .join("");
}

function renderVertexList(document: MeshDocument): void {
  const polygon = getPolygon(document, selectionStore.current.polygonId);
  if (!polygon) {
    vertexList.innerHTML = `<p class="empty-state">Select a polygon.</p>`;
    return;
  }

  vertexList.innerHTML = polygon.vertexIds
    .map((vertexId, index) => {
      const vertex = document.vertices.find((candidate) => candidate.id === vertexId);
      const selected = selectionStore.current.vertexId
        ? selectionStore.current.vertexId === vertexId
        : true;
      const position = vertex?.ganeshaDxPosition ?? [0, 0, 0];
      return `
        <button
          class="vertex-item ${selected ? "selected" : ""}"
          data-vertex-id="${escapeHtml(vertexId)}"
          type="button"
        >
          <span>${String.fromCharCode(65 + index)} - ${escapeHtml(vertexId)}</span>
          <small>${position.join(", ")}</small>
        </button>
      `;
    })
    .join("");
}

function renderSelectedVertex(document: MeshDocument): void {
  const selectedVertex = document.vertices.find(
    (vertex) => vertex.id === selectionStore.current.vertexId,
  );
  const selectedPolygon = getPolygon(document, selectionStore.current.polygonId);
  selectedVertexText.textContent = selectedVertex
    ? `${selectedVertex.id}: ${selectedVertex.ganeshaDxPosition.join(", ")}`
    : selectedPolygon
      ? `${selectedPolygon.id}: all ${selectedPolygon.vertexIds.length} vertices`
    : "none";
}

function renderFaceInspector(document: MeshDocument): void {
  const polygon = getPolygon(document, selectionStore.current.polygonId);
  if (!polygon) {
    faceInspector.innerHTML = `<p class="empty-state">Select a face.</p>`;
    return;
  }

  const polygonIssues = validateMeshDocumentForGaneshaDx(document).filter(
    (issue) => issue.polygonId === polygon.id,
  );
  const renderingProperties = renderingPropertiesFor(polygon);
  const visibilityKeys = Object.keys(renderingProperties).filter((key) =>
    key.startsWith("invisible")
  );
  const terrain = polygon.terrainBinding ?? {
    terrainX: 255,
    terrainZ: 127,
    terrainLevel: 0,
  };

  faceInspector.innerHTML = `
    <div class="control-group">
      <h2>Face</h2>
      <dl class="facts compact">
        <div>
          <dt>Polygon</dt>
          <dd>${escapeHtml(polygon.id)}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>${polygon.isTextured ? "Textured" : "Untextured"} ${polygon.vertexIds.length === 4 ? "quad" : "triangle"}</dd>
        </div>
        <div>
          <dt>Section</dt>
          <dd>${escapeHtml(polygon.sectionId)}</dd>
        </div>
      </dl>
    </div>
    <div class="control-group">
      <h2>Field Warnings</h2>
      ${renderPolygonIssues(polygonIssues)}
    </div>
    <div class="control-group">
      <h2>Texture Page Preview</h2>
      <canvas class="texture-preview" data-texture-preview width="256" height="256"></canvas>
    </div>
    <div class="control-group">
      <h2>Texture</h2>
      ${renderTextureFields(polygon)}
    </div>
    <div class="control-group">
      <h2>UV Coordinates</h2>
      ${renderUvFields(polygon)}
    </div>
    <div class="control-group">
      <h2>Terrain Binding</h2>
      <div class="field-grid">
        ${renderNumberField("X", "terrainX", terrain.terrainX, 0, 255)}
        ${renderNumberField("Z", "terrainZ", terrain.terrainZ, 0, 127)}
        ${renderNumberField("Level", "terrainLevel", terrain.terrainLevel, 0, 1)}
      </div>
    </div>
    <div class="control-group">
      <h2>Visibility</h2>
      ${visibilityKeys.length ? renderVisibilityFields(renderingProperties, visibilityKeys) : `<p class="empty-state">No visibility flags on this face.</p>`}
    </div>
    <div class="control-group">
      <h2>Source-Preserved Fields</h2>
      <pre class="source-preserved">${escapeHtml(JSON.stringify(polygon.preserved ?? {}, null, 2))}</pre>
    </div>
  `;

  drawSelectedTexturePreview(polygon);
}

function renderPolygonIssues(issues: readonly CompatibilityIssue[]): string {
  if (issues.length === 0) {
    return `<p class="empty-state">Selected face fields fit current GaneshaDX limits.</p>`;
  }

  return `
    <ul class="field-warning-list">
      ${issues
        .map(
          (issue) => `
            <li data-warning-severity="${escapeHtml(issue.severity)}">
              <strong>${escapeHtml(issue.fieldPath ?? issue.code)}</strong>
              <span>${escapeHtml(issue.message)}</span>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderTextureFields(polygon: MapPolygon): string {
  if (!polygon.isTextured) {
    return `<p class="empty-state">This face is untextured.</p>`;
  }

  return `
    <div class="field-grid">
      ${renderNumberField("Page", "texturePage", polygon.texturePage ?? 0, 0, 3)}
      ${renderNumberField("Palette", "paletteId", polygon.paletteId ?? 0, 0, 15)}
    </div>
  `;
}

function renderUvFields(polygon: MapPolygon): string {
  if (!polygon.isTextured) {
    return `<p class="empty-state">Untextured faces do not carry UV data.</p>`;
  }

  return `
    <div class="uv-editor">
      ${(polygon.uv ?? [])
        .map(
          (uv, index) => `
            <div class="uv-row">
              <span>${String.fromCharCode(65 + index)}</span>
              ${renderNumberField("U", `uv:${index}:u`, uv[0], 0, 255)}
              ${renderNumberField("V", `uv:${index}:v`, uv[1], 0, 255)}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderVisibilityFields(
  renderingProperties: Record<string, unknown>,
  visibilityKeys: readonly string[],
): string {
  return `
    <div class="visibility-grid">
      ${visibilityKeys
        .map((key) => {
          const checked = renderingProperties[key] === true ? "checked" : "";
          return `
            <label class="checkbox-field">
              <input data-polygon-field="render:${escapeHtml(key)}" type="checkbox" ${checked}>
              <span>${escapeHtml(splitCamelCase(key))}</span>
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderNumberField(
  label: string,
  field: string,
  value: number,
  min: number,
  max: number,
): string {
  return `
    <label class="number-field">
      <span>${escapeHtml(label)}</span>
      <input
        data-polygon-field="${escapeHtml(field)}"
        type="number"
        min="${min}"
        max="${max}"
        step="1"
        value="${Number.isFinite(value) ? value : min}"
      >
    </label>
  `;
}

function updateSelectedPolygonField(
  field: string,
  target: HTMLInputElement | HTMLSelectElement,
): void {
  const polygonId = selectionStore.current.polygonId;
  if (!polygonId) {
    return;
  }

  const nextDocument = updatePolygonInDocument(history.state, polygonId, (polygon) =>
    updatePolygonField(polygon, field, target),
  );
  const sanitized = sanitizeMeshDocumentForGaneshaDx(nextDocument);
  history.execute(sanitized.document, { kind: "polygon", polygonId });
  selectionStore.selectPolygon(polygonId);
  renderChangedPolygon(polygonId);
}

function updatePolygonField(
  polygon: MapPolygon,
  field: string,
  target: HTMLInputElement | HTMLSelectElement,
): MapPolygon {
  if (field === "texturePage") {
    return {
      ...polygon,
      texturePage: parseIntegerInput(target.value, polygon.texturePage ?? 0),
    };
  }
  if (field === "paletteId") {
    return {
      ...polygon,
      paletteId: parseIntegerInput(target.value, polygon.paletteId ?? 0),
    };
  }
  if (field === "terrainX" || field === "terrainZ" || field === "terrainLevel") {
    const terrainBinding = polygon.terrainBinding ?? {
      terrainX: 255,
      terrainZ: 127,
      terrainLevel: 0,
    };
    return {
      ...polygon,
      terrainBinding: {
        ...terrainBinding,
        [field]: parseIntegerInput(target.value, terrainBinding[field]),
      },
    };
  }
  if (field.startsWith("uv:")) {
    return updateUvField(polygon, field, target.value);
  }
  if (field.startsWith("render:") && target instanceof HTMLInputElement) {
    return updateRenderFlag(polygon, field.slice("render:".length), target.checked);
  }

  return polygon;
}

function updateUvField(polygon: MapPolygon, field: string, value: string): MapPolygon {
  const [, rawIndex, axis] = field.split(":");
  const uvIndex = Number(rawIndex);
  if (!Number.isInteger(uvIndex) || (axis !== "u" && axis !== "v")) {
    return polygon;
  }

  const uvs = [...(polygon.uv ?? [])];
  const existing = uvs[uvIndex] ?? [0, 0];
  const nextValue = parseIntegerInput(value, axis === "u" ? existing[0] : existing[1]);
  uvs[uvIndex] = axis === "u"
    ? [nextValue, existing[1]]
    : [existing[0], nextValue];

  return {
    ...polygon,
    uv: uvs,
  };
}

function updateRenderFlag(polygon: MapPolygon, key: string, checked: boolean): MapPolygon {
  return {
    ...polygon,
    preserved: {
      ...(polygon.preserved ?? {}),
      renderingProperties: {
        ...renderingPropertiesFor(polygon),
        [key]: checked,
      },
    },
  };
}

function parseIntegerInput(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function drawSelectedTexturePreview(polygon: MapPolygon): void {
  const canvas = faceInspector.querySelector<HTMLCanvasElement>("[data-texture-preview]");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#08090b";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!polygon.isTextured) {
    drawPreviewMessage(context, "Untextured face");
    return;
  }

  const preview = resolveTexturePreviewResources(polygon);
  if (!preview) {
    drawPreviewMessage(context, "Texture resources unavailable");
    return;
  }

  const rows = preview.texture.decoded?.indexedPixelRowsHex ??
    preview.texture.indexedPixelRowsHex;
  if (!rows?.length) {
    drawPreviewMessage(context, "Indexed pixels unavailable");
    return;
  }

  const width = preview.texture.format?.width ?? preview.texture.width ?? 256;
  const texturePage = polygon.texturePage ?? 0;
  const pageY = texturePage * 256;
  const image = context.createImageData(256, 256);
  for (let y = 0; y < 256; y += 1) {
    const row = rows[pageY + y] ?? "";
    for (let x = 0; x < 256; x += 1) {
      const colorIndex = Number.parseInt(row[x % width] ?? "0", 16) & 0x0f;
      const color = preview.palette.colors?.[colorIndex] ?? "#000000";
      const rgba = parsePreviewColor(color);
      const index = (y * 256 + x) * 4;
      image.data[index] = rgba[0];
      image.data[index + 1] = rgba[1];
      image.data[index + 2] = rgba[2];
      image.data[index + 3] = rgba[3];
    }
  }
  context.putImageData(image, 0, 0);
  drawUvOverlay(context, polygon.uv);
}

function drawPreviewMessage(context: CanvasRenderingContext2D, message: string): void {
  context.fillStyle = "#a9b6c8";
  context.font = "bold 13px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, 128, 128);
}

function drawUvOverlay(
  context: CanvasRenderingContext2D,
  uvs: readonly Vec2[] | undefined,
): void {
  if (!uvs?.length) {
    return;
  }

  context.save();
  context.lineWidth = 2;
  context.strokeStyle = "#ffffff";
  context.fillStyle = "rgba(132, 197, 255, 0.2)";
  context.beginPath();
  for (const [index, uv] of uvs.entries()) {
    if (index === 0) {
      context.moveTo(uv[0], uv[1]);
    } else {
      context.lineTo(uv[0], uv[1]);
    }
  }
  context.closePath();
  context.fill();
  context.stroke();

  context.font = "bold 10px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const [index, uv] of uvs.entries()) {
    context.fillStyle = "#10161e";
    context.fillRect(uv[0] - 7, uv[1] - 7, 14, 14);
    context.fillStyle = "#ffffff";
    context.fillText(String.fromCharCode(65 + index), uv[0], uv[1] + 1);
  }
  context.restore();
}

function resolveTexturePreviewResources(
  polygon: MapPolygon,
): { texture: IndexedTextureJson; palette: PaletteJson } | null {
  const resources = activeLoadedPackage?.renderResources;
  if (!resources) {
    return null;
  }

  const mapping = textureMappingFor(polygon);
  const meshMapping = meshTextureMappingFor(polygon);
  const textureKey =
    mapping?.textureId ??
    mapping?.textureRef ??
    meshMapping?.stateTexture?.textureId;
  const texture = resources.baseTextures.textures?.find((candidate, index) =>
    textureKey
      ? candidate.textureId === textureKey ||
        candidate.textureRef === textureKey ||
        candidate.id === textureKey ||
        candidate.sourceSha256 === textureKey
      : index === 0
  );
  const palette = paletteForPreview(polygon, mapping, meshMapping);
  if (!texture || !palette) {
    return null;
  }

  return { texture, palette };
}

function textureMappingFor(polygon: MapPolygon): TextureMappingJsonRecord | undefined {
  return activeLoadedPackage?.renderResources?.textureMapping.mappings?.find((mapping) =>
    mapping.polygonId === polygon.id ||
    mapping.meshId === polygon.id ||
    mapping.sectionId === polygon.sectionId
  );
}

function meshTextureMappingFor(polygon: MapPolygon): MeshTextureMappingJsonRecord | undefined {
  const meshResource = preservedString(polygon, "meshResource");
  const meshRef = preservedString(polygon, "meshRef");
  return activeLoadedPackage?.renderResources?.textureMapping.meshMappings?.find((mapping) =>
    mapping.meshSectionRefs?.some((sectionRef) =>
      (meshRef && sectionRef.meshRef === meshRef) ||
      (meshResource && sectionRef.meshResource === meshResource)
    ) ||
    (meshResource && mapping.meshResource === meshResource)
  );
}

function paletteForPreview(
  polygon: MapPolygon,
  mapping: TextureMappingJsonRecord | undefined,
  meshMapping: MeshTextureMappingJsonRecord | undefined,
): PaletteJson | undefined {
  const palettes = activeLoadedPackage?.renderResources?.palettes.palettes ?? [];
  const paletteId = polygon.paletteId ?? 0;
  const meshPaletteRef = meshMapping?.palettes?.main?.find(
    (palette) => palette.paletteIndex === paletteId,
  )?.paletteRef;
  if (meshPaletteRef) {
    const palette = palettes.find((candidate) => candidate.paletteRef === meshPaletteRef);
    if (palette) {
      return palette;
    }
  }

  const mappedPaletteRef = mapping?.paletteRefs?.[paletteId % mapping.paletteRefs.length];
  if (mappedPaletteRef) {
    const palette = palettes.find((candidate) => candidate.paletteRef === mappedPaletteRef);
    if (palette) {
      return palette;
    }
  }

  return palettes[paletteId % palettes.length] ?? palettes[0];
}

function preservedString(polygon: MapPolygon, key: string): string | undefined {
  const value = polygon.preserved?.[key];
  return typeof value === "string" ? value : undefined;
}

function renderingPropertiesFor(polygon: MapPolygon): Record<string, unknown> {
  const renderingProperties = polygon.preserved?.renderingProperties;
  if (
    renderingProperties &&
    typeof renderingProperties === "object" &&
    !Array.isArray(renderingProperties)
  ) {
    return renderingProperties as Record<string, unknown>;
  }
  return {};
}

function parsePreviewColor(color: string): [number, number, number, number] {
  const normalized = color.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16) || 0;
  const green = Number.parseInt(normalized.slice(2, 4), 16) || 0;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) || 0;
  return [red, green, blue, normalized === "000000" ? 0 : 255];
}

function nudgeSelectedVertex(delta: Vec3): void {
  const vertexId = selectionStore.current.vertexId;
  if (!vertexId) {
    return;
  }

  const nextDocument = nudgeVertexPosition(history.state, vertexId, delta);
  const sanitized = sanitizeMeshDocumentForGaneshaDx(nextDocument);
  history.execute(sanitized.document, { kind: "document" });
  renderDocument();
}

function selectInitialPolygon(): void {
  const firstPolygon = loadedDocument.sections[0]?.polygons[0];
  selectionStore.selectPolygon(firstPolygon?.id ?? null);
  selectionStore.selectVertex(null);
}

function updateCompatibilityStatus(issues: readonly CompatibilityIssue[]): void {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  compatibilityStatusText.textContent =
    errors.length === 0 && warnings.length === 0
      ? "All loaded values fit original GaneshaDX limits"
      : `${errors.length} errors, ${warnings.length} clamped warnings`;
}

function exportMeshDocument(document: MeshDocument): void {
  const exportPayload = activeLoadedPackage?.rawMeshJson
    ? exportConsolidatedMeshJson(activeLoadedPackage.rawMeshJson, document)
    : document;
  const blob = new Blob([`${JSON.stringify(exportPayload, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = documentElement("a");
  link.href = url;
  link.download = activeLoadedPackage?.rawMeshJson
    ? `${document.id}.consolidated.mesh.json`
    : `${document.id}.mesh.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseNudge(value: string): Vec3 {
  const parts = value.split(",").map((part) => Number(part));
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function parsePair(value: string): [number, number] {
  const parts = value.split(",").map((part) => Number(part));
  return [parts[0] ?? 0, parts[1] ?? 0];
}

function zoomActionForEvent(event: KeyboardEvent): "in" | "out" | null {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return null;
  }

  if (event.key === "+" || event.key === "=") {
    return "in";
  }
  if (event.key === "-" || event.key === "_") {
    return "out";
  }

  return null;
}

function keyboardNudgeForEvent(event: KeyboardEvent): Vec3 | null {
  if (!event.shiftKey || !selectionStore.current.vertexId) {
    return null;
  }

  if (event.key === "ArrowLeft") {
    return [-editorTuning.editing.vertexNudgeStep, 0, 0];
  }
  if (event.key === "ArrowRight") {
    return [editorTuning.editing.vertexNudgeStep, 0, 0];
  }
  if (event.key === "ArrowUp") {
    return [0, 0, -editorTuning.editing.vertexNudgeStep];
  }
  if (event.key === "ArrowDown") {
    return [0, 0, editorTuning.editing.vertexNudgeStep];
  }
  if (event.key === "PageUp") {
    return [0, editorTuning.editing.vertexNudgeStep, 0];
  }
  if (event.key === "PageDown") {
    return [0, -editorTuning.editing.vertexNudgeStep, 0];
  }

  return null;
}

function cameraPanForEvent(event: KeyboardEvent): [number, number] | null {
  if (event.shiftKey) {
    return null;
  }

  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") {
    return [-editorTuning.camera.keyboardPanStep, 0];
  }
  if (key === "arrowright" || key === "d") {
    return [editorTuning.camera.keyboardPanStep, 0];
  }
  if (key === "arrowup" || key === "w") {
    return [0, editorTuning.camera.keyboardPanStep];
  }
  if (key === "arrowdown" || key === "s") {
    return [0, -editorTuning.camera.keyboardPanStep];
  }

  return null;
}

function isTextInputTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;
}

function initialPanelTab<T extends string>(
  paramName: string,
  validTabs: readonly T[],
  fallback: T,
): T {
  const requested = new URLSearchParams(window.location.search).get(paramName);
  return validTabs.includes(requested as T) ? requested as T : fallback;
}

function queryElement<T extends Element>(selector: string): T {
  const element = app?.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }
  return element;
}

function documentElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): HTMLElementTagNameMap[K] {
  return document.createElement(tagName);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
