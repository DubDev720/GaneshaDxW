export interface EditorSelection {
  polygonId: string | null;
  vertexId: string | null;
  edgeIndex: number | null;
}

export class SelectionStore {
  private selection: EditorSelection = {
    polygonId: null,
    vertexId: null,
    edgeIndex: null,
  };

  get current(): EditorSelection {
    return this.selection;
  }

  selectPolygon(polygonId: string | null): EditorSelection {
    this.selection = {
      polygonId,
      vertexId: null,
      edgeIndex: null,
    };
    return this.selection;
  }

  selectVertex(vertexId: string | null): EditorSelection {
    this.selection = {
      ...this.selection,
      vertexId,
      edgeIndex: null,
    };
    return this.selection;
  }

  selectEdge(edgeIndex: number | null): EditorSelection {
    this.selection = {
      ...this.selection,
      vertexId: null,
      edgeIndex,
    };
    return this.selection;
  }
}
