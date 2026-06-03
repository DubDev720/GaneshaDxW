# Source Profile: `Resources/CurrentMapState.cs`

## Declared types

- `15` — `public static class CurrentMapState`

## Method-like signatures

- `22` — `public static void SetState(`
- `39` — `public static void ResetState(`
- `43` — `private static void SetInitialMeshData(`
- `57` — `private static void SetInitialTextureData(`
- `72` — `private static void AssignStateResources(`
- `98` — `private static void SetCurrentMapStateReferences(`
- `108` — `public static void CloneSelection(`
- `140` — `public static void DeleteSelection(`
- `161` — `public static void DeleteAllPolygons(`
- `170` — `public static Polygon CreatePolygon(`

## High-value excerpts

```csharp
13: 
14: namespace GaneshaDx.Resources;
15: 
16: public static class CurrentMapState {
17: 	public static MapStateData StateData;
18: 	private static readonly List<MapResource> InitialMeshMapResources = new();
19: 	public static readonly List<MapResource> StateMeshMapResources = new();

...

14: namespace GaneshaDx.Resources;
15: 
16: public static class CurrentMapState {
17: 	public static MapStateData StateData;
18: 	private static readonly List<MapResource> InitialMeshMapResources = new();
19: 	public static readonly List<MapResource> StateMeshMapResources = new();
20: 	private static MapResource _initialTextureMapResource;

...

21: 	private static MapResource _stateTextureMapResource;
22: 
23: 	public static void SetState(MapArrangementState mapArrangementState, MapTime mapTime, MapWeather mapWeather) {
24: 		StateData = new MapStateData {
25: 			MapArrangementState = mapArrangementState,
26: 			MapTime = mapTime,
27: 			MapWeather = mapWeather

...

34: 		SetCurrentMapStateReferences();
35: 		SceneRenderer.Reset();
36: 
37: 		Background.SetAsGradient(StateData.BackgroundTopColor, StateData.BackgroundBottomColor);
38: 	}
39: 
40: 	public static void ResetState() {

...

38: 	}
39: 
40: 	public static void ResetState() {
41: 		SetState(StateData.MapArrangementState, StateData.MapTime, StateData.MapWeather);
42: 	}
43: 
44: 	private static void SetInitialMeshData() {

...

75: 		_stateTextureMapResource = null;
76: 
77: 		foreach (MapResource resource in MapData.MeshResources) {
78: 			bool resourceMatchesState = resource.MapArrangementState == StateData.MapArrangementState &&
79: 			                            resource.MapTime == StateData.MapTime &&
80: 			                            resource.MapWeather == StateData.MapWeather;
81: 

...

76: 
77: 		foreach (MapResource resource in MapData.MeshResources) {
78: 			bool resourceMatchesState = resource.MapArrangementState == StateData.MapArrangementState &&
79: 			                            resource.MapTime == StateData.MapTime &&
80: 			                            resource.MapWeather == StateData.MapWeather;
81: 
82: 			if (resourceMatchesState) {

...

77: 		foreach (MapResource resource in MapData.MeshResources) {
78: 			bool resourceMatchesState = resource.MapArrangementState == StateData.MapArrangementState &&
79: 			                            resource.MapTime == StateData.MapTime &&
80: 			                            resource.MapWeather == StateData.MapWeather;
81: 
82: 			if (resourceMatchesState) {
83: 				StateMeshMapResources.Add(resource);

...

85: 		}
86: 
87: 		foreach (MapResource resource in MapData.TextureResources) {
88: 			bool resourceMatchesState = resource.MapArrangementState == StateData.MapArrangementState &&
89: 			                            resource.MapTime == StateData.MapTime &&
90: 			                            resource.MapWeather == StateData.MapWeather;
91: 

...

86: 
87: 		foreach (MapResource resource in MapData.TextureResources) {
88: 			bool resourceMatchesState = resource.MapArrangementState == StateData.MapArrangementState &&
89: 			                            resource.MapTime == StateData.MapTime &&
90: 			                            resource.MapWeather == StateData.MapWeather;
91: 
92: 			if (resourceMatchesState) {

...

87: 		foreach (MapResource resource in MapData.TextureResources) {
88: 			bool resourceMatchesState = resource.MapArrangementState == StateData.MapArrangementState &&
89: 			                            resource.MapTime == StateData.MapTime &&
90: 			                            resource.MapWeather == StateData.MapWeather;
91: 
92: 			if (resourceMatchesState) {
93: 				_stateTextureMapResource = resource;

...

99: 	private static void SetCurrentMapStateReferences() {
100: 		MapResource stateTextureResource = _stateTextureMapResource ?? _initialTextureMapResource;
101: 
102: 		StateData.SetStateResources(
103: 			InitialMeshMapResources,
104: 			StateMeshMapResources,
105: 			stateTextureResource

...

112: 		foreach (Polygon polygon in Selection.SelectedPolygons) {
113: 			Polygon newPolygon = polygon.CreateClone();
114: 
115: 			Dictionary<PolygonType, List<Polygon>> meshBucket = StateData.PolygonCollection[polygon.MeshType];
116: 
117: 			if (newPolygon.IsQuad) {
118: 				if (newPolygon.IsTextured) {

...

140: 
141: 	public static void DeleteSelection() {
142: 		foreach (Polygon polygon in Selection.SelectedPolygons) {
143: 			Dictionary<PolygonType, List<Polygon>> meshContainer = StateData.PolygonCollection[polygon.MeshType];
144: 			if (polygon.IsQuad) {
145: 				if (polygon.IsTextured) {
146: 					meshContainer[PolygonType.TexturedQuad].Remove(polygon);

...

160: 	}
161: 
162: 	public static void DeleteAllPolygons(MeshType meshType) {
163: 		Dictionary<PolygonType, List<Polygon>> meshContainer = StateData.PolygonCollection[meshType];
164: 
165: 		meshContainer[PolygonType.TexturedQuad].Clear();
166: 		meshContainer[PolygonType.UntexturedQuad].Clear();

...

198: 		};
199: 
200: 		if (addToBucket) {
201: 			Dictionary<PolygonType, List<Polygon>> selectedMesh = StateData.PolygonCollection[selectedMeshType];
202: 
203: 			if (newPolygon.IsQuad) {
204: 				if (newPolygon.IsTextured) {
```