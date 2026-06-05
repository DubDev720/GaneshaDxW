import type { MapPolygon, MeshDocument } from "../src/domain/mapDocument";
import type {
  BaseTexturesJson,
  PaletteMasterJson,
  TextureMappingJson,
  TextureMappingJsonRecord,
} from "../src/domain/renderResources";

const atlasWidth = 256;
const atlasHeight = 1024;
const targetMapId = Bun.argv[2] ?? "MAP001";
const mapDirectory = new URL(`../public/reports/gmapx-consolidated/${targetMapId}/`, import.meta.url);
const paletteFile = new URL("../public/reports/gmapx-consolidated/palettes.master.json", import.meta.url);
const meshFile = new URL("mesh.json", mapDirectory);
const baseTexturesFile = new URL("base-textures.json", mapDirectory);
const textureMappingFile = new URL("texture-mapping.json", mapDirectory);

const mesh = await Bun.file(meshFile).json() as MeshDocument;
const paletteMaster = await Bun.file(paletteFile).json() as PaletteMasterJson;
const paletteRefs = paletteMaster.palettes
  ?.map((palette, paletteIndex) => palette.paletteRef ?? `palette-${paletteIndex}`) ?? [];
const textureRows = generateIndexedRows(texturedPolygons(mesh));
const generatedTextureId = `${mesh.id}-generated-indexed-atlas`;

const baseTextures: BaseTexturesJson = {
  schema: "ganesha-dxw.base-textures.v1",
  mapId: mesh.id,
  textures: [
    {
      textureId: generatedTextureId,
      sourceKind: "generated-debug-indexed-atlas",
      generatedFrom: "mesh-texture-fields",
      format: {
        width: atlasWidth,
        height: atlasHeight,
        bitsPerPixel: 4,
        pixelsPerByte: 2,
        byteOrder: "low-nibble-first",
      },
      decoded: {
        indexedPixelRowsHex: textureRows,
      },
    },
  ],
};

const textureMapping: TextureMappingJson = {
  schema: "ganesha-dxw.texture-mapping.v1",
  mapId: mesh.id,
  mappings: texturedPolygons(mesh).map((polygon): TextureMappingJsonRecord => ({
    polygonId: polygon.id,
    meshId: polygon.id,
    sectionId: polygon.sectionId,
    textureId: generatedTextureId,
    paletteRefs,
    generatedFrom: "mesh-texture-fields",
  })),
};

await Bun.write(baseTexturesFile, `${JSON.stringify(baseTextures, null, 2)}\n`);
await Bun.write(textureMappingFile, `${JSON.stringify(textureMapping, null, 2)}\n`);

console.log(
  `Generated ${baseTextures.textures?.length ?? 0} indexed atlas and ${textureMapping.mappings?.length ?? 0} texture mappings for ${mesh.id}`,
);

function texturedPolygons(document: MeshDocument): MapPolygon[] {
  return document.sections
    .flatMap((section) => section.polygons)
    .filter((polygon) => polygon.isTextured && polygon.uv?.length);
}

function generateIndexedRows(polygons: readonly MapPolygon[]): string[] {
  const indices = new Uint8Array(atlasWidth * atlasHeight);
  for (let y = 0; y < atlasHeight; y += 1) {
    for (let x = 0; x < atlasWidth; x += 1) {
      const guideLine = x % 32 === 0 || y % 32 === 0;
      const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
      indices[y * atlasWidth + x] = guideLine ? 2 : checker + 1;
    }
  }

  for (const polygon of polygons) {
    const bounds = uvBounds(polygon);
    if (!bounds) {
      continue;
    }

    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
        const localX = x - bounds.minX;
        const localY = y - bounds.minY;
        const edge = x === bounds.minX ||
          x === bounds.maxX ||
          y === bounds.minY ||
          y === bounds.maxY;
        const checker = (Math.floor(localX / 4) + Math.floor(localY / 4)) % 2;
        indices[y * atlasWidth + x] = edge ? 2 : checker + 1;
      }
    }
  }

  return Array.from({ length: atlasHeight }, (_, y) => {
    let row = "";
    for (let x = 0; x < atlasWidth; x += 1) {
      row += indices[y * atlasWidth + x].toString(16);
    }
    return row;
  });
}

function uvBounds(polygon: MapPolygon): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} | null {
  const uv = polygon.uv;
  if (!uv?.length) {
    return null;
  }

  const texturePage = polygon.texturePage ?? 0;
  const pageY = texturePage * atlasWidth;
  const xs = uv.map(([x]) => clampInteger(x, 0, atlasWidth - 1));
  const ys = uv.map(([, y]) => clampInteger(y + pageY, 0, atlasHeight - 1));
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}
