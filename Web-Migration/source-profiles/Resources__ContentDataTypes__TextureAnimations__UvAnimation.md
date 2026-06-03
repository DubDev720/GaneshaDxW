# Source Profile: `Resources/ContentDataTypes/TextureAnimations/UvAnimation.cs`

## Declared types

- `5` — `public class UvAnimation`

## Method-like signatures

- `33` — `public UvAnimation(`
- `35` — `public UvAnimation(`
- `82` — `public List<byte> GetRawData(`

## High-value excerpts

```csharp
3: 
4: namespace GaneshaDx.Resources.ContentDataTypes.TextureAnimations;
5: 
6: public class UvAnimation : TextureAnimation {
7: 	public int CanvasX = 8;
8: 	public int CanvasY = 8;
9: 	public int CanvasTexturePage;

...

31: 	public int Unknown18;
32: 	public int Unknown19;
33: 
34: 	public UvAnimation() { }
35: 
36: 	public UvAnimation(List<byte> rawData) {
37: 		CanvasX = rawData[0] * 4;

...

33: 
34: 	public UvAnimation() { }
35: 
36: 	public UvAnimation(List<byte> rawData) {
37: 		CanvasX = rawData[0] * 4;
38: 		Unknown1 = rawData[1];
39: 		CanvasY = rawData[2];
```