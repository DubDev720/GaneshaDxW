# Source Profile: `Resources/ResourceContent/MeshResourceData.cs`

## Declared types

- `13` — `public class MeshResourceData`

## Method-like signatures

- `111` — `public MeshResourceData(`
- `129` — `public void SetUpPolyContainers(`
- `141` — `private void ProcessMeshes(`
- `199` — `throw new ArgumentOutOfRangeException(`
- `212` — `private void ProcessMeshPolyCounts(`
- `252` — `private void ProcessMeshBuildPolygons(`
- `286` — `private void ProcessMeshPositionData(`
- `321` — `private void ProcessMeshPositionDataPerPoly(`
- `350` — `private void ProcessMeshNormalData(`
- `364` — `private void ProcessMeshNormalDataPerPoly(`
- `393` — `private void ProcessMeshTextureData(`
- `407` — `private void ProcessMeshTextureDataPerPoly(`
- `451` — `private void ProcessUnknownPolygonData(`
- `469` — `private void ProcessTerrainBinding(`
- `481` — `private void ProcessTerrainBindingPerPoly(`
- `491` — `private void ProcessUnknownPostPolygonData(`
- `510` — `private void ProcessTexturePalettes(`
- `550` — `private void ProcessLightingAndBackground(`
- `570` — `private void ProcessDirectionalLights(`
- `648` — `private void ProcessAmbientLight(`
- `659` — `private void ProcessBackgroundColors(`
- `672` — `private void ProcessUnknownPostBackgroundColorsData(`
- `692` — `private void ProcessTerrain(`
- `826` — `private void ProcessUnknownPostTerrainData(`
- `845` — `private void ProcessTextureAnimations(`
- `869` — `private void ProcessPaletteAnimationFrames(`
- `909` — `private void ProcessGrayscalePalette(`
- `924` — `private void ProcessMeshAnimationInstructions(`
- `953` — `private void ProcessPolygonRenderProperties(`
- `1035` — `public void RebuildRawData(`
- `1050` — `private void BuildRawDataHeader(`
- `1056` — `private void BuildRawDataPrimaryMesh(`
- `1075` — `private void BuildRawDataMeshHeader(`
- `1104` — `private void BuildRawDataMeshPosition(`
- `1182` — `private void BuildRawDataMeshNormals(`
- `1232` — `private void BuildRawDataMeshTextureProperties(`
- `1270` — `private void BuildRawDataMeshUnknownData(`
- `1286` — `private void BuildRawDataMeshTerrainDefinitions(`
- `1305` — `private void BuildRawPostPolygonBlock(`
- `1312` — `private void BuildRawDataTexturePalettes(`
- `1327` — `private void BuildRawDataLightsAndBackground(`
- `1343` — `private void BuildRawDataDirectionalLights(`
- `1403` — `private void BuildRawDataAmbientLight(`
- `1409` — `private void BuildRawDataBackgroundColors(`
- `1418` — `private void BuildRawPostBackgroundBlock(`
- `1426` — `private void BuildRawDataTerrain(`
- `1441` — `private void BuildRawPostTerrainBlock(`
- `1448` — `private void BuildRawDataTextureAnimations(`
- `1463` — `private void BuildRawDataPaletteAnimationFrames(`
- `1478` — `private void BuildRawDataGrayscalePalettes(`
- `1508` — `private void BuildRawDataAnimatedMeshInstructions(`
- `1539` — `private void BuildRawDataAnimatedMeshes(`
- `1573` — `private void BuildRawDataRenderProperties(`

## High-value excerpts

```csharp
59: 	private readonly Dictionary<MeshType, int> _unTexturedTriangleCount = new();
60: 	private readonly Dictionary<MeshType, int> _unTexturedQuadCount = new();
61: 
62: 	public readonly Dictionary<MeshType, Dictionary<PolygonType, List<Polygon>>> PolygonCollection = new();
63: 
64: 	public List<DirectionalLight> DirectionalLights;
65: 	public Color BackgroundTopColor;

...

93: 		{ MeshType.AnimatedMesh8, new List<byte> { 0, 0 } }
94: 	};
95: 
96: 	public List<Palette> Palettes = new();
97: 	public List<Palette> PaletteAnimationFrames = new();
98: 
99: 	public List<AnimatedTextureInstructions> AnimatedTextureInstructions = new();

...

94: 	};
95: 
96: 	public List<Palette> Palettes = new();
97: 	public List<Palette> PaletteAnimationFrames = new();
98: 
99: 	public List<AnimatedTextureInstructions> AnimatedTextureInstructions = new();
100: 

...

128: 	}
129: 
130: 	public void SetUpPolyContainers() {
131: 		PolygonCollection.Clear();
132: 
133: 		foreach (MeshType meshType in CommonLists.MeshTypes) {
134: 			PolygonCollection.Add(meshType, new Dictionary<PolygonType, List<Polygon>>());

...

131: 		PolygonCollection.Clear();
132: 
133: 		foreach (MeshType meshType in CommonLists.MeshTypes) {
134: 			PolygonCollection.Add(meshType, new Dictionary<PolygonType, List<Polygon>>());
135: 
136: 			foreach (PolygonType polygonType in CommonLists.PolygonTypes) {
137: 				PolygonCollection[meshType].Add(polygonType, new List<Polygon>());

...

134: 			PolygonCollection.Add(meshType, new Dictionary<PolygonType, List<Polygon>>());
135: 
136: 			foreach (PolygonType polygonType in CommonLists.PolygonTypes) {
137: 				PolygonCollection[meshType].Add(polygonType, new List<Polygon>());
138: 			}
139: 		}
140: 	}

...

256: 				PolygonType = PolygonType.TexturedTriangle,
257: 				MeshType = meshType
258: 			};
259: 			PolygonCollection[meshType][PolygonType.TexturedTriangle].Add(polygon);
260: 		}
261: 
262: 		for (int i = 0; i < _unTexturedTriangleCount[meshType]; i++) {

...

264: 				PolygonType = PolygonType.UntexturedTriangle,
265: 				MeshType = meshType
266: 			};
267: 			PolygonCollection[meshType][PolygonType.UntexturedTriangle].Add(polygon);
268: 		}
269: 
270: 		for (int i = 0; i < _texturedQuadCount[meshType]; i++) {

...

272: 				PolygonType = PolygonType.TexturedQuad,
273: 				MeshType = meshType
274: 			};
275: 			PolygonCollection[meshType][PolygonType.TexturedQuad].Add(polygon);
276: 		}
277: 
278: 		for (int i = 0; i < _unTexturedQuadCount[meshType]; i++) {

...

280: 				PolygonType = PolygonType.UntexturedQuad,
281: 				MeshType = meshType
282: 			};
283: 			PolygonCollection[meshType][PolygonType.UntexturedQuad].Add(polygon);
284: 		}
285: 	}
286: 

...

296: 
297: 		ProcessMeshPositionDataPerPoly(
298: 			_texturedTriangleCount[meshType],
299: 			PolygonCollection[meshType][PolygonType.TexturedTriangle],
300: 			3
301: 		);
302: 

...

302: 
303: 		ProcessMeshPositionDataPerPoly(
304: 			_texturedQuadCount[meshType],
305: 			PolygonCollection[meshType][PolygonType.TexturedQuad],
306: 			4
307: 		);
308: 

...

308: 
309: 		ProcessMeshPositionDataPerPoly(
310: 			_unTexturedTriangleCount[meshType],
311: 			PolygonCollection[meshType][PolygonType.UntexturedTriangle],
312: 			3
313: 		);
314: 

...

314: 
315: 		ProcessMeshPositionDataPerPoly(
316: 			_unTexturedQuadCount[meshType],
317: 			PolygonCollection[meshType][PolygonType.UntexturedQuad],
318: 			4
319: 		);
320: 	}

...

351: 	private void ProcessMeshNormalData(MeshType meshType) {
352: 		ProcessMeshNormalDataPerPoly(
353: 			_texturedTriangleCount[meshType],
354: 			PolygonCollection[meshType][PolygonType.TexturedTriangle],
355: 			3
356: 		);
357: 

...

357: 
358: 		ProcessMeshNormalDataPerPoly(
359: 			_texturedQuadCount[meshType],
360: 			PolygonCollection[meshType][PolygonType.TexturedQuad],
361: 			4
362: 		);
363: 	}
```