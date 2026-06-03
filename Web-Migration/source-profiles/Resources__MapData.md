# Source Profile: `Resources/MapData.cs`

## Declared types

- `17` — `public static class MapData`

## Method-like signatures

- `29` — `public static void ReloadCurrentMap(`
- `34` — `public static void LoadMapDataFromFullPath(`
- `66` — `private static void ResetEditorState(`
- `77` — `private static void ProcessAllResources(`
- `113` — `private static void SetResourceFileData(`
- `151` — `private static bool AllResourcesLoaded(`
- `162` — `public static void ExportGlb(`
- `167` — `public static void ImportTexture(`
- `189` — `public static void ExportTexture(`
- `197` — `public static void ImportPalette(`
- `221` — `public static void ExportPalette(`
- `251` — `public static void ExportUvMap(`
- `259` — `public static void SaveMap(`
- `308` — `public static void SaveMapAs(`

## High-value excerpts

```csharp
48: 		MapName = Path.GetFileNameWithoutExtension(gnsPath);
49: 		MapFolder = Path.GetDirectoryName(gnsPath);
50: 
51: 		List<byte> gnsData = File.ReadAllBytes(gnsPath).ToList();
52: 		Gns = new Gns(gnsData);
53: 
54: 		ProcessAllResources();

...

58: 			Stage.Window.Title = "GaneshaDx - " + MapName;
59: 			MapIsLoaded = true;
60: 			TimeSinceLastSave = Stage.GameTime.TotalGameTime.TotalSeconds;
61: 			CurrentMapState.SetState(MapArrangementState.Primary, MapTime.Day, MapWeather.None);
62: 			ResetEditorState();
63: 			MeshAnimationController.PlayAnimations();
64: 		}

...

130: 			string xFileName = mapRoot + "." + xFileIndex;
131: 
132: 			if (File.Exists(xFileName)) {
133: 				resourceFileData.Add(File.ReadAllBytes(xFileName).ToList());
134: 				resourceXFiles.Add(xFileIndex);
135: 			}
136: 

...

161: 	}
162: 
163: 	public static void ExportGlb(string filePath) {
164: 		GlbExporter.Export(filePath);
165: 		OverlayConsole.AddMessage("Map Exported as " + filePath);
166: 	}
167: 

...

169: 		Texture2D importedTexture = Texture2D.FromFile(Stage.GraphicsDevice, filePath);
170: 
171: 		if (importedTexture.Width != 256 && importedTexture.Height != 1024) {
172: 			OverlayConsole.AddMessage("Cannot Import Texture. Textures must be 256x1024");
173: 			return;
174: 		}
175: 

...

175: 
176: 		foreach (MapResource textureResource in TextureResources) {
177: 			if (
178: 				textureResource.MapArrangementState == CurrentMapState.StateData.MapArrangementState &&
179: 				textureResource.MapTime == CurrentMapState.StateData.MapTime &&
180: 				textureResource.MapWeather == CurrentMapState.StateData.MapWeather
181: 			) {

...

176: 		foreach (MapResource textureResource in TextureResources) {
177: 			if (
178: 				textureResource.MapArrangementState == CurrentMapState.StateData.MapArrangementState &&
179: 				textureResource.MapTime == CurrentMapState.StateData.MapTime &&
180: 				textureResource.MapWeather == CurrentMapState.StateData.MapWeather
181: 			) {
182: 				TextureResourceData textureResourceData = (TextureResourceData) textureResource.ResourceData;

...

177: 			if (
178: 				textureResource.MapArrangementState == CurrentMapState.StateData.MapArrangementState &&
179: 				textureResource.MapTime == CurrentMapState.StateData.MapTime &&
180: 				textureResource.MapWeather == CurrentMapState.StateData.MapWeather
181: 			) {
182: 				TextureResourceData textureResourceData = (TextureResourceData) textureResource.ResourceData;
183: 				textureResourceData.Texture = importedTexture;

...

180: 				textureResource.MapWeather == CurrentMapState.StateData.MapWeather
181: 			) {
182: 				TextureResourceData textureResourceData = (TextureResourceData) textureResource.ResourceData;
183: 				textureResourceData.Texture = importedTexture;
184: 				CurrentMapState.StateData.Texture = importedTexture;
185: 				break;
186: 			}

...

181: 			) {
182: 				TextureResourceData textureResourceData = (TextureResourceData) textureResource.ResourceData;
183: 				textureResourceData.Texture = importedTexture;
184: 				CurrentMapState.StateData.Texture = importedTexture;
185: 				break;
186: 			}
187: 		}

...

189: 
190: 	public static void ExportTexture(string filePath) {
191: 		Stream stream = File.Create(filePath);
192: 		Texture2D texture = CurrentMapState.StateData.Texture;
193: 		texture.SaveAsPng(stream, texture.Width, texture.Height);
194: 		OverlayConsole.AddMessage("Texture Exported as " + filePath);
195: 		stream.Dispose();

...

190: 	public static void ExportTexture(string filePath) {
191: 		Stream stream = File.Create(filePath);
192: 		Texture2D texture = CurrentMapState.StateData.Texture;
193: 		texture.SaveAsPng(stream, texture.Width, texture.Height);
194: 		OverlayConsole.AddMessage("Texture Exported as " + filePath);
195: 		stream.Dispose();
196: 	}

...

191: 		Stream stream = File.Create(filePath);
192: 		Texture2D texture = CurrentMapState.StateData.Texture;
193: 		texture.SaveAsPng(stream, texture.Width, texture.Height);
194: 		OverlayConsole.AddMessage("Texture Exported as " + filePath);
195: 		stream.Dispose();
196: 	}
197: 

...

196: 	}
197: 
198: 	public static void ImportPalette(string file, int paletteId, string paletteType) {
199: 		List<byte> paletteData = File.ReadAllBytes(file).ToList();
200: 		const int totalColors = 16;
201: 		Palette sourcePalette = new();
202: 

...

198: 	public static void ImportPalette(string file, int paletteId, string paletteType) {
199: 		List<byte> paletteData = File.ReadAllBytes(file).ToList();
200: 		const int totalColors = 16;
201: 		Palette sourcePalette = new();
202: 
203: 		for (int colorIndex = 0; colorIndex < totalColors * 3; colorIndex += 3) {
204: 			int red = (int) Math.Floor(paletteData[colorIndex] / 8f);

...

209: 		}
210: 
211: 		List<PaletteColor> targetPalette = paletteType == "main"
212: 			? CurrentMapState.StateData.Palettes[paletteId].Colors
213: 			: CurrentMapState.StateData.PaletteAnimationFrames[paletteId].Colors;
214: 
215: 		for (int colorIndex = 0; colorIndex < sourcePalette.Colors.Count; colorIndex++) {
```