import { equipmentTemplates, slotNames } from './data/equipment.js';

const button = (label, action) => `<button data-a="${action}">${label}</button>`;
export const menu = state => `<div class="shell panel menu"><h1>星界戰翼</h1><p class="note">原創直向星際飛行射擊・v0.5</p><p>晨星突擊者 Lv.${state.level}・${'★'.repeat(state.star)}</p><p class="gold">金幣 ${state.gold}・強化材 ${state.materials}・星核 ${state.fragments}・最高分 ${state.high}</p><h3>戰鬥</h3>${button('開始：破碎軌道','start')}${button(`無盡航線・最高波 ${state.endlessBest || 0}`,'endless')}${button('Boss 挑戰','boss')}<h3>養成</h3>${button(`戰機升級（${80 + state.level * 70} 金幣）`,'upgrade')}${button(`戰機升星（${state.star * 5} 星核）`,'star')}${button('裝備與強化','equipment')}${button('任務與成就','missions')}<h3>設定</h3>${button('操作說明','help')}${button('重置存檔','reset')}</div>`;

export const equipmentView = state => {
  const owned = state.equipment;
  const cards = equipmentTemplates.map(template => {
    const item = owned.find(entry => entry.id === template.id);
    const equipped = state.equipped[template.slot] === template.id;
    const controls = item
      ? button(equipped ? '已裝備' : '裝備', `equip:${template.id}`) + button(`強化 +${item.level}（${30 + item.level * 28} 材）`, `enhance:${template.id}`) + (!equipped && !item.locked ? button('分解', `dismantle:${template.id}`) : '')
      : '<em>尚未取得</em>';
    return `<article class="equip ${item ? '' : 'locked'}"><b>${template.name}</b><small>${slotNames[template.slot]}・${template.quality}</small><span>主屬性 +${template.value + (item?.level || 0)}</span>${controls}</article>`;
  });
  return `<div class="shell panel menu"><h2>裝備與強化</h2><p class="note">首通關獲得新手裝備；強化 100% 成功，已裝備物不可分解。</p>${button('消耗 25 材料合成新裝備','craft')}<div class="equip-grid">${cards.join('')}</div>${button('返回主選單','home')}</div>`;
};

export const missionsView = state => {
  const mission = state.missions;
  const daily = [
    ['daily-kills','每日：擊敗 30 名敵人', mission.kills >= 30, '80 金幣'],
    ['daily-stage','每日：完成 1 次關卡', mission.stages >= 1, '4 強化材'],
    ['daily-boss','每日：擊敗 1 次 Boss', mission.bosses >= 1, '2 星核']
  ];
  const achievements = [
    ['ach-first','成就：首次通關', state.complete, '150 金幣'],
    ['ach-combo','成就：最大連擊 25', state.maxCombo >= 25, '8 強化材'],
    ['ach-endless','成就：無盡航線到達第 10 波', state.endlessBest >= 10, '3 星核']
  ];
  const row = ([id, label, ready, reward], claims) => `<article class="mission"><b>${label}</b><span>${ready ? '可領取' : '進行中'}・${reward}</span>${!claims[id] && ready ? button('領取', `claim:${id}`) : `<small>${claims[id] ? '已領取' : '尚未達成'}</small>`}</article>`;
  return `<div class="shell panel menu"><h2>任務與成就</h2><p class="note">每日任務依裝置日期重置；獎勵每次只能領取一次。</p><h3>每日任務</h3>${daily.map(item => row(item, mission.claimed || {})).join('')}<h3>成就</h3>${achievements.map(item => row(item, state.achievements.claimed || {})).join('')}${button('返回主選單','home')}</div>`;
};
