export interface PaletteMasterJson {
  schema?: string;
  palettes?: readonly PaletteJson[];
}

export interface PaletteJson {
  paletteRef?: string;
  colors?: readonly string[];
}

export interface BaseTexturesJson {
  schema?: string;
  mapId?: string;
  textures?: readonly IndexedTextureJson[];
  aliases?: Record<string, string>;
  fallbackTextureId?: string;
}

export interface IndexedTextureJson {
  id?: string;
  textureId?: string;
  textureRef?: string;
  sourceSha256?: string;
  sourceKind?: string;
  generatedFrom?: string;
  format?: {
    width?: number;
    height?: number;
    bitsPerPixel?: number;
    pixelsPerByte?: number;
    byteOrder?: string;
  };
  width?: number;
  height?: number;
  decoded?: {
    indexedPixelRowsHex?: readonly string[];
  };
  indexedPixelRowsHex?: readonly string[];
}

export interface TextureMappingJson {
  schema?: string;
  mapId?: string;
  mappings?: readonly TextureMappingJsonRecord[];
  meshMappings?: readonly MeshTextureMappingJsonRecord[];
}

export interface TextureMappingJsonRecord {
  polygonId?: string;
  meshId?: string;
  sectionId?: string;
  textureId?: string;
  textureRef?: string;
  paletteRefs?: readonly string[];
  generatedFrom?: string;
}

export interface MeshTextureMappingJsonRecord {
  meshResource?: string;
  stateTexture?: {
    textureId?: string;
    canonicalXFile?: number;
    xFile?: number;
  };
  palettes?: {
    main?: readonly {
      paletteIndex?: number;
      paletteRef?: string;
    }[];
  };
  meshSectionRefs?: readonly {
    meshResource?: string;
    meshRef?: string;
    meshType?: string;
  }[];
}

export interface RenderResourceBundle {
  palettes: PaletteMasterJson;
  baseTextures: BaseTexturesJson;
  textureMapping: TextureMappingJson;
}
