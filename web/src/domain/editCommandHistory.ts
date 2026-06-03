export class EditCommandHistory<T> {
  private readonly past: T[] = [];
  private readonly future: T[] = [];
  private current: T;

  constructor(initialState: T) {
    this.current = initialState;
  }

  get state(): T {
    return this.current;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  reset(state: T): void {
    this.current = state;
    this.past.length = 0;
    this.future.length = 0;
  }

  execute(nextState: T): T {
    this.past.push(this.current);
    this.current = nextState;
    this.future.length = 0;
    return this.current;
  }

  undo(): T {
    const previous = this.past.pop();
    if (!previous) {
      return this.current;
    }

    this.future.push(this.current);
    this.current = previous;
    return this.current;
  }

  redo(): T {
    const next = this.future.pop();
    if (!next) {
      return this.current;
    }

    this.past.push(this.current);
    this.current = next;
    return this.current;
  }
}
