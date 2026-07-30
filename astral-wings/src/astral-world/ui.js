import { MAPS, QUALITY, SKILLS, SLOTS } from './data.js';
import { dailyQuests, format } from './core.js';
import { claimOffline, exportSave, importSave, resetSave, saveState } from './save.js';

const iconFor = slot => ({ weapon: '⚔', helmet: '◉', armor: '✦', gloves: '✧', boots: '⌁', necklace: '◈', ring: '◌', wings: '❈' }[slot] || '◇');
const qualityRank = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6, astral: 7 };

export class AstralUI {
  constructor(state, game, renderer, makeItem) {
    this.state = state; this.game = game; this.renderer = renderer; this.makeItem = makeItem;
    this.active = 'battle'; this.logs = []; this.nextBattlePaint = 0; this.skillSignature = '';
    this.$ = id => document.getElementById(id);
    document.addEventListener('click', event => this.handle(event));
    this.renderAll();
  }

  setState(state) { this.state = state; this.game.state = state; this.renderAll(); }
  update(state, battle) {
    this.state = state; this.battle = battle;
    const now = performance.now();
    if (now >= this.nextBattlePaint) {
      this.renderTop(); this.renderHud(); this.renderSkills();
      this.nextBattlePaint = now + 110;
    }
  }
  event({ title, message }) { this.logs.unshift({ title, message }); this.logs = this.logs.slice(0, 5); this.renderLog(); this.toast(`${title}：${message}`); }

  handle(event) {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    if (action === 'page') this.show(button.dataset.page);
    else if (action === 'boss') { if (!this.game.challengeBoss()) this.toast('擊殺 10 隻普通怪物後才能挑戰 Boss。'); }
    else if (action === 'skill') { this.game.toggleSkill(Number(button.dataset.index)); this.renderSkills(); }
    else if (action === 'skillUp') { if (!this.game.upgradeSkill(Number(button.dataset.index))) this.toast('金幣不足。'); this.renderAll(); }
    else if (action === 'equip') { this.game.equip(button.dataset.id); this.renderAll(); }
    else if (action === 'sell') { this.game.sell(button.dataset.id) ? this.renderAll() : this.toast('已裝備或鎖定的裝備不能出售。'); }
    else if (action === 'lock') { this.game.toggleLock(button.dataset.id); this.renderAll(); }
    else if (action === 'pet') { this.game.setActivePet(button.dataset.id); this.renderAll(); }
    else if (action === 'petStar') { this.game.starPet(button.dataset.id) ? this.renderAll() : this.toast('碎片不足或已達最高星級。'); }
    else if (action === 'map') { this.game.setMap(Number(button.dataset.id)); this.show('battle'); }
    else if (action === 'claimQuest') this.claimQuest(button.dataset.id);
    else if (action === 'offline') this.openOffline();
    else if (action === 'modalClose') this.closeModal();
    else if (action === 'save') { saveState(this.state); this.toast('已儲存到本機瀏覽器。'); }
    else if (action === 'export') this.export();
    else if (action === 'import') this.import();
    else if (action === 'sellSetting') { const order=['none','common','uncommon','rare']; const index=order.indexOf(this.state.settings.autoSell); this.state.settings.autoSell=order[(index+1)%order.length]; this.renderSettings(); saveState(this.state); }
    else if (action === 'reset') this.reset();
    else if (action === 'toggle') { this.state.settings[button.dataset.key] = !this.state.settings[button.dataset.key]; this.renderSettings(); saveState(this.state); }
  }

  show(page) {
    this.active = page;
    document.querySelectorAll('.screen').forEach(section => section.classList.toggle('active', section.dataset.screen === page));
    document.querySelectorAll('.bottom-nav button').forEach(button => button.classList.toggle('active', button.dataset.page === page));
    if (page === 'character') this.renderCharacter(); if (page === 'equipment') this.renderEquipment(); if (page === 'pets') this.renderPets(); if (page === 'maps') this.renderMaps(); if (page === 'inventory') this.renderInventory(); if (page === 'quests') this.renderQuests(); if (page === 'settings') this.renderSettings();
  }

  renderAll() { this.skillSignature = ''; this.renderTop(); this.renderHud(); this.renderSkills(); this.renderLog(); ['character','equipment','pets','maps','inventory','quests','settings'].forEach(name => { if (this.active === name) this.show(name); }); }
  renderTop() { const p = this.state.player; this.$('level').textContent = p.level; this.$('power').textContent = format(p.power); this.$('gold').textContent = format(p.gold); this.$('xpFill').style.width = `${Math.min(100, p.exp / p.nextExp * 100)}%`; }
  renderHud() { const p = this.state.player; const b = this.battle; this.$('mapName').textContent = MAPS[this.state.mapId - 1].name; this.$('stageLabel').textContent = `${this.state.mapId}-${this.state.stage}`; this.$('playerHp').style.width = `${p.hp / p.maxHp * 100}%`; this.$('playerHpText').textContent = `${Math.floor(p.hp)} / ${Math.floor(p.maxHp)}`; this.$('playerShield').style.width = `${Math.min(100, p.shield / (p.maxHp * .65) * 100)}%`; this.$('playerShieldText').textContent = Math.floor(p.shield); this.$('killProgress').textContent = `${this.state.killsInStage} / 10`; this.$('battleState').textContent = b?.enemy?.boss ? `Boss：${b.enemy.name}` : b?.reviveIn > 0 ? `復甦 ${Math.ceil(b.reviveIn)} 秒` : '自動探索'; const boss = this.$('bossButton'); boss.disabled = Boolean(b?.enemy) || this.state.killsInStage < 10; boss.textContent = b?.enemy?.boss ? b.enemy.name : '挑戰 Boss'; }
  renderSkills() { const wrap = this.$('skills'); const cd = this.battle?.cooldowns || [0,0,0,0]; const signature = `${this.state.skills.join(',')}|${this.state.skillAuto.join(',')}|${cd.map(value=>value.toFixed(1)).join(',')}`; if (signature === this.skillSignature) return; this.skillSignature = signature; wrap.innerHTML = SKILLS.map((skill, index) => `<button class="skill-card ${this.state.skillAuto[index] ? '' : 'off'}" data-action="skill" data-index="${index}"><i>${['⌁','✦','◌','✹'][index]}</i><b>${skill.name}</b><small>Lv.${this.state.skills[index]} ${this.state.skillAuto[index] ? '自動' : '關閉'}</small>${cd[index] > 0 ? `<span class="cool">${cd[index].toFixed(1)}</span>` : ''}</button>`).join(''); }
  renderLog() { this.$('eventLog').innerHTML = this.logs.map(item => `<p><b>${item.title}</b>　${item.message}</p>`).join(''); }

  page(title, subtitle, content) { return `<section class="page"><header class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div><button class="action" data-action="page" data-page="battle">返回戰鬥</button></header>${content}</section>`; }
  renderCharacter() { const p=this.state.player; this.$('characterPage').innerHTML=this.page('星界冒險者','星刃使 · 持續探索星界',`<div class="panel hero-card"><div class="hero-art"></div><div><b>戰力 ${format(p.power)}</b><p>等級 ${p.level}　暴擊 ${(p.crit*100).toFixed(0)}%</p><div class="stat-grid"><div><span>攻擊</span><b>${Math.floor(p.attack)}</b></div><div><span>生命</span><b>${Math.floor(p.maxHp)}</b></div><div><span>防禦</span><b>${Math.floor(p.defense)}</b></div><div><span>攻速</span><b>${p.attackSpeed.toFixed(2)}s</b></div></div></div></div><div class="panel"><b>技能成長</b>${SKILLS.map((s,i)=>`<div class="quest"><div><h3>${s.name}　Lv.${this.state.skills[i]}</h3><p>${s.description} · 冷卻 ${s.cooldown} 秒</p></div><button class="action" data-action="skillUp" data-index="${i}">升級 ${100*this.state.skills[i]}G</button></div>`).join('')}</div>`); }
  renderEquipment() { const equipped=Object.values(this.state.equipped); this.$('equipmentPage').innerHTML=this.page('星界裝備','八個部位會直接影響攻擊、生存與戰力',`<div class="panel slot-grid">${Object.entries(SLOTS).map(([id,slot])=>{const item=this.state.equipped[id];return `<div class="slot ${item?`quality-${item.quality}`:''}"><i>${iconFor(id)}</i><span>${slot.label}</span><b>${item?.name||'未裝備'}</b></div>`}).join('')}</div><div class="panel"><b>目前加成</b><p>已裝備 ${equipped.length}/8 件 · 攻擊 ${Math.floor(this.state.player.attack)} · 生命 ${Math.floor(this.state.player.maxHp)}</p><button class="action" data-action="page" data-page="inventory">前往背包更換</button></div>`); }
  renderInventory() { const items=[...this.state.inventory].sort((a,b)=>qualityRank[b.quality]-qualityRank[a.quality]||b.power-a.power); this.$('inventoryPage').innerHTML=this.page('星界背包',`${items.length} / 100 格 · 已按品質與戰力排列`, `<div class="panel"><b>自動裝備</b><p>${this.state.settings.autoEquip?'已開啟：較強裝備會自動穿戴。':'已關閉：掉落裝備將保留在背包。'}</p><button class="action" data-action="toggle" data-key="autoEquip">切換自動裝備</button></div><div class="item-list">${items.length?items.map(item=>this.item(item)).join(''):'<div class="panel">尚未取得裝備，持續擊敗怪物與 Boss 吧。</div>'}</div>`); }
  item(item) { const equipped=this.state.equipped[item.slot]?.id===item.id; return `<article class="item-card quality-${item.quality}"><div class="icon">${iconFor(item.slot)}</div><div><h3>${item.name}</h3><p>${item.label} · Lv.${item.level} · 戰力 +${item.power}</p><p>${Object.entries(item.stats).map(([k,v])=>`${k}+${Math.round(v)}`).join('　')}</p></div><div class="tiny-actions"><button data-action="equip" data-id="${item.id}">${equipped?'已穿戴':'裝備'}</button><button data-action="lock" data-id="${item.id}">${item.locked?'解鎖':'鎖定'}</button><button data-action="sell" data-id="${item.id}">出售</button></div></article>`; }
  renderPets() { const pets=this.state.pets; this.$('petsPage').innerHTML=this.page('星靈寵物','收服怪物後，牠會自動在戰鬥中協助攻擊。', `<div class="panel"><b>主戰寵物</b><p>${pets.find(p=>p.id===this.state.activePetId)?.name || '尚未收服任何寵物'}</p></div><div class="item-list">${pets.length?pets.map(p=>`<article class="item-card quality-${p.quality}"><div class="icon">✧</div><div><h3>${p.name}</h3><p>Lv.${p.level} · ${p.stars} 星 · 攻擊 ${p.attack}</p><p>碎片 ${this.state.petFragments[p.id]||0} / ${p.stars*5}</p></div><div class="tiny-actions"><button data-action="pet" data-id="${p.id}">${p.id===this.state.activePetId?'出戰中':'出戰'}</button><button data-action="petStar" data-id="${p.id}">升星</button></div></article>`).join(''):'<div class="panel">擊敗可收服怪物時，有機會出現收服光效。</div>'}</div>`); }
  renderMaps() { this.$('mapsPage').innerHTML=this.page('星界地圖',`已推進至 ${MAPS[this.state.highestMap-1].name}`, MAPS.map(map=>`<article class="map-card ${map.id>this.state.highestMap?'locked':''}"><h2>${map.id}. ${map.name}</h2><p>${map.description} · Boss：${map.boss[0]}</p><button class="action" data-action="map" data-id="${map.id}" ${map.id>this.state.highestMap?'disabled':''}>${map.id===this.state.mapId?'探索中':'前往'}</button><small>普通怪：${map.mobs.map(m=>m[0]).join('、')}</small></article>`).join('')); }
  renderQuests() { const quests=dailyQuests(); this.$('questsPage').innerHTML=this.page('每日任務','依本機日期更新；獎勵只能領取一次。', `<div class="panel">今日：${this.state.quests.date}</div>${quests.map(q=>{const value=this.state.quests.progress[q.id]||0, done=value>=q.target, claimed=this.state.quests.claimed[q.id];return `<div class="panel quest"><div><h3>${q.name}</h3><p>${Math.min(value,q.target)} / ${q.target}　獎勵：${q.reward.gold} 金幣</p><div class="xp-bar"><i style="width:${Math.min(100,value/q.target*100)}%"></i></div></div><button class="action" data-action="claimQuest" data-id="${q.id}" ${!done||claimed?'disabled':''}>${claimed?'已領取':'領取'}</button></div>`}).join('')}`); }
  claimQuest(id) { const q=dailyQuests().find(item=>item.id===id); if(!q||this.state.quests.claimed[id]||(this.state.quests.progress[id]||0)<q.target)return; this.state.quests.claimed[id]=true;this.state.player.gold+=q.reward.gold;this.toast(`已領取 ${q.reward.gold} 金幣`);this.renderQuests();saveState(this.state); }
  renderSettings() { const s=this.state.settings; const sellName={none:'不自動出售',common:'普通以下',uncommon:'優良以下',rare:'稀有以下'}[s.autoSell]||'不自動出售'; this.$('settingsPage').innerHTML=this.page('設定與存檔','所有資料僅儲存在目前瀏覽器。',`<div class="panel">${[['autoBoss','自動挑戰 Boss'],['autoAdvance','自動推進關卡'],['autoEquip','自動裝備'],['vibration','畫面震動'],['damageNumbers','傷害數字'],['powerSave','省電模式']].map(([k,n])=>`<div class="setting"><span>${n}</span><button class="action" data-action="toggle" data-key="${k}">${s[k]?'開啟':'關閉'}</button></div>`).join('')}<div class="setting"><span>自動出售</span><button class="action" data-action="sellSetting">${sellName}</button></div></div><div class="panel"><button class="action" data-action="offline">離線收益</button> <button class="action" data-action="save">手動儲存</button><br><br><button class="action" data-action="export">匯出存檔</button> <button class="action" data-action="import">匯入存檔</button><br><br><button class="action" data-action="reset">重置遊戲</button></div>`); }
  openOffline() { const pending=this.state.offlinePending; const description=pending?`離線 ${Math.floor(pending.seconds/3600)} 小時 ${Math.floor(pending.seconds%3600/60)} 分鐘<br>經驗 ${format(pending.exp)}、金幣 ${format(pending.gold)}、裝備 ${pending.equipment} 件、碎片 ${pending.fragments} 個。`:'目前沒有可領取的離線收益。'; this.openModal('離線星界收益',description,pending?`<button data-action="modalClose" data-claim="1">領取收益</button>`:'<button data-action="modalClose">確定</button>'); }
  openModal(title, text, actionHtml) { this.$('modalCard').innerHTML=`<h2>${title}</h2><p>${text}</p>${actionHtml}`; const modal=this.$('modal'); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); const close=this.$('modalCard').querySelector('[data-action="modalClose"]'); close?.addEventListener('click',()=>{if(close.dataset.claim==='1'){const reward=claimOffline(this.state,this.makeItem);if(reward)this.toast('離線收益已加入帳戶與背包。');}this.closeModal();this.renderAll();}); }
  closeModal(){const modal=this.$('modal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
  export(){const blob=new Blob([exportSave(this.state)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='astral-world-save.json';a.click();URL.revokeObjectURL(a.href);}
  import(){const input=document.createElement('input');input.type='file';input.accept='application/json';input.onchange=async()=>{try{this.setState(importSave(await input.files[0].text()));this.toast('存檔已匯入。');}catch{this.toast('匯入失敗：檔案格式不正確。');}};input.click();}
  reset(){if(!confirm('確定要重置《Astral World》存檔嗎？此動作無法復原。'))return;if(!confirm('再次確認：所有本遊戲進度都會清除。'))return;this.setState(resetSave());this.game.battle=this.game.newBattle();this.toast('已重置 Astral World 存檔。');}
  toast(message){const toast=this.$('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);}
}
