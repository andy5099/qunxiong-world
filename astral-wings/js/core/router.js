/**
 * Minimal screen router for the single-page shell.  It deliberately owns only
 * screen transitions; battle simulation remains inside BattleEngine.
 */
export class ScreenRouter {
  constructor(root) {
    this.root = root;
    this.current = { name: 'boot', payload: null };
    this.listeners = new Set();
  }

  show(name, markup, payload = null) {
    this.current = { name, payload };
    this.root.dataset.screen = name;
    this.root.innerHTML = markup;
    this.listeners.forEach(listener => listener(this.current));
  }

  setState(name, payload = null) {
    this.current = { name, payload };
    this.root.dataset.screen = name;
    this.listeners.forEach(listener => listener(this.current));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const createScreenRouter = root => new ScreenRouter(root);
