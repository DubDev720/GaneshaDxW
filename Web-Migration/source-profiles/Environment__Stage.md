# Source Profile: `Environment/Stage.cs`

## Declared types

- `17` — `public static class Stage`

## Method-like signatures

- `41` — `public static void SetStage(`
- `70` — `GraphicsDevice,
			typeof(`
- `77` — `GraphicsDevice,
			typeof(`
- `107` — `public static void Update(`
- `135` — `public static void UpdateEffects(`
- `147` — `public static void ToggleScreenshotMode(`
- `154` — `private static void WindowSizeChanged(`
- `160` — `private static void UpdateRenderTargets(`
- `178` — `private static void DroppedFileIn(`

## High-value excerpts

```csharp
22: 	public static GraphicsDeviceManager Graphics;
23: 	public static GraphicsDevice GraphicsDevice;
24: 	public static SpriteBatch SpriteBatch;
25: 	public static BasicEffect BasicEffect;
26: 	public static Effect FftPolygonEffect;
27: 	public static int Width;
28: 	public static int Height;

...

23: 	public static GraphicsDevice GraphicsDevice;
24: 	public static SpriteBatch SpriteBatch;
25: 	public static BasicEffect BasicEffect;
26: 	public static Effect FftPolygonEffect;
27: 	public static int Width;
28: 	public static int Height;
29: 	public static ContentManager Content;

...

80: 			BufferUsage.WriteOnly
81: 		);
82: 
83: 		BasicEffect = new BasicEffect(GraphicsDevice) {
84: 			Projection = ProjectionMatrix,
85: 			View = ViewMatrix,
86: 			World = WorldMatrix

...

86: 			World = WorldMatrix
87: 		};
88: 
89: 		FftPolygonEffect = Content.Load<Effect>("FFTPolygonShader");
90: 
91: 		ImGuiRenderer = new ImGuiRenderer(Ganesha);
92: 		ImGuiRenderer.RebuildFontAtlas();

...

134: 	}
135: 
136: 	public static void UpdateEffects() {
137: 		BasicEffect.Projection = ProjectionMatrix;
138: 		BasicEffect.View = ViewMatrix;
139: 		BasicEffect.World = WorldMatrix;
140: 

...

135: 
136: 	public static void UpdateEffects() {
137: 		BasicEffect.Projection = ProjectionMatrix;
138: 		BasicEffect.View = ViewMatrix;
139: 		BasicEffect.World = WorldMatrix;
140: 
141: 		Matrix worldInverseTransposeMatrix = Matrix.Transpose(Matrix.Invert(WorldMatrix));

...

136: 	public static void UpdateEffects() {
137: 		BasicEffect.Projection = ProjectionMatrix;
138: 		BasicEffect.View = ViewMatrix;
139: 		BasicEffect.World = WorldMatrix;
140: 
141: 		Matrix worldInverseTransposeMatrix = Matrix.Transpose(Matrix.Invert(WorldMatrix));
142: 		FftPolygonEffect.Parameters["Projection"].SetValue(ProjectionMatrix);

...

139: 		BasicEffect.World = WorldMatrix;
140: 
141: 		Matrix worldInverseTransposeMatrix = Matrix.Transpose(Matrix.Invert(WorldMatrix));
142: 		FftPolygonEffect.Parameters["Projection"].SetValue(ProjectionMatrix);
143: 		FftPolygonEffect.Parameters["View"].SetValue(ViewMatrix);
144: 		FftPolygonEffect.Parameters["World"].SetValue(WorldMatrix);
145: 		FftPolygonEffect.Parameters["WorldInverseTranspose"].SetValue(worldInverseTransposeMatrix);

...

140: 
141: 		Matrix worldInverseTransposeMatrix = Matrix.Transpose(Matrix.Invert(WorldMatrix));
142: 		FftPolygonEffect.Parameters["Projection"].SetValue(ProjectionMatrix);
143: 		FftPolygonEffect.Parameters["View"].SetValue(ViewMatrix);
144: 		FftPolygonEffect.Parameters["World"].SetValue(WorldMatrix);
145: 		FftPolygonEffect.Parameters["WorldInverseTranspose"].SetValue(worldInverseTransposeMatrix);
146: 	}

...

141: 		Matrix worldInverseTransposeMatrix = Matrix.Transpose(Matrix.Invert(WorldMatrix));
142: 		FftPolygonEffect.Parameters["Projection"].SetValue(ProjectionMatrix);
143: 		FftPolygonEffect.Parameters["View"].SetValue(ViewMatrix);
144: 		FftPolygonEffect.Parameters["World"].SetValue(WorldMatrix);
145: 		FftPolygonEffect.Parameters["WorldInverseTranspose"].SetValue(worldInverseTransposeMatrix);
146: 	}
147: 

...

142: 		FftPolygonEffect.Parameters["Projection"].SetValue(ProjectionMatrix);
143: 		FftPolygonEffect.Parameters["View"].SetValue(ViewMatrix);
144: 		FftPolygonEffect.Parameters["World"].SetValue(WorldMatrix);
145: 		FftPolygonEffect.Parameters["WorldInverseTranspose"].SetValue(worldInverseTransposeMatrix);
146: 	}
147: 
148: 	public static void ToggleScreenshotMode() {
```