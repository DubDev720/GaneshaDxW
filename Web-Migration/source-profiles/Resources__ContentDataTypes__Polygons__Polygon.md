# Source Profile: `Resources/ContentDataTypes/Polygons/Polygon.cs`

## Declared types

- `13` — `public class Polygon`

## Method-like signatures

- `70` — `public void Render(`
- `97` — `public void RenderVertexIndicators(`
- `103` — `public void SetNewPosition(`
- `110` — `public void SetNewVertexPosition(`
- `115` — `public void RotateVerticesClockwise(`
- `130` — `public void RotateVerticesCounterClockwise(`
- `145` — `public void FlipNormals(`
- `157` — `public void FlipUvsHorizontally(`
- `171` — `public void FlipUvsVertically(`
- `185` — `public void RotateUvsClockwise(`
- `202` — `public void RotateUvsCounterClockwise(`
- `219` — `public void AutoMapUvs(`
- `283` — `private Axis GetPlanarAxis(`
- `321` — `public void GuessNormals(`
- `343` — `public Polygon CreateClone(`
- `367` — `new Vector3(`
- `385` — `public List<Polygon> Break(`
- `463` — `public void SetLastAnimatedPositionsForVertices(`
- `473` — `private Vertex CloneVertex(`
- `475` — `return new Vertex(`
- `476` — `new Vector3(`
- `487` — `private void SetTexture(`
- `500` — `private void SetRenderVertices(`
- `516` — `private void UpdateVertexIndicator(`
- `528` — `private VertexPositionNormalTexture BuildVertex(`
- `547` — `return new VertexPositionNormalTexture(`
- `549` — `return new VertexPositionNormalTexture(`
- `552` — `private void SetPolygonEffect(`
- `559` — `isUnlit
				? new Vector4(`
- `571` — `? new Vector4(`

## High-value excerpts

```csharp
78: 		Stage.GraphicsDevice.DepthStencilState = DepthStencilState.Default;
79: 		Stage.GraphicsDevice.BlendState = BlendState.NonPremultiplied;
80: 
81: 		Stage.BasicEffect.Alpha = Gui.SelectedTab == RightPanelTab.Terrain
82: 			? Configuration.Properties.PolygonTransparencyForTerrainEditing / 100f
83: 			: 1f;
84: 

...

82: 			? Configuration.Properties.PolygonTransparencyForTerrainEditing / 100f
83: 			: 1f;
84: 
85: 		Stage.BasicEffect.Texture = _texture2D;
86: 		Stage.BasicEffect.TextureEnabled = true;
87: 		Stage.BasicEffect.VertexColorEnabled = false;
88: 

...

83: 			: 1f;
84: 
85: 		Stage.BasicEffect.Texture = _texture2D;
86: 		Stage.BasicEffect.TextureEnabled = true;
87: 		Stage.BasicEffect.VertexColorEnabled = false;
88: 
89: 		foreach (EffectPass pass in IsTextured

...

84: 
85: 		Stage.BasicEffect.Texture = _texture2D;
86: 		Stage.BasicEffect.TextureEnabled = true;
87: 		Stage.BasicEffect.VertexColorEnabled = false;
88: 
89: 		foreach (EffectPass pass in IsTextured
90: 			         ? Stage.FftPolygonEffect.CurrentTechnique.Passes

...

87: 		Stage.BasicEffect.VertexColorEnabled = false;
88: 
89: 		foreach (EffectPass pass in IsTextured
90: 			         ? Stage.FftPolygonEffect.CurrentTechnique.Passes
91: 			         : Stage.BasicEffect.CurrentTechnique.Passes
92: 		        ) {
93: 			pass.Apply();

...

88: 
89: 		foreach (EffectPass pass in IsTextured
90: 			         ? Stage.FftPolygonEffect.CurrentTechnique.Passes
91: 			         : Stage.BasicEffect.CurrentTechnique.Passes
92: 		        ) {
93: 			pass.Apply();
94: 			Stage.GraphicsDevice.DrawPrimitives(PrimitiveType.TriangleStrip, 0, IsQuad ? 2 : 1);

...

449: 				new(UvCoordinates[2].X, UvCoordinates[2].Y)
450: 			};
451: 
452: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedQuad].Remove(this);
453: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonA);
454: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonB);
455: 		} else {

...

450: 			};
451: 
452: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedQuad].Remove(this);
453: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonA);
454: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonB);
455: 		} else {
456: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedQuad].Remove(this);

...

451: 
452: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedQuad].Remove(this);
453: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonA);
454: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonB);
455: 		} else {
456: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedQuad].Remove(this);
457: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonA);

...

453: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonA);
454: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonB);
455: 		} else {
456: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedQuad].Remove(this);
457: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonA);
458: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonB);
459: 		}

...

454: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.TexturedTriangle].Add(newPolygonB);
455: 		} else {
456: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedQuad].Remove(this);
457: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonA);
458: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonB);
459: 		}
460: 

...

455: 		} else {
456: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedQuad].Remove(this);
457: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonA);
458: 			CurrentMapState.StateData.PolygonCollection[MeshType][PolygonType.UntexturedTriangle].Add(newPolygonB);
459: 		}
460: 
461: 		return new List<Polygon> { newPolygonA, newPolygonB };

...

487: 
488: 	private void SetTexture() {
489: 		_texture2D = IsTextured switch {
490: 			true when !Configuration.Properties.RenderPolygonsInLightingMode => CurrentMapState.StateData.Texture,
491: 			true when Configuration.Properties.RenderPolygonsInLightingMode => UniversalTextures.GreyTexture,
492: 			false => IsSelected && Configuration.Properties.HighlightSelectedPoly
493: 				? UniversalTextures.SelectedBlackTexture 

...

551: 	}
552: 
553: 	private void SetPolygonEffect() {
554: 		Stage.FftPolygonEffect.Parameters["ModelTexture"].SetValue(_texture2D);
555: 
556: 		bool isUnlit = RenderingProperties != null && !RenderingProperties.LitTexture; 
557: 		Color ambientColor = CurrentMapState.StateData.AmbientLightColor;

...

554: 		Stage.FftPolygonEffect.Parameters["ModelTexture"].SetValue(_texture2D);
555: 
556: 		bool isUnlit = RenderingProperties != null && !RenderingProperties.LitTexture; 
557: 		Color ambientColor = CurrentMapState.StateData.AmbientLightColor;
558: 		Stage.FftPolygonEffect.Parameters["AmbientColor"].SetValue(
559: 			isUnlit
560: 				? new Vector4(0.5f, 0.5f, 0.5f, 1)

...

555: 
556: 		bool isUnlit = RenderingProperties != null && !RenderingProperties.LitTexture; 
557: 		Color ambientColor = CurrentMapState.StateData.AmbientLightColor;
558: 		Stage.FftPolygonEffect.Parameters["AmbientColor"].SetValue(
559: 			isUnlit
560: 				? new Vector4(0.5f, 0.5f, 0.5f, 1)
561: 				: ambientColor.ToVector4()
```