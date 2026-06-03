# Source Profile: `Rendering/SceneRenderer.cs`

## Declared types

- `18` — `public static class SceneRenderer`

## Method-like signatures

- `23` — `public static void Reset(`
- `27` — `public static void Update(`
- `34` — `private static void SetUvAnimationInstructionsToFftShader(`
- `107` — `new Vector4(`
- `116` — `new Vector4(`
- `125` — `private static void SetPaletteAnimationInstructions(`
- `185` — `private static int GetAnimationFrameId(`
- `202` — `private static int GetAnimationFrameId(`
- `219` — `public static void Render(`
- `251` — `private static void SetCompass(`
- `255` — `private static void SetDirectionalLightIndicators(`
- `265` — `private static void SetGraphicsDeviceProperties(`
- `271` — `private static void RenderPolygons(`
- `297` — `private static void RenderVertexIndicators(`
- `309` — `private static void RenderLightIndicators(`
- `315` — `private static void RenderCompass(`

## High-value excerpts

```csharp
18: 
19: public static class SceneRenderer {
20: 	private static readonly List<DirectionalLightIndicator> LightIndicators = new();
21: 	public static readonly List<Palette> AnimationAdjustedPalettes = new();
22: 	private static Compass _compass;
23: 
24: 	public static void Reset() {

...

34: 
35: 	private static void SetUvAnimationInstructionsToFftShader() {
36: 		for (int animationIndex = 0; animationIndex < 32; animationIndex++) {
37: 			Stage.FftPolygonEffect.Parameters["UsesAnimatedUv" + animationIndex].SetValue(false);
38: 		}
39: 
40: 		List<AnimatedTextureInstructions> animations = CurrentMapState.StateData.TextureAnimations;

...

37: 			Stage.FftPolygonEffect.Parameters["UsesAnimatedUv" + animationIndex].SetValue(false);
38: 		}
39: 
40: 		List<AnimatedTextureInstructions> animations = CurrentMapState.StateData.TextureAnimations;
41: 
42: 		if (animations == null) {
43: 			return;

...

46: 		for (int animationIndex = 0; animationIndex < animations.Count; animationIndex++) {
47: 			AnimatedTextureInstructions animatedTextureInstructions = animations[animationIndex];
48: 
49: 			if (animatedTextureInstructions.TextureAnimationType != TextureAnimationType.UvAnimation) {
50: 				continue;
51: 			}
52: 

...

50: 				continue;
51: 			}
52: 
53: 			UvAnimation uvAnimation = (UvAnimation) animatedTextureInstructions.Instructions;
54: 
55: 			if (uvAnimation == null) {
56: 				continue;

...

52: 
53: 			UvAnimation uvAnimation = (UvAnimation) animatedTextureInstructions.Instructions;
54: 
55: 			if (uvAnimation == null) {
56: 				continue;
57: 			}
58: 

...

56: 				continue;
57: 			}
58: 
59: 			if (uvAnimation.UvAnimationMode != UvAnimationMode.ForwardLooping &&
60: 			    uvAnimation.UvAnimationMode != UvAnimationMode.ForwardAndReverseLooping &&
61: 			    !Configuration.Properties.PlaysScriptedTextureAnimations
62: 			   ) {

...

57: 			}
58: 
59: 			if (uvAnimation.UvAnimationMode != UvAnimationMode.ForwardLooping &&
60: 			    uvAnimation.UvAnimationMode != UvAnimationMode.ForwardAndReverseLooping &&
61: 			    !Configuration.Properties.PlaysScriptedTextureAnimations
62: 			   ) {
63: 				continue;

...

64: 			}
65: 
66: 			Rectangle canvasRectangle = new(
67: 				uvAnimation.CanvasX,
68: 				uvAnimation.CanvasY + uvAnimation.CanvasTexturePage * 256,
69: 				uvAnimation.SizeWidth,
70: 				uvAnimation.SizeHeight

...

65: 
66: 			Rectangle canvasRectangle = new(
67: 				uvAnimation.CanvasX,
68: 				uvAnimation.CanvasY + uvAnimation.CanvasTexturePage * 256,
69: 				uvAnimation.SizeWidth,
70: 				uvAnimation.SizeHeight
71: 			);

...

66: 			Rectangle canvasRectangle = new(
67: 				uvAnimation.CanvasX,
68: 				uvAnimation.CanvasY + uvAnimation.CanvasTexturePage * 256,
69: 				uvAnimation.SizeWidth,
70: 				uvAnimation.SizeHeight
71: 			);
72: 

...

67: 				uvAnimation.CanvasX,
68: 				uvAnimation.CanvasY + uvAnimation.CanvasTexturePage * 256,
69: 				uvAnimation.SizeWidth,
70: 				uvAnimation.SizeHeight
71: 			);
72: 
73: 			int frameId = GetAnimationFrameId(uvAnimation);

...

70: 				uvAnimation.SizeHeight
71: 			);
72: 
73: 			int frameId = GetAnimationFrameId(uvAnimation);
74: 
75: 			Vector3 topLeft;
76: 

...

75: 			Vector3 topLeft;
76: 
77: 			int totalFramesForTopRow =
78: 				(int) Math.Floor((float) (256 - uvAnimation.FirstFrameX) / uvAnimation.SizeWidth);
79: 			int totalFramesForNextRows = (int) Math.Floor((float) 256 / uvAnimation.SizeWidth);
80: 
81: 			int row = frameId < totalFramesForTopRow

...

76: 
77: 			int totalFramesForTopRow =
78: 				(int) Math.Floor((float) (256 - uvAnimation.FirstFrameX) / uvAnimation.SizeWidth);
79: 			int totalFramesForNextRows = (int) Math.Floor((float) 256 / uvAnimation.SizeWidth);
80: 
81: 			int row = frameId < totalFramesForTopRow
82: 				? 0

...

84: 
85: 			if (row == 0) {
86: 				topLeft = new Vector3(
87: 					uvAnimation.FirstFrameX + frameId * uvAnimation.SizeWidth,
88: 					uvAnimation.FirstFrameY + uvAnimation.FirstFrameTexturePage * 256,
89: 					0.9f
90: 				);
```