import * as THREE from "three";
import WebGPU from "three/addons/capabilities/WebGPU.js";
import { WebGPURenderer } from "three/webgpu";
import type { RendererAdapterStatus } from "./types";

interface ThreeRendererSurface {
  renderer: THREE.WebGLRenderer | WebGPURenderer;
  status: RendererAdapterStatus;
}

export async function createThreeRenderer(
  canvas: HTMLCanvasElement,
): Promise<ThreeRendererSurface> {
  if (WebGPU.isAvailable()) {
    const renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
      forceWebGL: false,
    });

    await renderer.init();
    return {
      renderer,
      status: {
        backend: "webgpu",
        reason: "WebGPU adapter available",
      },
    };
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  return {
    renderer,
    status: {
      backend: "webgl2",
      reason: "WebGPU unavailable; using WebGL2 renderer",
    },
  };
}
