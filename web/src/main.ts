import "./styles.css";
import { sampleMapDocument } from "./domain/sampleMapDocument";
import { BrowserMapPackageLoader } from "./loaders/MapPackageLoader";
import { createThreeRenderer } from "./renderer/createThreeRenderer";
import { GaneshaThreeRendererAdapter } from "./renderer/GaneshaThreeRendererAdapter";
import {
  getPolygon,
  nudgeVertexPosition,
  type MeshDocument,
  type Vec3,
} from "./domain/mapDocument";
import { EditCommandHistory } from "./domain/editCommandHistory";
import { SelectionStore } from "./domain/selectionStore";
import {
  sanitizeMeshDocumentForGaneshaDx,
  validateMeshDocumentForGaneshaDx,
  type CompatibilityIssue,
} from "./domain/compatibility";

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
      <div class="status-bar">
        <span class="status-label">Renderer</span>
        <strong id="backend-status">Starting</strong>
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
            <h2>Translate Vertex</h2>
            <div class="nudge-grid">
              <button class="control-button" data-nudge="-1,0,0">X -</button>
              <button class="control-button" data-nudge="1,0,0">X +</button>
              <button class="control-button" data-nudge="0,-1,0">Y -</button>
              <button class="control-button" data-nudge="0,1,0">Y +</button>
              <button class="control-button" data-nudge="0,0,-1">Z -</button>
              <button class="control-button" data-nudge="0,0,1">Z +</button>
            </div>
          </div>
          <div class="control-group">
            <h2>Zoom</h2>
            <div class="button-row">
              <button class="control-button secondary" data-zoom="out" type="button">Zoom -</button>
              <button class="control-button secondary" data-zoom="in" type="button">Zoom +</button>
            </div>
            <button class="control-button secondary" data-zoom="reset" type="button">Reset zoom</button>
          </div>
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
          </dl>
        </section>
      </div>
    </aside>
  </main>
`;

const appShell = queryElement<HTMLElement>(".app-shell");
const canvas = queryElement<HTMLCanvasElement>(".renderer-canvas");
const viewportPanel = queryElement<HTMLElement>(".viewport-panel");
const statusText = queryElement<HTMLElement>("#backend-status");
const inputPathText = queryElement<HTMLElement>("#input-path");
const compatibilityStatusText = queryElement<HTMLElement>("#compatibility-status");
const sceneTree = queryElement<HTMLElement>("#scene-tree");
const vertexList = queryElement<HTMLElement>("#vertex-list");
const selectedVertexText = queryElement<HTMLElement>("#selected-vertex");
const viewportPickText = queryElement<HTMLElement>("#viewport-pick");

const { renderer, status } = await createThreeRenderer(canvas);
const adapter = new GaneshaThreeRendererAdapter(renderer, status);
const mapPackageLoader = new BrowserMapPackageLoader();
const selectionStore = new SelectionStore();
let loadedDocument = sampleMapDocument;
let history = new EditCommandHistory<MeshDocument>(loadedDocument);
let activeLeftTab = "scene";
let activeRightTab = "edit";

statusText.textContent = `${adapter.status.backend.toUpperCase()} - ${adapter.status.reason}`;

try {
  const loadedPackage = await mapPackageLoader.loadConsolidatedMapPackage(
    "/reports/gmapx-consolidated/MAP001",
  );
  loadedDocument = loadedPackage.document;
  history = new EditCommandHistory<MeshDocument>(loadedDocument);
  inputPathText.textContent = `${loadedPackage.provenance.format} ${loadedPackage.provenance.mapId}`;
  updateCompatibilityStatus(loadedPackage.compatibilityIssues);
} catch (error) {
  console.warn("Falling back to bundled sample document", error);
  inputPathText.textContent = "bundled TypeScript fallback";
  updateCompatibilityStatus(validateMeshDocumentForGaneshaDx(loadedDocument));
}

selectInitialPolygon();
renderDocument();
syncPanelTabs();
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
  const pick = adapter.pick(event.clientX, event.clientY);
  if (!pick) {
    return;
  }

  selectionStore.selectPolygon(pick.polygonId);
  const polygon = getPolygon(history.state, pick.polygonId);
  selectionStore.selectVertex(pick.vertexId ?? polygon?.vertexIds[0] ?? null);
  viewportPickText.textContent = pick.vertexId
    ? `${pick.polygonId} / ${pick.vertexId}`
    : pick.polygonId;
  renderDocument();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    adapter.adjustZoom(event.deltaY < 0 ? 0.12 : -0.12);
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

  const polygonButton = target.closest<HTMLElement>("[data-polygon-id]");
  if (polygonButton?.dataset.polygonId) {
    selectionStore.selectPolygon(polygonButton.dataset.polygonId);
    const polygon = getPolygon(history.state, polygonButton.dataset.polygonId);
    selectionStore.selectVertex(polygon?.vertexIds[0] ?? null);
    renderDocument();
    return;
  }

  const vertexButton = target.closest<HTMLElement>("[data-vertex-id]");
  if (vertexButton?.dataset.vertexId) {
    selectionStore.selectVertex(vertexButton.dataset.vertexId);
    renderDocument();
    return;
  }

  const nudgeButton = target.closest<HTMLElement>("[data-nudge]");
  if (nudgeButton?.dataset.nudge) {
    nudgeSelectedVertex(parseNudge(nudgeButton.dataset.nudge));
    return;
  }

  if (target.closest("[data-undo]")) {
    history.undo();
    renderDocument();
    return;
  }

  if (target.closest("[data-redo]")) {
    history.redo();
    renderDocument();
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

window.addEventListener("beforeunload", () => {
  resizeObserver.disconnect();
  adapter.dispose();
});

function renderDocument(): void {
  adapter.loadDocument(history.state);
  adapter.selectPolygon(selectionStore.current.polygonId);
  renderSceneTree(history.state);
  renderVertexList(history.state);
  renderSelectedVertex(history.state);
  updateCompatibilityStatus(validateMeshDocumentForGaneshaDx(history.state));
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
    adapter.adjustZoom(0.2);
  } else if (action === "out") {
    adapter.adjustZoom(-0.2);
  } else if (action === "reset") {
    adapter.setZoom(1);
  }
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
      const selected = selectionStore.current.vertexId === vertexId;
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
  selectedVertexText.textContent = selectedVertex
    ? `${selectedVertex.id}: ${selectedVertex.ganeshaDxPosition.join(", ")}`
    : "none";
}

function nudgeSelectedVertex(delta: Vec3): void {
  const vertexId = selectionStore.current.vertexId;
  if (!vertexId) {
    return;
  }

  const nextDocument = nudgeVertexPosition(history.state, vertexId, delta);
  const sanitized = sanitizeMeshDocumentForGaneshaDx(nextDocument);
  history.execute(sanitized.document);
  renderDocument();
}

function selectInitialPolygon(): void {
  const firstPolygon = loadedDocument.sections[0]?.polygons[0];
  selectionStore.selectPolygon(firstPolygon?.id ?? null);
  selectionStore.selectVertex(firstPolygon?.vertexIds[0] ?? null);
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
  const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = documentElement("a");
  link.href = url;
  link.download = `${document.id}.mesh.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseNudge(value: string): Vec3 {
  const parts = value.split(",").map((part) => Number(part));
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
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
