# Source Profile: `Common/GlbExporter.cs`

## Declared types

- `29` — `public static class GlbExporter`

## Method-like signatures

- `51` — `public static void Export(`
- `156` — `private static void CreateTextures(`
- `209` — `private static Palette ApplyPaletteAnimation(`
- `230` — `private static byte[] GeneratePngBytesFromColors(`
- `251` — `private static void ApplyPalette(`
- `291` — `private static Vector3 ConvertAndScaleVector3(`
- `293` — `return new Vector3(`
- `295` — `private static VertexPosition ConvertAndScaleVector3ToVertexPosition(`
- `297` — `return new VertexPosition(`
- `299` — `private static Microsoft.Xna.Framework.Vector3 TranslateVertexToAnimatedPosition(`
- `338` — `private static Vector2 GetAdjustedUvCoordinates(`
- `342` — `return new Vector2(`

## High-value excerpts

```csharp
22: using GaneshaDx.UserInterface.GuiForms;
23: using SharpGLTF.Scenes;
24: using AlphaMode = SharpGLTF.Materials.AlphaMode;
25: using Palette = GaneshaDx.Resources.ContentDataTypes.Palettes.Palette;
26: using VertexPosition = SharpGLTF.Geometry.VertexTypes.VertexPosition;
27: 
28: namespace GaneshaDx.Common;

...

49: 		Utilities.GetColorFromHex("FFFFFF")
50: 	};
51: 
52: 	public static void Export(string filePath) {
53: 		Dictionary<MeshType, MeshBuilder<VertexPosition, VertexTexture1>> meshes = new() {
54: 			{ MeshType.PrimaryMesh, new MeshBuilder<VertexPosition, VertexTexture1>("PrimaryMesh") },
55: 			{ MeshType.AnimatedMesh1, new MeshBuilder<VertexPosition, VertexTexture1>("AnimatedMesh1") },

...

77: 		CreateTextures(texturedPrimitives, meshes);
78: 
79: 
80: 		foreach (Polygon polygon in CurrentMapState.StateData.PolygonCollectionBucket) {
81: 			if (polygon.IsQuad) {
82: 				List<Vertex> vertices = polygon.Vertices;
83: 				List<Microsoft.Xna.Framework.Vector2> uvs = polygon.UvCoordinates;

...

158: 		Dictionary<MeshType, List<PrimitiveBuilder<MaterialBuilder, VertexPosition, VertexTexture1, VertexEmpty>>> texturedPrimitives,
159: 		Dictionary<MeshType, MeshBuilder<VertexPosition, VertexTexture1>> texturedMesh
160: 	) {
161: 		MTex2D stateTexture = CurrentMapState.StateData.Texture;
162: 
163: 		foreach (Palette palette in CurrentMapState.StateData.Palettes) {
164: 			Color[] textureColors = new Color[stateTexture.Width * stateTexture.Height];

...

160: 	) {
161: 		MTex2D stateTexture = CurrentMapState.StateData.Texture;
162: 
163: 		foreach (Palette palette in CurrentMapState.StateData.Palettes) {
164: 			Color[] textureColors = new Color[stateTexture.Width * stateTexture.Height];
165: 			stateTexture.GetData(textureColors);
166: 

...

164: 			Color[] textureColors = new Color[stateTexture.Width * stateTexture.Height];
165: 			stateTexture.GetData(textureColors);
166: 
167: 			byte[] textureBytes = GeneratePngBytesFromColors(textureColors, ApplyPaletteAnimation(palette));
168: 
169: 			MemoryImage memoryImage = new(textureBytes);
170: 			MaterialBuilder material = new MaterialBuilder().WithAlpha(AlphaMode.MASK);

...

180: 
181: 			material.WithChannelImage(KnownChannel.BaseColor, memoryImage);
182: 			material.UseChannel(KnownChannel.BaseColor)
183: 				.Texture
184: 				.WithSampler(
185: 					TextureWrapMode.CLAMP_TO_EDGE,
186: 					TextureWrapMode.MIRRORED_REPEAT,

...

207: 		}
208: 	}
209: 
210: 	private static Palette ApplyPaletteAnimation(Palette palette) {
211: 		bool usesTextureAnimations = CurrentMapState.StateData.TextureAnimations != null &&
212: 		                             CurrentMapState.StateData.TextureAnimations.Count > 0;
213: 

...

208: 	}
209: 
210: 	private static Palette ApplyPaletteAnimation(Palette palette) {
211: 		bool usesTextureAnimations = CurrentMapState.StateData.TextureAnimations != null &&
212: 		                             CurrentMapState.StateData.TextureAnimations.Count > 0;
213: 
214: 		if (usesTextureAnimations) {

...

209: 
210: 	private static Palette ApplyPaletteAnimation(Palette palette) {
211: 		bool usesTextureAnimations = CurrentMapState.StateData.TextureAnimations != null &&
212: 		                             CurrentMapState.StateData.TextureAnimations.Count > 0;
213: 
214: 		if (usesTextureAnimations) {
215: 			int paletteIndex = CurrentMapState.StateData.Palettes.IndexOf(palette);

...

212: 		                             CurrentMapState.StateData.TextureAnimations.Count > 0;
213: 
214: 		if (usesTextureAnimations) {
215: 			int paletteIndex = CurrentMapState.StateData.Palettes.IndexOf(palette);
216: 
217: 			foreach (AnimatedTextureInstructions instruction in CurrentMapState.StateData.TextureAnimations) {
218: 				if (instruction.TextureAnimationType == TextureAnimationType.PaletteAnimation) {

...

214: 		if (usesTextureAnimations) {
215: 			int paletteIndex = CurrentMapState.StateData.Palettes.IndexOf(palette);
216: 
217: 			foreach (AnimatedTextureInstructions instruction in CurrentMapState.StateData.TextureAnimations) {
218: 				if (instruction.TextureAnimationType == TextureAnimationType.PaletteAnimation) {
219: 					PaletteAnimation paletteAnimation = (PaletteAnimation) instruction.Instructions;
220: 					if (paletteIndex == paletteAnimation.OverriddenPaletteId) {

...

218: 				if (instruction.TextureAnimationType == TextureAnimationType.PaletteAnimation) {
219: 					PaletteAnimation paletteAnimation = (PaletteAnimation) instruction.Instructions;
220: 					if (paletteIndex == paletteAnimation.OverriddenPaletteId) {
221: 						palette = CurrentMapState.StateData.PaletteAnimationFrames[paletteAnimation.AnimationStartIndex];
222: 						break;
223: 					}
224: 				}

...

225: 			}
226: 		}
227: 
228: 		return palette;
229: 	}
230: 
231: 	private static byte[] GeneratePngBytesFromColors(Color[] textureColors, Palette palette) {

...

228: 		return palette;
229: 	}
230: 
231: 	private static byte[] GeneratePngBytesFromColors(Color[] textureColors, Palette palette) {
232: 		MTex2D stateTexture = CurrentMapState.StateData.Texture;
233: 		FreeImageBitmap indexedPng = new(stateTexture.Width, stateTexture.Height, PixelFormat.Format32bppArgb);
234: 

...

229: 	}
230: 
231: 	private static byte[] GeneratePngBytesFromColors(Color[] textureColors, Palette palette) {
232: 		MTex2D stateTexture = CurrentMapState.StateData.Texture;
233: 		FreeImageBitmap indexedPng = new(stateTexture.Width, stateTexture.Height, PixelFormat.Format32bppArgb);
234: 
235: 		for (int x = 0; x < stateTexture.Width; x++) {
```