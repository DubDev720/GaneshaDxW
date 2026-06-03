# Source Profile: `Resources/ContentDataTypes/Palettes/Palette.cs`

## Declared types

- `6` — `public class Palette`

## Method-like signatures

- `20` — `public List<byte> GetRawData(`

## High-value excerpts

```csharp
4: 
5: namespace GaneshaDx.Resources.ContentDataTypes.Palettes;
6: 
7: public class Palette {
8: 	public readonly List<PaletteColor> Colors = new();
9: 	readonly Vector4[] _paletteColors = new Vector4[16];
10: 
```