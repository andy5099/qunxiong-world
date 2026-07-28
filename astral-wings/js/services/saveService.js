import { C } from '../config.js';
import { load as legacyLoad, save as legacySave, reset as legacyReset } from '../save.js';

/**
 * Persistence boundary used by UI and future systems.  It delegates to the
 * existing versioned migration logic, retaining every legacy field.  A bad
 * local payload is copied aside before the safe default is returned.
 */
export class SaveService {
  constructor(key = C.save) {
    this.key = key;
  }

  load() {
    try {
      return legacyLoad();
    } catch (error) {
      this.backupCorruptPayload();
      return legacyReset();
    }
  }

  save(state) {
    legacySave(state);
    return state;
  }

  reset() {
    return legacyReset();
  }

  backupCorruptPayload() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) localStorage.setItem(`${this.key}:corrupt:${Date.now()}`, raw);
    } catch { /* storage may be unavailable in private browsing */ }
  }
}

export const createSaveService = () => new SaveService();
