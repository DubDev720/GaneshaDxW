import * as THREE from "three";
import type { MapPolygon } from "../domain/mapDocument";

const palettePreviewColors = [0x9bbcff, 0xffbd72, 0x8ee6a5, 0xd8a5ff];

export class MaterialResolver {
  private readonly materials = new Map<string, THREE.Material>();

  resolvePolygonMaterial(polygon: MapPolygon): THREE.Material {
    if (!polygon.isTextured) {
      return this.getMaterial("perimeter", () =>
        new THREE.MeshBasicMaterial({
          color: 0x050505,
          side: THREE.DoubleSide,
        }),
      );
    }

    const paletteIndex = polygon.paletteId ?? 0;
    const color = palettePreviewColors[paletteIndex % palettePreviewColors.length];
    return this.getMaterial(`palette-${paletteIndex}`, () =>
      new THREE.MeshLambertMaterial({
        color,
        side: THREE.DoubleSide,
      }),
    );
  }

  resolveSelectionMaterial(): THREE.Material {
    return this.getMaterial("selection", () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    );
  }

  dispose(): void {
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
}
