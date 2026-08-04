import { SKILLS } from './data.js?v=27';

export const SKILL_PHASES = Object.freeze(['ready', 'queued', 'casting', 'resolving', 'cooldown']);

const skillMap = new Map(SKILLS.map((skill, index) => [skill.id, { ...skill, index }]));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createSkillCooldowns(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(SKILLS.map(skill => [skill.id, Math.max(0, finite(source[skill.id]))]));
}

export function createSkillAutoSettings(raw = {}, legacy = []) {
  const source = raw && !Array.isArray(raw) && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(SKILLS.map((skill, index) => [
    skill.id,
    typeof source[skill.id] === 'boolean' ? source[skill.id]
      : typeof legacy[index] === 'boolean' ? legacy[index]
        : Boolean(skill.autoCast),
  ]));
}

export function createSkillRuntimeState(raw = {}) {
  const phase = SKILL_PHASES.includes(raw?.phase) ? raw.phase : 'ready';
  return {
    phase,
    skillId: skillMap.has(raw?.skillId) ? raw.skillId : null,
    targetId: raw?.targetId || null,
    remaining: Math.max(0, finite(raw?.remaining)),
    paid: Boolean(raw?.paid),
    resolved: Boolean(raw?.resolved),
  };
}

export function ensureBattle2State(state) {
  const player = state.player ||= {};
  player.maxMp = Math.max(1, finite(player.maxMp, 100));
  player.mpRegenPerSecond = Math.max(0, finite(player.mpRegenPerSecond, 8));
  player.maxRage = Math.max(1, finite(player.maxRage, 100));
  player.mp = clamp(finite(player.mp, player.maxMp), 0, player.maxMp);
  player.rage = clamp(finite(player.rage), 0, player.maxRage);
  state.skillCooldowns = createSkillCooldowns(state.skillCooldowns);
  state.skillAutoSettings = createSkillAutoSettings(state.skillAutoSettings, state.skillAuto);
  state.skillAuto = SKILLS.map(skill => state.skillAutoSettings[skill.id]);
  state.skillRuntimeState = createSkillRuntimeState(state.skillRuntimeState);
  return state;
}

export function getSkillById(id) { return skillMap.get(id) || null; }
export function getSkillPhase(state, skillId) {
  const runtime = state.skillRuntimeState;
  if (runtime?.skillId === skillId && ['queued', 'casting', 'resolving'].includes(runtime.phase)) return runtime.phase;
  return (state.skillCooldowns?.[skillId] || 0) > 0 ? 'cooldown' : 'ready';
}

export function canPaySkill(player, skill) {
  if (!skill) return false;
  return finite(player?.mp) >= finite(skill.mpCost) && finite(player?.rage) >= finite(skill.rageCost);
}

export function skillUnavailableReason(state, skill, targetValid = true) {
  if (!skill) return 'missing';
  const runtime = state.skillRuntimeState;
  if (['queued', 'casting', 'resolving'].includes(runtime?.phase)) return 'casting';
  if ((state.skillCooldowns?.[skill.id] || 0) > 0) return 'cooldown';
  if (!targetValid) return 'target';
  if (finite(state.player?.mp) < finite(skill.mpCost)) return 'mp';
  if (finite(state.player?.rage) < finite(skill.rageCost)) return 'rage';
  return null;
}

export function requestSkillCast(state, skillId, targetId, targetValid = true) {
  ensureBattle2State(state);
  const skill = getSkillById(skillId);
  const reason = skillUnavailableReason(state, skill, targetValid);
  if (reason) return { ok:false, reason };
  state.skillRuntimeState = {
    phase:'queued', skillId, targetId, remaining:0, paid:false, resolved:false,
  };
  return { ok:true, skill };
}

function paySkill(player, skill) {
  if (!canPaySkill(player, skill)) return false;
  player.mp = clamp(player.mp - finite(skill.mpCost), 0, player.maxMp);
  player.rage = clamp(player.rage - finite(skill.rageCost), 0, player.maxRage);
  return true;
}

function refundSkill(player, skill) {
  player.mp = clamp(player.mp + finite(skill?.mpCost), 0, player.maxMp);
  player.rage = clamp(player.rage + finite(skill?.rageCost), 0, player.maxRage);
}

export function cancelActiveSkill(state, { refund = true } = {}) {
  ensureBattle2State(state);
  const runtime = state.skillRuntimeState;
  if (refund && runtime.paid && !runtime.resolved) refundSkill(state.player, getSkillById(runtime.skillId));
  state.skillRuntimeState = createSkillRuntimeState();
}

export function tickSkillCooldowns(state, gameSeconds) {
  ensureBattle2State(state);
  const dt = Math.max(0, finite(gameSeconds));
  for (const skill of SKILLS) state.skillCooldowns[skill.id] = Math.max(0, state.skillCooldowns[skill.id] - dt);
}

export function regenerateBattleResources(state, gameSeconds, inCombat) {
  ensureBattle2State(state);
  const multiplier = inCombat ? 1 : 1.75;
  state.player.mp = clamp(state.player.mp + state.player.mpRegenPerSecond * multiplier * Math.max(0, finite(gameSeconds)), 0, state.player.maxMp);
}

export function addRage(state, amount) {
  ensureBattle2State(state);
  state.player.rage = clamp(state.player.rage + Math.max(0, finite(amount)), 0, state.player.maxRage);
  return state.player.rage;
}

export function retainBattleRage(state, ratio = .8) {
  ensureBattle2State(state);
  state.player.rage = clamp(Math.floor(state.player.rage * clamp(ratio, 0, 1)), 0, state.player.maxRage);
}

export function advanceSkillRuntime(state, gameSeconds, handlers = {}) {
  ensureBattle2State(state);
  const runtime = state.skillRuntimeState;
  const skill = getSkillById(runtime.skillId);
  if (runtime.phase === 'ready') return { phase:'ready' };
  if (runtime.phase === 'cooldown') {
    state.skillRuntimeState = createSkillRuntimeState();
    return { phase:'ready' };
  }
  const targetValid = skill && handlers.isTargetValid?.(runtime.targetId) !== false;
  if (!skill || !targetValid) {
    cancelActiveSkill(state);
    return { phase:'ready', cancelled:true };
  }
  if (runtime.phase === 'queued') {
    if (!paySkill(state.player, skill)) {
      cancelActiveSkill(state, { refund:false });
      return { phase:'ready', cancelled:true, reason:'resource' };
    }
    runtime.phase = 'casting'; runtime.remaining = Math.max(0, finite(skill.castTime)); runtime.paid = true;
    handlers.onCasting?.(skill);
    if (runtime.remaining > 0) return { phase:'casting', skill };
  }
  if (runtime.phase === 'casting') {
    runtime.remaining = Math.max(0, runtime.remaining - Math.max(0, finite(gameSeconds)));
    if (runtime.remaining > 0) return { phase:'casting', skill };
    runtime.phase = 'resolving';
  }
  if (runtime.phase === 'resolving' && !runtime.resolved) {
    runtime.resolved = true;
    handlers.onResolve?.(skill);
    state.skillCooldowns[skill.id] = Math.max(0, finite(skill.cooldown));
    runtime.phase = 'cooldown'; runtime.remaining = state.skillCooldowns[skill.id];
    return { phase:'cooldown', skill, resolved:true };
  }
  return { phase:runtime.phase, skill };
}

export function chooseAutoSkill(state, targetValid = true) {
  ensureBattle2State(state);
  if (['queued', 'casting', 'resolving'].includes(state.skillRuntimeState.phase)) return null;
  return SKILLS
    .filter(skill => state.skillAutoSettings[skill.id] && !skillUnavailableReason(state, skill, targetValid))
    .sort((a, b) => b.priority - a.priority)[0] || null;
}
