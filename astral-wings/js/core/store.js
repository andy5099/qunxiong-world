/** Small observable store for UI-only state.  Game state continues to be
 * versioned and persisted through SaveService, so temporary screen state is
 * never accidentally written into player saves. */
export class Store {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Set();
  }

  get() { return this.state; }

  patch(update) {
    const next = typeof update === 'function' ? update(this.state) : update;
    this.state = { ...this.state, ...next };
    this.listeners.forEach(listener => listener(this.state));
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const createStore = initialState => new Store(initialState);
