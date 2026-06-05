import type { PaletteMasterJson } from "../src/domain/renderResources";
import { mkdir, readdir } from "node:fs/promises";

interface TextureMappingImport {
  mapId?: string;
  meshMappings?: readonly MeshMappingImport[];
}

interface MeshMappingImport {
  paletteResource?: string;
  palettes?: {
    main?: readonly PaletteMappingRef[];
    animationFrames?: readonly PaletteMappingRef[];
  };
}

interface PaletteMappingRef {
  paletteIndex?: number;
  paletteRef?: string;
}

interface DecodedPaletteResource {
  mainPalettes?: {
    palettes?: readonly DecodedPalette[];
  };
  paletteAnimationFrames?: {
    palettes?: readonly DecodedPalette[];
  };
}

interface DecodedPalette {
  paletteIndex?: number;
  colors?: readonly DecodedPaletteColor[];
}

interface DecodedPaletteColor {
  red5?: number;
  green5?: number;
  blue5?: number;
}

interface DecodedMeshResource {
  sortedResourceIndex?: number;
  resourceType?: string;
  state?: {
    arrangement?: string;
    time?: string;
    weather?: string;
  };
  xFile?: number;
  meshes?: readonly DecodedMeshSection[];
}

interface DecodedMeshSection {
  meshType?: string;
  counts?: Record<string, number>;
}

const mapId = Bun.argv[2] ?? "MAP001";
const sourceMapDirectory = new URL(`../MAP-001-003/${mapId}/`, import.meta.url);
const targetCollectionDirectory = new URL("../public/reports/gmapx-consolidated/", import.meta.url);
const targetMapDirectory = new URL(`${mapId}/`, targetCollectionDirectory);
const gmapxDirectory = new URL(`../../Web-Migration/${mapId}.gmapx/`, import.meta.url);
const decodedMeshesDirectory = new URL("decoded/meshes/", gmapxDirectory);
const filesToCopy = ["base-textures.json", "texture-mapping.json", "metadata.json"];

await ensureDirectory(targetMapDirectory);
for (const fileName of filesToCopy) {
  await Bun.write(
    new URL(fileName, targetMapDirectory),
    await Bun.file(new URL(fileName, sourceMapDirectory)).text(),
  );
}

await Bun.write(
  new URL("mesh.json", targetMapDirectory),
  `${JSON.stringify(await buildCompleteMeshJson(), null, 2)}\n`,
);

const textureMapping = await Bun.file(
  new URL("texture-mapping.json", sourceMapDirectory),
).json() as TextureMappingImport;
const paletteMaster = await buildPaletteMaster(textureMapping);

await Bun.write(
  new URL("palettes.master.json", targetCollectionDirectory),
  `${JSON.stringify(paletteMaster, null, 2)}\n`,
);
await Bun.write(
  new URL("index.json", targetCollectionDirectory),
  `${JSON.stringify({
    maps: [
      {
        mapId,
        path: mapId,
        label: `${mapId} complete consolidated fixture`,
      },
    ],
  }, null, 2)}\n`,
);

console.log(
  `Imported ${mapId}: complete mesh package, ${filesToCopy.length} resource files, and ${paletteMaster.palettes?.length ?? 0} palettes`,
);

async function buildCompleteMeshJson(): Promise<unknown> {
  const meshFiles = (await readdir(decodedMeshesDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  const meshResources = await Promise.all(
    meshFiles.map(async (fileName) => ({
      fileName,
      resource: await Bun.file(new URL(fileName, decodedMeshesDirectory)).json() as DecodedMeshResource,
    })),
  );
  meshResources.sort(
    (left, right) =>
      (left.resource.sortedResourceIndex ?? Number.MAX_SAFE_INTEGER) -
      (right.resource.sortedResourceIndex ?? Number.MAX_SAFE_INTEGER),
  );

  const meshDefinitions = [];
  const meshUses = [];
  for (const { fileName, resource } of meshResources) {
    for (const mesh of resource.meshes ?? []) {
      const meshType = mesh.meshType ?? "Mesh";
      const meshRef = `${mapId.toLowerCase()}-x${resource.xFile ?? "unknown"}-${meshType}`;
      meshDefinitions.push({
        meshRef,
        canonicalSource: `${mapId}.gmapx/decoded/meshes/${fileName}#${meshType}`,
        data: mesh,
      });
      meshUses.push({
        meshResource: `decoded/meshes/${fileName}`,
        meshType,
        meshRef,
        counts: mesh.counts,
        resourceType: resource.resourceType,
        state: resource.state,
        xFile: resource.xFile,
        sortedResourceIndex: resource.sortedResourceIndex,
      });
    }
  }

  return {
    format: "ganesha-map-editable-meshes",
    version: 1,
    mapId,
    meshDefinitions,
    meshUses,
    editModel: {
      vertexEditing: "Use ganeshaDxPosition as the current editable viewport position.",
      uvEditing: "Use texture.uvCoordinates as page-local source UVs.",
      quads: "Preserve source quads; triangulate only at renderer buffer build time.",
      perimeter: "Untextured perimeter polygons are preserved and rendered flat black.",
    },
  };
}

async function buildPaletteMaster(
  textureMappingJson: TextureMappingImport,
): Promise<PaletteMasterJson> {
  const palettesByRef = new Map<string, { paletteRef: string; colors: string[] }>();

  for (const meshMapping of textureMappingJson.meshMappings ?? []) {
    if (!meshMapping.paletteResource) {
      continue;
    }

    const decodedPalette = await readDecodedPalette(meshMapping.paletteResource);
    addMappedPalettes(palettesByRef, meshMapping.palettes?.main, decodedPalette.mainPalettes?.palettes);
    addMappedPalettes(
      palettesByRef,
      meshMapping.palettes?.animationFrames,
      decodedPalette.paletteAnimationFrames?.palettes,
    );
  }

  return {
    schema: "ganesha-dxw.palette-master.v1",
    palettes: [...palettesByRef.values()],
  };
}

async function readDecodedPalette(relativePath: string): Promise<DecodedPaletteResource> {
  return Bun.file(new URL(relativePath, gmapxDirectory)).json() as Promise<DecodedPaletteResource>;
}

function addMappedPalettes(
  palettesByRef: Map<string, { paletteRef: string; colors: string[] }>,
  refs: readonly PaletteMappingRef[] | undefined,
  decodedPalettes: readonly DecodedPalette[] | undefined,
): void {
  if (!refs?.length || !decodedPalettes?.length) {
    return;
  }

  for (const ref of refs) {
    if (!ref.paletteRef || ref.paletteIndex === undefined || palettesByRef.has(ref.paletteRef)) {
      continue;
    }

    const decodedPalette = decodedPalettes.find(
      (candidate) => candidate.paletteIndex === ref.paletteIndex,
    );
    if (!decodedPalette?.colors?.length) {
      continue;
    }

    palettesByRef.set(ref.paletteRef, {
      paletteRef: ref.paletteRef,
      colors: decodedPalette.colors.map((color) => rgb555ToHex(color)),
    });
  }
}

function rgb555ToHex(color: DecodedPaletteColor): string {
  const red = colorChannel5ToHex(color.red5 ?? 0);
  const green = colorChannel5ToHex(color.green5 ?? 0);
  const blue = colorChannel5ToHex(color.blue5 ?? 0);
  return `#${red}${green}${blue}`;
}

function colorChannel5ToHex(channel: number): string {
  return Math.round(channel * 255 / 31)
    .toString(16)
    .padStart(2, "0");
}

async function ensureDirectory(directory: URL): Promise<void> {
  await mkdir(directory, { recursive: true });
}
