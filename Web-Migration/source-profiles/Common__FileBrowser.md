# Source Profile: `Common/FileBrowser.cs`

## Declared types

- `8` — `public static class FileBrowser`

## Method-like signatures

- `11` — `public static void OpenMapDialog(`
- `23` — `public static void SaveMapAsDialog(`
- `34` — `public static void ExportGlbDialog(`
- `43` — `public static void ExportTextureDialog(`
- `52` — `public static void ImportTextureDialog(`
- `62` — `public static void ExportUvsDialog(`
- `71` — `public static void ExportPalette(`
- `88` — `public static void ImportPalette(`

## High-value excerpts

```csharp
70: 	}
71: 
72: 	public static void ExportPalette(int paletteId, string paletteType) {
73: 		NfdFilter[] filters = { new() { Specification = "act", Description = "Palette File" } };
74: 		string fileName = paletteId >= 0
75: 			? MapData.MapName + "_Palette" + paletteId + "_" + paletteType
76: 			: "FFT_DefaultPalette";

...

87: 	}
88: 
89: 	public static void ImportPalette(int paletteId, string paletteType) {
90: 		NfdFilter[] filters = { new() { Specification = "act", Description = "Palette File" } };
91: 		NfdDialogResult result = Nfd.FileOpen(filters);
92: 
93: 		if (result.Status == NfdStatus.Ok) {
```