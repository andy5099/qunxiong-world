import { OBJECTIVES } from './objective-system.js';

export const TUTORIAL_STEPS = [
  { title: '自動戰鬥已啟動', text: '星刃使會自動攻擊眼前的怪物。先觀察第一場戰鬥。' },
  { title: '親手施放技能', text: '點擊第一個技能卡，立刻施放星刃斬；冷卻後仍可自動施放。' },
  { title: '角色升級', text: '經驗條滿時會提升等級，並提高生命、攻擊與防禦。' },
  { title: '第一份戰利品', text: '怪物可能掉落裝備；教學期間下一隻怪物必定提供第一件。' },
  { title: '穿上裝備', text: '到背包選擇戰利品並穿戴，戰力會即時提高。' },
  { title: '比較裝備', text: '使用詳情查看綠色提升與紅色下降，再決定是否更換。' },
  { title: '首次強化', text: '把任意裝備強化到 +1；第一次強化成本很低。' },
  { title: '準備挑戰 Boss', text: '擊敗十隻怪物後即可挑戰星光草原的守關 Boss。' },
  { title: '寵物同行', text: '教學會保證獲得第一隻寵物；在寵物頁讓牠出戰。' },
  { title: '踏入下一張地圖', text: '擊敗第一張地圖的 Boss 後，前往幽藍森林完成教學。' },
];

export function ensureTutorial(state) {
  state.tutorial ??= { active: true, step: 0, completed: false, skipped: false, rewardsClaimed: [], manualSkills: 0, inspected: 0 };
  state.tutorial.rewardsClaimed ??= [];
  state.tutorial.manualSkills ??= 0;
  state.tutorial.inspected ??= 0;
  return state.tutorial;
}

export function syncTutorialStep(state) {
  const tutorial = ensureTutorial(state);
  const currentId = state.objectives?.currentId;
  const index = OBJECTIVES.findIndex(objective => objective.id === currentId);
  tutorial.step = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
  return tutorial.step;
}

export function skipTutorial(state) {
  const tutorial = ensureTutorial(state);
  tutorial.active = false;
  tutorial.skipped = true;
}

export function restartTutorial(state) {
  const tutorial = ensureTutorial(state);
  tutorial.active = true;
  tutorial.step = 0;
  tutorial.completed = false;
  tutorial.skipped = false;
}
