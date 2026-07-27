import { equipmentTemplates, slotNames, fusionForms } from './data/equipment.js';

const button = (label, action, disabled = false) => `<button data-a="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const stars = count => '★'.repeat(count || 0);
const equippedIds = state => Object.values(state.equipped || {});

export const menu = state => `<div class="shell panel menu">
  <div class="art-banner"><div><h1>星界戰翼</h1><p>原創直向星際射擊</p></div></div>
  <p class="gold">金幣 ${state.gold}　強化材 ${state.materials}　星核 ${state.fragments}　最高分 ${state.high}</p>
  <p>晨星突擊者　Lv.${state.level}　${stars(state.star)}</p>
  <h3>戰鬥</h3>${button('主線關卡','stages')}${button(`無盡航線・最高波 ${state.endlessBest || 0}`,'endless')}${button('Boss 挑戰','boss')}
  <h3>養成</h3>${button(`戰機升級（${80 + state.level * 70} 金幣）`,'upgrade')}${button(`戰機升星（${state.star * 5} 星核）`,'star')}${button('裝備、強化與合成','equipment')}${button('合體、覺醒與進化','fusion')}
  <h3>目標</h3>${button('任務與成就','missions')}${button('星域圖鑑','codex')}
  <h3>其他</h3>${button('操作說明','help')}${button('重置存檔','reset')}
</div>`;

export const stageView = (state, stages) => `<div class="shell panel menu"><h2>主線星域</h2><p class="note">通關目前區域即可解鎖下一個星域；每關都有固定波次、補給與三階段原創 Boss。</p><div class="stage-grid">${stages.map(stage => {
  const open = state.unlockedStages.includes(stage.id); const done = Boolean(state.stageProgress?.[stage.id]);
  return `<article class="stage-card ${open ? '' : 'locked'}"><b>${stage.name}</b><small>${stage.subtitle}</small><span>${done ? '已通關' : open ? '可出擊' : `解鎖：${stage.unlock}`}</span>${button(open ? '進入關卡' : '尚未解鎖', `stage:${stage.id}`, !open)}</article>`;
}).join('')}</div>${button('返回主選單','home')}</div>`;

export const equipmentView = state => {
  const cards = equipmentTemplates.map(template => {
    const item = state.equipment.find(entry => entry.id === template.id);
    const equipped = state.equipped[template.slot] === template.id;
    const controls = item ? `${button(equipped ? '已裝備' : '穿戴', `equip:${template.id}`)}${button(`強化 +${item.level}（${30 + item.level * 28} 材料）`, `enhance:${template.id}`)}${!equipped && !item.locked ? button('分解', `dismantle:${template.id}`) : ''}` : '<em>尚未取得</em>';
    return `<article class="equip ${item ? '' : 'locked'}"><b>${template.name}</b><small>${slotNames[template.slot]}・${template.quality}</small><span>基礎增幅 +${template.value + (item?.level || 0)}</span>${controls}</article>`;
  }).join('');
  const qualities = ['普通','優良','稀有','史詩'];
  return `<div class="shell panel menu"><h2>裝備庫</h2><p class="note">每個欄位只會套用一件裝備；已裝備或鎖定的物品不會被分解。強化必定成功。</p>${button('製作隨機裝備（25 材料）','craft')}<h3>三件合成升階</h3>${qualities.map((q, index) => button(`${q} → ${qualities[index + 1] || '傳說'} 合成`, `synth:${q}`, index === qualities.length - 1)).join('')}<div class="equip-grid">${cards}</div>${button('返回主選單','home')}</div>`;
};

export const missionsView = state => {
  const m = state.missions; const claimed = m.claimed || {}; const achievements = state.achievements.claimed || {};
  const row = (id, title, ready, reward, group) => `<article class="mission"><b>${title}</b><span>${reward}</span>${ready && !(group === 'daily' ? claimed[id] : achievements[id]) ? button('領取', `claim:${id}`) : `<small>${(group === 'daily' ? claimed[id] : achievements[id]) ? '已領取' : '進行中'}</small>`}</article>`;
  return `<div class="shell panel menu"><h2>任務與成就</h2><h3>每日任務</h3>${row('daily-kills',`擊敗敵機 30 / ${m.kills || 0}`,m.kills >= 30,'80 金幣','daily')}${row('daily-stage',`完成關卡 1 / ${m.stages || 0}`,m.stages >= 1,'4 強化材料','daily')}${row('daily-boss',`擊敗 Boss 1 / ${m.bosses || 0}`,m.bosses >= 1,'2 星核','daily')}<h3>成就</h3>${row('ach-first','首次通關',state.complete,'150 金幣','achievement')}${row('ach-combo',`最高連擊 25 / ${state.maxCombo}`,state.maxCombo >= 25,'8 強化材料','achievement')}${row('ach-endless',`無盡抵達第 10 波 / ${state.endlessBest || 0}`,state.endlessBest >= 10,'3 星核','achievement')}${button('返回主選單','home')}</div>`;
};

export const fusionView = state => `<div class="shell panel menu"><h2>戰翼工坊</h2><div class="art-preview" aria-label="原創 AI 戰機與敵機設計圖"></div><p class="note">合體僅在持有對應組件時可啟動；覺醒與進化會套用到出戰戰機。</p><div class="equip-grid">${fusionForms.map(form => { const ready = form.need.every(id => state.equipment.some(item => item.id === id)); return `<article class="equip ${ready ? '' : 'locked'}"><b>${form.name}</b><small>${form.need.join(' + ')}</small><span>${form.effect}</span>${ready ? button(state.fusion === form.id ? '目前啟用' : '啟動合體', `fusion:${form.id}`) : '<em>缺少組件</em>'}</article>`; }).join('')}</div><p>覺醒 ${state.fusionAwaken}/3　進化 ${state.fusionEvolution}/2</p>${button(`覺醒（${16 + state.fusionAwaken * 10} 材料）`,'awaken')}${button(`進化（${4 + state.fusionEvolution * 3} 星核）`,'evolve')}${button('返回主選單','home')}</div>`;

export const codexView = (state, stages) => `<div class="shell panel menu"><h2>星域圖鑑</h2><div class="art-preview compact" aria-label="原創 AI 星際機體設計圖"></div><h3>航線紀錄</h3>${stages.map(entry => `<article class="mission"><b>${entry.name}</b><span>${state.unlockedStages.includes(entry.id) ? '已發現・Boss：' + entry.boss : '尚未發現'}</span></article>`).join('')}<h3>已取得裝備</h3><p>${state.equipment.length} / ${equipmentTemplates.length} 件</p>${button('返回主選單','home')}</div>`;
