# Source Profile: `Resources/ContentDataTypes/MapStateData.cs`

## Declared types

- `14` — `public class MapStateData`

## Method-like signatures

- `175` — `public void SetStateResources(`

## High-value excerpts

```csharp
22: 
23: 	public bool HasPolygonRenderingProperties => _primaryMeshSource is { HasPolygonRenderProperties: true };
24: 		
25: 	public Dictionary<MeshType, Dictionary<PolygonType, List<Polygon>>> PolygonCollection =>
26: 		_primaryMeshSource?.PolygonCollection;
27: 
28: 	public Dictionary<MeshType, bool> UsesEndOfPolygonPadding => _primaryMeshSource?.UsesEndOfPolygonPadding;

...

23: 	public bool HasPolygonRenderingProperties => _primaryMeshSource is { HasPolygonRenderProperties: true };
24: 		
25: 	public Dictionary<MeshType, Dictionary<PolygonType, List<Polygon>>> PolygonCollection =>
26: 		_primaryMeshSource?.PolygonCollection;
27: 
28: 	public Dictionary<MeshType, bool> UsesEndOfPolygonPadding => _primaryMeshSource?.UsesEndOfPolygonPadding;
29: 

...

56: 			List<Polygon> polygonCollectionBucket = new();
57: 			foreach (MeshType meshType in CommonLists.MeshTypes) {
58: 				foreach (PolygonType polygonType in CommonLists.PolygonTypes) {
59: 					polygonCollectionBucket.AddRange(PolygonCollection[meshType][polygonType]);
60: 				}
61: 			}
62: 

...

81: 	private MeshResourceData _textureAnimationSource;
82: 	private MeshResourceData _animatedPaletteFramesSource;
83: 
84: 	public Texture2D Texture;
85: 
86: 	public Color BackgroundTopColor {
87: 		get => _lightingAndBackgroundSource?.BackgroundTopColor ?? Color.DeepPink;

...

119: 		}
120: 	}
121: 
122: 	public List<Palette> Palettes {
123: 		get => _paletteSource?.Palettes;
124: 		set {
125: 			if (_paletteSource.Palettes != null) {

...

128: 		}
129: 	}
130: 
131: 	public List<Palette> PaletteAnimationFrames {
132: 		get => _animatedPaletteFramesSource?.PaletteAnimationFrames;
133: 		set {
134: 			if (_animatedPaletteFramesSource != null) {

...

181: 		StateMeshResources = stateMeshResources;
182: 		StateTextureResource = stateTextureResource;
183: 
184: 		//Texture
185: 		TextureResourceData textureResourceData = (TextureResourceData) stateTextureResource.ResourceData;
186: 		Texture = textureResourceData.Texture;
187: 

...

183: 
184: 		//Texture
185: 		TextureResourceData textureResourceData = (TextureResourceData) stateTextureResource.ResourceData;
186: 		Texture = textureResourceData.Texture;
187: 
188: 		//Primary Mesh Source
189: 		foreach (MapResource mapResource in stateMeshResources) {

...

222: 			}
223: 		}
224: 
225: 		// Palette Source
226: 		foreach (MapResource mapResource in stateMeshResources) {
227: 			MeshResourceData resourceData = (MeshResourceData) mapResource.ResourceData;
228: 			if (resourceData.HasPalettes) {

...

241: 			}
242: 		}
243: 
244: 		// Grayscale Palette Source
245: 		foreach (MapResource mapResource in stateMeshResources) {
246: 			MeshResourceData resourceData = (MeshResourceData) mapResource.ResourceData;
247: 			if (resourceData.HasGrayscalePalettes) {

...

279: 			}
280: 		}
281: 
282: 		// Texture Animation Source
283: 		foreach (MapResource mapResource in stateMeshResources) {
284: 			MeshResourceData resourceData = (MeshResourceData) mapResource.ResourceData;
285: 			if (resourceData.HasTextureAnimations) {

...

298: 			}
299: 		}
300: 
301: 		// Texture Animation Source
302: 		foreach (MapResource mapResource in stateMeshResources) {
303: 			MeshResourceData resourceData = (MeshResourceData) mapResource.ResourceData;
304: 			if (resourceData.HasPaletteAnimationFrames) {

...

317: 			}
318: 		}
319: 
320: 		// Texture Animation Source
321: 		foreach (MapResource mapResource in stateMeshResources) {
322: 			MeshResourceData resourceData = (MeshResourceData) mapResource.ResourceData;
323: 			if (resourceData.HasTextureAnimations) {
```