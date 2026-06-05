import * as THREE from "three";
import type { MapPolygon } from "../domain/mapDocument";
import type { RenderResourceBundle } from "../domain/renderResources";
import { TexturePaletteRegistry } from "./texturePaletteRegistry";
import type { RendererDisplayMode, TextureResourceStatus } from "./types";

export class MaterialResolver {
  private readonly materials = new Map<string, THREE.Material>();
  private readonly texturePaletteRegistry = new TexturePaletteRegistry();
  private uvDebugTexture: THREE.Texture | null = null;
  private displayMode: RendererDisplayMode = "textured";

  setRenderResources(resources: RenderResourceBundle | undefined): void {
    this.disposeMaterials();
    this.texturePaletteRegistry.setResources(resources);
  }

  setDisplayMode(mode: RendererDisplayMode): void {
    if (this.displayMode === mode) {
      return;
    }

    this.displayMode = mode;
    this.disposeMaterials();
  }

  getTextureResourceStatus(): TextureResourceStatus {
    return this.texturePaletteRegistry.getStatus();
  }

  resolvePolygonMaterial(polygon: MapPolygon): THREE.Material {
    if (this.displayMode === "wireframe") {
      return this.getMaterial(`wireframe-${polygon.sectionId}-${polygon.isTextured}`, () =>
        new THREE.MeshBasicMaterial({
          color: polygon.isTextured ? 0xdcecff : 0x737f8f,
          side: THREE.FrontSide,
          wireframe: true,
        }),
      );
    }

    if (this.displayMode === "solid") {
      return this.getMaterial(`solid-${polygon.sectionId}-${polygon.isTextured}`, () =>
        new THREE.MeshBasicMaterial({
          color: this.solidColorFor(polygon),
          side: THREE.FrontSide,
        }),
      );
    }

    if (this.displayMode === "uv-debug" && polygon.isTextured) {
      return this.getMaterial("uv-debug", () =>
        new THREE.MeshBasicMaterial({
          map: this.resolveUvDebugTexture(),
          side: THREE.FrontSide,
        }),
      );
    }

    if (!polygon.isTextured) {
      return this.getMaterial("perimeter", () =>
        new THREE.MeshBasicMaterial({
          color: 0x08090b,
          side: THREE.FrontSide,
        }),
      );
    }

    return this.getMaterial(this.texturePaletteRegistry.materialKeyFor(polygon), () =>
      new THREE.MeshBasicMaterial({
        map: this.texturePaletteRegistry.resolveTexture(polygon),
        alphaTest: 0.5,
        side: THREE.FrontSide,
      }),
    );
  }

  resolveSelectionMaterial(): THREE.Material {
    return this.getMaterial("selection", () =>
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        depthTest: false,
      }),
    );
  }

  dispose(): void {
    this.disposeMaterials();
    this.disposeUvDebugTexture();
    this.texturePaletteRegistry.dispose();
  }

  private disposeMaterials(): void {
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
  }

  private getMaterial(key: string, factory: () => THREE.Material): THREE.Material {
    const existing = this.materials.get(key);
    if (existing) {
      return existing;
    }

    const material = factory();
    this.materials.set(key, material);
    return material;
  }

  private resolveUvDebugTexture(): THREE.Texture {
    if (this.uvDebugTexture) {
      return this.uvDebugTexture;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create UV debug canvas context");
    }

    for (let page = 0; page < 4; page += 1) {
      const pageY = page * 256;
      const image = context.createImageData(256, 256);
      for (let y = 0; y < 256; y += 1) {
        for (let x = 0; x < 256; x += 1) {
          const index = (y * 256 + x) * 4;
          const grid = x % 16 === 0 || y % 16 === 0;
          image.data[index] = grid ? 255 : x;
          image.data[index + 1] = grid ? 255 : y;
          image.data[index + 2] = grid ? 255 : 64 + page * 48;
          image.data[index + 3] = 255;
        }
      }
      context.putImageData(image, 0, pageY);

      context.fillStyle = "rgba(0, 0, 0, 0.72)";
      context.fillRect(0, pageY, 256, 20);
      context.fillStyle = "#ffffff";
      context.font = "bold 12px sans-serif";
      context.textBaseline = "middle";
      context.fillText(`PAGE ${page}  U-> red  V-> green`, 8, pageY + 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = false;
    texture.needsUpdate = true;
    this.uvDebugTexture = texture;
    return texture;
  }

  private disposeUvDebugTexture(): void {
    this.uvDebugTexture?.dispose();
    this.uvDebugTexture = null;
  }

  private solidColorFor(polygon: MapPolygon): number {
    if (!polygon.isTextured) {
      return 0x141922;
    }

    const colors = [0x7fb3ff, 0xffc56e, 0x8ee6a5, 0xd2a6ff, 0xf48fb1, 0x80cbc4];
    let hash = 0;
    for (const character of polygon.sectionId) {
      hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }
    return colors[hash % colors.length] ?? 0xdcecff;
  }
}
