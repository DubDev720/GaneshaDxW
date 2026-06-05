import * as THREE from "three";
import type { MapPolygon } from "../domain/mapDocument";
import type {
  IndexedTextureJson,
  MeshTextureMappingJsonRecord,
  PaletteJson,
  RenderResourceBundle,
  TextureMappingJsonRecord,
} from "../domain/renderResources";
import type { TextureResourceStatus } from "./types";

type Rgba = readonly [number, number, number, number];

interface PaletteData {
  readonly key: string;
  readonly colors: readonly Rgba[];
}

interface IndexedTextureData {
  readonly key: string;
  readonly width: number;
  readonly height: number;
  readonly indices: Uint8Array;
  readonly isFallback: boolean;
}

const defaultPalettes: readonly PaletteJson[] = [
  { paletteRef: "default-blue", colors: ["#000000", "#9bbcff", "#ffffff"] },
  { paletteRef: "default-gold", colors: ["#000000", "#ffbd72", "#ffffff"] },
  { paletteRef: "default-green", colors: ["#000000", "#8ee6a5", "#ffffff"] },
  { paletteRef: "default-violet", colors: ["#000000", "#d8a5ff", "#ffffff"] },
];

export class TexturePaletteRegistry {
  private palettes: PaletteData[] = this.normalizePalettes(defaultPalettes);
  private indexedTextures: IndexedTextureData[] = [this.createFallbackIndexedTexture()];
  private readonly indexedTextureByKey = new Map<string, IndexedTextureData>();
  private mappings: TextureMappingJsonRecord[] = [];
  private meshMappings: MeshTextureMappingJsonRecord[] = [];
  private readonly colorizedTextures = new Map<string, THREE.DataTexture>();

  setResources(resources: RenderResourceBundle | undefined): void {
    this.disposeColorizedTextures();
    this.palettes = this.normalizePalettes(
      resources?.palettes.palettes?.length
        ? resources.palettes.palettes
        : defaultPalettes,
    );
    this.indexedTextures = this.normalizeIndexedTextures(
      resources?.baseTextures.textures,
    );
    this.indexedTextureByKey.clear();
    for (const texture of this.indexedTextures) {
      this.indexedTextureByKey.set(texture.key, texture);
    }
    this.mappings = [...(resources?.textureMapping.mappings ?? [])];
    this.meshMappings = [...(resources?.textureMapping.meshMappings ?? [])];
  }

  getStatus(): TextureResourceStatus {
    return {
      paletteCount: this.palettes.length,
      textureCount: this.indexedTextures.filter((texture) => !texture.isFallback).length,
      mappingCount: this.mappings.length + this.meshMappings.length,
      usingFallbackTexture: this.indexedTextures.some((texture) => texture.isFallback),
    };
  }

  materialKeyFor(polygon: MapPolygon): string {
    const mapping = this.mappingFor(polygon);
    const meshMapping = this.meshMappingFor(polygon);
    const palette = this.paletteFor(polygon.paletteId ?? 0, mapping, meshMapping);
    const texture = this.textureFor(polygon, mapping, meshMapping);
    return `${texture.key}|${palette.key}|page-${polygon.texturePage ?? 0}`;
  }

  resolveTexture(polygon: MapPolygon): THREE.Texture {
    const mapping = this.mappingFor(polygon);
    const meshMapping = this.meshMappingFor(polygon);
    const palette = this.paletteFor(polygon.paletteId ?? 0, mapping, meshMapping);
    const indexedTexture = this.textureFor(polygon, mapping, meshMapping);
    const cacheKey = `${indexedTexture.key}|${palette.key}`;
    const existing = this.colorizedTextures.get(cacheKey);
    if (existing) {
      return existing;
    }

    const colorized = this.colorizeIndexedTexture(indexedTexture, palette);
    this.colorizedTextures.set(cacheKey, colorized);
    return colorized;
  }

  dispose(): void {
    this.disposeColorizedTextures();
  }

  private normalizePalettes(palettes: readonly PaletteJson[]): PaletteData[] {
    return palettes.map((palette, paletteIndex) => {
      const colors = (palette.colors?.length ? palette.colors : ["#000000"])
        .map((color) => this.parseHexColor(color));
      const paddedColors = [...colors];
      while (paddedColors.length < 16) {
        paddedColors.push(colors[colors.length - 1] ?? [0, 0, 0, 255]);
      }

      return {
        key: palette.paletteRef ?? `palette-${paletteIndex}`,
        colors: paddedColors.slice(0, 16),
      };
    });
  }

  private normalizeIndexedTextures(
    textures: readonly IndexedTextureJson[] | undefined,
  ): IndexedTextureData[] {
    if (!textures?.length) {
      return [this.createFallbackIndexedTexture()];
    }

    const normalized = textures
      .map((texture, textureIndex) => this.normalizeIndexedTexture(texture, textureIndex))
      .filter((texture): texture is IndexedTextureData => texture !== null);

    return normalized.length ? normalized : [this.createFallbackIndexedTexture()];
  }

  private normalizeIndexedTexture(
    texture: IndexedTextureJson,
    textureIndex: number,
  ): IndexedTextureData | null {
    const rows = texture.decoded?.indexedPixelRowsHex ?? texture.indexedPixelRowsHex;
    if (!rows?.length) {
      return null;
    }

    const width = texture.format?.width ?? texture.width ?? rows[0]?.length ?? 256;
    const height = texture.format?.height ?? texture.height ?? rows.length;
    const indices = new Uint8Array(width * height);

    for (let y = 0; y < height; y += 1) {
      const row = rows[y] ?? "";
      for (let x = 0; x < width; x += 1) {
        indices[y * width + x] = Number.parseInt(row[x] ?? "0", 16) & 0x0f;
      }
    }

    return {
      key:
        texture.textureId ??
        texture.textureRef ??
        texture.id ??
        texture.sourceSha256 ??
        `texture-${textureIndex}`,
      width,
      height,
      indices,
      isFallback: false,
    };
  }

  private createFallbackIndexedTexture(): IndexedTextureData {
    const width = 256;
    const height = 1024;
    const indices = new Uint8Array(width * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
        const guideLine = x % 32 === 0 || y % 32 === 0;
        indices[y * width + x] = guideLine ? 2 : checker + 1;
      }
    }

    return {
      key: "fallback-indexed-atlas",
      width,
      height,
      indices,
      isFallback: true,
    };
  }

  private paletteFor(
    paletteId: number,
    mapping: TextureMappingJsonRecord | undefined,
    meshMapping: MeshTextureMappingJsonRecord | undefined,
  ): PaletteData {
    const meshPaletteRef = meshMapping?.palettes?.main?.find(
      (palette) => palette.paletteIndex === paletteId,
    )?.paletteRef;
    if (meshPaletteRef) {
      const meshPalette = this.palettes.find((palette) => palette.key === meshPaletteRef);
      if (meshPalette) {
        return meshPalette;
      }
    }

    const mappedPaletteRef = mapping?.paletteRefs?.[paletteId % mapping.paletteRefs.length];
    if (mappedPaletteRef) {
      const mappedPalette = this.palettes.find((palette) => palette.key === mappedPaletteRef);
      if (mappedPalette) {
        return mappedPalette;
      }
    }

    return this.palettes[paletteId % this.palettes.length] ?? this.palettes[0];
  }

  private textureFor(
    polygon: MapPolygon,
    mapping: TextureMappingJsonRecord | undefined,
    meshMapping: MeshTextureMappingJsonRecord | undefined,
  ): IndexedTextureData {
    const mappedTextureKey =
      mapping?.textureId ??
      mapping?.textureRef ??
      meshMapping?.stateTexture?.textureId;
    if (mappedTextureKey) {
      const mappedTexture = this.indexedTextureByKey.get(mappedTextureKey);
      if (mappedTexture) {
        return mappedTexture;
      }
    }

    const preservedTexture = polygon.preserved?.texture;
    if (
      preservedTexture &&
      typeof preservedTexture === "object" &&
      "textureSource" in preservedTexture
    ) {
      const textureSource = String(preservedTexture.textureSource);
      const textureBySource = this.indexedTextureByKey.get(textureSource);
      if (textureBySource) {
        return textureBySource;
      }
    }

    return this.indexedTextures[0] ?? this.createFallbackIndexedTexture();
  }

  private mappingFor(polygon: MapPolygon): TextureMappingJsonRecord | undefined {
    return this.mappings.find((mapping) =>
      mapping.polygonId === polygon.id ||
      mapping.meshId === polygon.id ||
      mapping.sectionId === polygon.sectionId
    );
  }

  private meshMappingFor(polygon: MapPolygon): MeshTextureMappingJsonRecord | undefined {
    const meshResource = this.stringPreservedValue(polygon, "meshResource");
    const meshRef = this.stringPreservedValue(polygon, "meshRef");
    return this.meshMappings.find((mapping) =>
      mapping.meshSectionRefs?.some((sectionRef) =>
        (meshRef && sectionRef.meshRef === meshRef) ||
        (meshResource && sectionRef.meshResource === meshResource),
      ) ||
      (meshResource && mapping.meshResource === meshResource)
    );
  }

  private stringPreservedValue(polygon: MapPolygon, key: string): string | undefined {
    const value = polygon.preserved?.[key];
    return typeof value === "string" ? value : undefined;
  }

  private colorizeIndexedTexture(
    indexedTexture: IndexedTextureData,
    palette: PaletteData,
  ): THREE.DataTexture {
    const rgba = new Uint8Array(indexedTexture.width * indexedTexture.height * 4);

    for (let index = 0; index < indexedTexture.indices.length; index += 1) {
      const color = palette.colors[indexedTexture.indices[index] % palette.colors.length];
      rgba.set(color, index * 4);
    }

    const texture = new THREE.DataTexture(
      rgba,
      indexedTexture.width,
      indexedTexture.height,
      THREE.RGBAFormat,
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
  }

  private parseHexColor(value: string): Rgba {
    const normalized = value.trim().replace(/^#/, "");
    if (normalized.length !== 6) {
      return [0, 0, 0, 255];
    }

    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
      normalized === "000000" ? 0 : 255,
    ];
  }

  private disposeColorizedTextures(): void {
    for (const texture of this.colorizedTextures.values()) {
      texture.dispose();
    }
    this.colorizedTextures.clear();
  }
}
