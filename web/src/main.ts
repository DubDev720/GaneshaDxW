import "./styles.css";
import { sampleMapDocument } from "./domain/sampleMapDocument";
import { createThreeRenderer } from "./renderer/createThreeRenderer";
import { GaneshaThreeRendererAdapter } from "./renderer/GaneshaThreeRendererAdapter";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="app-shell">
    <section class="viewport-panel" aria-label="Map renderer">
      <canvas class="renderer-canvas" aria-label="GaneshaDXW WebGPU renderer"></canvas>
      <div class="status-bar">
        <span class="status-label">Renderer</span>
        <strong id="backend-status">Starting</strong>
      </div>
    </section>
    <aside class="inspector" aria-label="Renderer controls">
      <div>
        <h1>GaneshaDXW Web Renderer</h1>
        <p>
          Vite, TypeScript, Three.js, WebGPURenderer, and WebGL2 fallback are
          wired through a renderer adapter.
        </p>
      </div>
      <div class="control-group">
        <h2>Selection</h2>
        <button class="control-button" data-polygon-id="poly-0">Select NW quad</button>
        <button class="control-button" data-polygon-id="poly-1">Select NE quad</button>
        <button class="control-button" data-polygon-id="poly-2">Select SW quad</button>
        <button class="control-button" data-polygon-id="poly-3">Select SE quad</button>
        <button class="control-button secondary" data-clear-selection>Clear selection</button>
      </div>
      <div class="control-group">
        <h2>Vertex Edit</h2>
        <button class="control-button" data-move-vertex>Move center vertex</button>
        <button class="control-button secondary" data-reset-document>Reset document</button>
      </div>
      <dl class="facts">
        <div>
          <dt>Input path</dt>
          <dd>consolidated JSON document</dd>
        </div>
        <div>
          <dt>Renderer boundary</dt>
          <dd>adapter consumes document state</dd>
        </div>
        <div>
          <dt>First target</dt>
          <dd>editable visual mesh</dd>
        </div>
      </dl>
    </aside>
  </main>
`;

const canvas = app.querySelector<HTMLCanvasElement>(".renderer-canvas");
const viewportPanel = app.querySelector<HTMLElement>(".viewport-panel");
const statusText = app.querySelector<HTMLElement>("#backend-status");

if (!canvas || !viewportPanel || !statusText) {
  throw new Error("Renderer shell did not mount");
}

const { renderer, status } = await createThreeRenderer(canvas);
const adapter = new GaneshaThreeRendererAdapter(renderer, status);
let centerVertexRaised = false;

statusText.textContent = `${adapter.status.backend.toUpperCase()} - ${adapter.status.reason}`;
adapter.loadDocument(sampleMapDocument);
adapter.selectPolygon("poly-0");
adapter.start();

const resizeObserver = new ResizeObserver(([entry]) => {
  if (!entry) {
    return;
  }

  const { width, height } = entry.contentRect;
  adapter.resize(width, height);
});

resizeObserver.observe(viewportPanel);

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const polygonButton = target.closest<HTMLElement>("[data-polygon-id]");
  if (polygonButton?.dataset.polygonId) {
    adapter.selectPolygon(polygonButton.dataset.polygonId);
    return;
  }

  if (target.closest("[data-clear-selection]")) {
    adapter.selectPolygon(null);
    return;
  }

  if (target.closest("[data-move-vertex]")) {
    centerVertexRaised = !centerVertexRaised;
    adapter.updateVertexPosition("v4", [0, centerVertexRaised ? 1.05 : 0.35, 0]);
    return;
  }

  if (target.closest("[data-reset-document]")) {
    centerVertexRaised = false;
    adapter.loadDocument(sampleMapDocument);
    adapter.selectPolygon("poly-0");
  }
});

window.addEventListener("beforeunload", () => {
  resizeObserver.disconnect();
  adapter.dispose();
});
