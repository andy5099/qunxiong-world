import { game } from '../game.js';

/**
 * Adapter over the existing Canvas battle loop.  This gives callers one
 * lifecycle surface and a small diagnostic snapshot without changing combat
 * rules or the save format.
 */
export class BattleEngine {
  constructor({ canvas, saveData, controls, onEnd, onHud, mode, stage }) {
    this.options = { canvas, saveData, controls, onEnd, onHud, mode, stage };
    this.instance = null;
    this.status = { running: false, mode, stageId: stage?.id || null, bullets: 0, enemies: 0, pickups: 0 };
  }

  start() {
    if (this.instance) return this;
    const { canvas, saveData, controls, onEnd, onHud, mode, stage } = this.options;
    this.status.running = true;
    this.instance = game(canvas, saveData, controls, result => {
      this.status.running = false;
      this.status.finished = true;
      onEnd(result);
    }, state => {
      this.status = {
        ...this.status,
        running: !state.over,
        bullets: state.bullets.length,
        enemies: state.enemies.length,
        pickups: state.pickups.length,
        boss: state.boss?.name || null,
        paused: state.paused,
        fireLevel: state.p.fireLevel,
        hp: Math.ceil(state.p.hp),
        shield: Math.ceil(state.p.shield)
      };
      onHud(state);
    }, mode, stage);
    return this;
  }

  pause() { this.instance?.pause(); }
  ultimate() { this.instance?.ultimate(); }
  claim() { this.instance?.claim(); }
  stop() {
    this.instance?.stop();
    this.instance = null;
    this.status.running = false;
  }
  snapshot() { return { ...this.status }; }
}

export const createBattleEngine = options => new BattleEngine(options);
