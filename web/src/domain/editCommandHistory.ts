interface HistoryEntry<T, TMetadata> {
  state: T;
  metadata?: TMetadata;
}

export class EditCommandHistory<T, TMetadata = unknown> {
  private readonly past: HistoryEntry<T, TMetadata>[] = [];
  private readonly future: HistoryEntry<T, TMetadata>[] = [];
  private current: T;
  private currentMetadata: TMetadata | undefined;
  private transitionMetadata: TMetadata | undefined;
  private readonly maxDepth: number;

  constructor(initialState: T, maxDepth = 80) {
    this.current = initialState;
    this.maxDepth = maxDepth;
  }

  get state(): T {
    return this.current;
  }

  get lastTransitionMetadata(): TMetadata | undefined {
    return this.transitionMetadata;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  reset(state: T): void {
    this.current = state;
    this.currentMetadata = undefined;
    this.transitionMetadata = undefined;
    this.past.length = 0;
    this.future.length = 0;
  }

  execute(nextState: T, metadata?: TMetadata): T {
    this.past.push({
      state: this.current,
      metadata: this.currentMetadata,
    });
    if (this.past.length > this.maxDepth) {
      this.past.shift();
    }
    this.current = nextState;
    this.currentMetadata = metadata;
    this.transitionMetadata = metadata;
    this.future.length = 0;
    return this.current;
  }

  undo(): T {
    const previous = this.past.pop();
    if (!previous) {
      return this.current;
    }

    this.future.push({
      state: this.current,
      metadata: this.currentMetadata,
    });
    this.transitionMetadata = this.currentMetadata;
    this.current = previous.state;
    this.currentMetadata = previous.metadata;
    return this.current;
  }

  redo(): T {
    const next = this.future.pop();
    if (!next) {
      return this.current;
    }

    this.past.push({
      state: this.current,
      metadata: this.currentMetadata,
    });
    this.current = next.state;
    this.currentMetadata = next.metadata;
    this.transitionMetadata = next.metadata;
    return this.current;
  }
}
