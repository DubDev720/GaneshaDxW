export interface EditorSelection {
  polygonId: string | null;
  vertexId: string | null;
}

export class SelectionStore {
  private selection: EditorSelection = {
    polygonId: null,
    vertexId: null,
  };

  get current(): EditorSelection {
    return this.selection;
  }

  selectPolygon(polygonId: string | null): EditorSelection {
    this.selection = {
      polygonId,
      vertexId: null,
    };
    return this.selection;
  }

  selectVertex(vertexId: string | null): EditorSelection {
    this.selection = {
      ...this.selection,
      vertexId,
    };
    return this.selection;
  }
}
