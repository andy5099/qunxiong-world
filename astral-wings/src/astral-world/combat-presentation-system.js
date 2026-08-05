const DEFAULT_DURATION = {
  damage:.78, critical:.92, miss:.72, evade:.72, heal:.85, shield:.9,
  hit:.22, knockback:.28, death:.8, skillImpact:.68, combo:1.1,
};

export const COMBO_WINDOW = 1.55;
export const COMBO_MILESTONES = { 5:'GOOD', 10:'GREAT', 20:'AMAZING', 50:'LEGENDARY' };

export function createCombatPresentationState(raw = {}) {
  return {
    sequence: Math.max(0, Number(raw.sequence) || 0),
    elapsed: 0,
    events: [],
    combo: { count:0, remaining:0, label:'' },
    shake: { intensity:0, duration:0, remaining:0, frequency:0, falloff:1, x:0, y:0 },
  };
}

export function emitCombatEvent(state, event = {}) {
  if (!state) return null;
  state.sequence += 1;
  const item = {
    id: `combat-${state.sequence}`,
    type: event.type || 'hit', source: event.source || 'system', target: event.target || null,
    value: Number(event.value) || 0, x: Number(event.x) || 0, y: Number(event.y) || 0,
    createdAt: state.elapsed, elapsed:0,
    duration: Math.max(.05, Number(event.duration) || DEFAULT_DURATION[event.type] || .6),
    payload: { ...(event.payload || {}) },
  };
  state.events.push(item);
  const max = event.powerSave ? 18 : 42;
  if (state.events.length > max) state.events.splice(0, state.events.length - max);
  return item;
}

export function triggerCombatShake(state, { intensity=3, duration=.2, frequency=34, falloff=1 } = {}, powerSave = false) {
  if (!state) return;
  const scale = powerSave ? 0 : 1;
  state.shake = { intensity:intensity*scale, duration, remaining:duration, frequency, falloff, x:0, y:0 };
}

export function recordComboHit(state, options = {}) {
  if (!state) return 0;
  state.combo.count = state.combo.remaining > 0 ? state.combo.count + 1 : 1;
  state.combo.remaining = COMBO_WINDOW;
  state.combo.label = COMBO_MILESTONES[state.combo.count] || '';
  if (state.combo.label) emitCombatEvent(state, { type:'combo', source:'system', target:'hud', x:195, y:70, payload:{ count:state.combo.count, label:state.combo.label }, powerSave:options.powerSave });
  return state.combo.count;
}

export function updateCombatPresentation(state, dt, powerSave = false) {
  if (!state) return;
  const step = Math.max(0, Math.min(.1, Number(dt) || 0));
  state.elapsed += step;
  for (const event of state.events) event.elapsed += step;
  state.events = state.events.filter(event => event.elapsed < event.duration);
  state.combo.remaining = Math.max(0, state.combo.remaining - step);
  if (state.combo.remaining <= 0) { state.combo.count = 0; state.combo.label = ''; }
  const shake = state.shake;
  shake.remaining = Math.max(0, shake.remaining - step);
  if (powerSave || shake.remaining <= 0 || shake.intensity <= 0) { shake.x = 0; shake.y = 0; return; }
  const progress = shake.duration ? shake.remaining / shake.duration : 0;
  const amplitude = shake.intensity * Math.pow(progress, shake.falloff || 1);
  const phase = state.elapsed * shake.frequency;
  shake.x = Math.sin(phase) * amplitude;
  shake.y = Math.cos(phase * 1.37) * amplitude * .65;
}

export function clearCombatEvents(state, { resetCombo=false } = {}) {
  if (!state) return;
  state.events.length = 0;
  state.shake = { intensity:0, duration:0, remaining:0, frequency:0, falloff:1, x:0, y:0 };
  if (resetCombo) state.combo = { count:0, remaining:0, label:'' };
}

export function activeCombatEvents(state, type = null) {
  return (state?.events || []).filter(event => event.elapsed < event.duration && (!type || event.type === type));
}

export function getCombatOffset(state, target) {
  let offset = 0;
  for (const event of activeCombatEvents(state, 'knockback')) {
    if (event.target !== target) continue;
    const progress = event.elapsed / event.duration;
    const direction = event.payload?.direction || 1;
    const distance = event.payload?.distance || 10;
    offset += Math.sin(Math.min(1, progress) * Math.PI) * distance * direction;
  }
  return offset;
}
