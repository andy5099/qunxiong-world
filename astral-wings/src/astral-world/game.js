import { MAPS, SKILLS, SLOTS } from './data.js';
import { addExp, createEquipment, enhanceChance, enhanceCost, enemyFor, petFromEnemy, recompute } from './core.js';
import { saveState } from './save.js';

const pick = list => list[Math.floor(Math.random() * list.length)];
const qualityRank = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6, astral: 7 };

export class IdleGame {
  constructor(state, renderer, callbacks = {}) {
    this.state = state;
    this.renderer = renderer;
    this.callbacks = callbacks;
    this.running = false;
    this.last = 0;
    this.frame = 0;
    this.saveIn = 4;
    this.battle = this.newBattle();
    this._bound = time => this.loop(time);
  }

  newBattle() {
    return { enemy: null, spawnIn: 0.45, attackIn: 0.35, enemyAttackIn: 0.7, petIn: 1.2, cooldowns: [0, 0, 0, 0], queuedHits: [], playerFlash: 0, playerAction: 'idle', playerActionIn: 0, reviveIn: 0, bossMode: false, killing: false };
  }

  start() { if (!this.running) { this.running = true; this.last = performance.now(); this.frame = requestAnimationFrame(this._bound); } }
  stop() { this.running = false; if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
  loop(time) { if (!this.running) return; const dt = Math.min(.08, Math.max(0, (time - this.last) / 1000)); this.last = time; this.update(dt); this.frame = requestAnimationFrame(this._bound); }

  update(dt) {
    const { state, battle } = this;
    state.stats.battleSeconds += dt;
    if (state.player.hp > 0 && state.player.regen) state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.regen * dt);
    this.saveIn -= dt;
    this.renderer.setScene({ state, battle });
    this.renderer.update(dt);
    if (battle.reviveIn > 0) {
      battle.reviveIn -= dt;
      if (battle.reviveIn <= 0) { state.player.hp = state.player.maxHp; state.player.shield = 0; battle.playerAction = 'revive'; battle.playerActionIn = .72; battle.spawnIn = .65; this.event('重新集結', '星界能量讓你恢復滿生命，繼續探索。'); }
      this.flush(); return;
    }
    if (!battle.enemy) { battle.spawnIn -= dt; if (battle.spawnIn <= 0) this.spawn(battle.bossMode); this.flush(); return; }
    const enemy = battle.enemy;
    enemy.hit = Math.max(0, enemy.hit - dt); battle.playerActionIn = Math.max(0, battle.playerActionIn - dt); if (battle.playerActionIn <= 0 && battle.playerAction !== 'downed') battle.playerAction = 'idle';
    battle.playerFlash = Math.max(0, battle.playerFlash - dt);
    battle.attackIn -= dt; battle.enemyAttackIn -= dt; battle.petIn -= dt;
    for (let i = 0; i < battle.cooldowns.length; i += 1) battle.cooldowns[i] = Math.max(0, battle.cooldowns[i] - dt);
    for (let i = battle.queuedHits.length - 1; i >= 0; i -= 1) {
      const hit = battle.queuedHits[i]; hit.in -= dt;
      if (hit.in <= 0) { this.damageEnemy(hit.damage, hit.label, hit.color); battle.queuedHits.splice(i, 1); }
    }
    if (battle.attackIn <= 0) { this.basicAttack(); battle.attackIn += Math.max(.34, state.player.attackSpeed); }
    this.autoSkills();
    if (battle.petIn <= 0) { this.petAttack(); battle.petIn += 2.1; }
    if (enemy.alive && battle.enemyAttackIn <= 0) { this.damagePlayer(enemy.attack); battle.enemyAttackIn += enemy.attackSpeed; }
    this.flush();
  }

  spawn(isBoss = false) {
    const map = MAPS[this.state.mapId - 1];
    const source = isBoss ? map.boss : pick(map.mobs);
    this.battle.enemy = enemyFor(source, map.id, this.state.stage, isBoss);
    this.battle.enemy.alive = true;
    this.battle.enemyAttackIn = isBoss ? 1.25 : .85;
    this.battle.bossMode = isBoss;
    this.event(isBoss ? '區域 Boss 降臨' : '遭遇怪物', this.battle.enemy.name);
  }

  basicAttack() {
    this.battle.playerAction = 'attack'; this.battle.playerActionIn = .24;
    const critical = Math.random() < this.state.player.crit;
    this.damageEnemy(this.state.player.attack * (critical ? this.state.player.critDamage : 1), '星刃普攻', critical ? '#ffe38b' : '#8cdfff', critical);
  }

  autoSkills() { for (let i = 0; i < SKILLS.length; i += 1) { if (['kill_first','manual_skill'].includes(this.state.objectives?.currentId) && i === 0) continue; if (this.state.skillAuto[i] && this.battle.cooldowns[i] <= 0) this.castSkill(i); } }
  castSkill(index) {
    const skill = SKILLS[index];
    if (!skill || !this.battle.enemy || this.battle.cooldowns[index] > 0) return false;
    const level = this.state.skills[index] || 1;
    const power = skill.power + (level - 1) * skill.perLevel;
    this.battle.cooldowns[index] = skill.cooldown;
    this.battle.playerAction = `skill${index + 1}`; this.battle.playerActionIn = index === 3 ? .52 : .36;
    if (index === 2) {
      const shield = this.state.player.maxHp * power;
      this.state.player.shield = Math.min(this.state.player.maxHp * .65, this.state.player.shield + shield);
      this.renderer.pulse('shield', 110, 315, '#a4d8ff', 44);
      this.event(skill.name, `獲得 ${Math.floor(shield)} 點星光護盾。`);
    } else if (index === 1) {
      for (let hit = 0; hit < 3; hit += 1) this.battle.queuedHits.push({ in: .1 + hit * .18, damage: this.state.player.attack * power, label: skill.name, color: '#9a8cff' });
      this.renderer.pulse('slash', 267, 270, '#a998ff', 46);
      this.event(skill.name, '三段星光斬擊依序命中。');
    } else {
      let damage = this.state.player.attack * power;
      if (index === 3 && this.battle.enemy.hp / this.battle.enemy.maxHp < .25) damage *= 1.5;
      this.damageEnemy(damage, skill.name, index === 3 ? '#ffd06f' : '#75dcff', index === 3);
      this.renderer.pulse(index === 3 ? 'burst' : 'slash', 275, 265, index === 3 ? '#ffd16a' : '#67d8ff', index === 3 ? 65 : 42);
      this.event(skill.name, `Lv.${level} 技能已施放。`);
    }
    return true;
  }

  damageEnemy(raw, label, color, forcedCritical = false) {
    const enemy = this.battle.enemy;
    if (!enemy?.alive) return;
    if (label !== '星刃普攻') raw *= 1 + (this.state.player.skillDamage || 0);
    if (enemy.boss) raw *= 1 + (this.state.player.bossDamage || 0);
    const reduced = Math.max(1, raw * (100 / (100 + enemy.defense)));
    enemy.hp = Math.max(0, enemy.hp - reduced); enemy.hit = .12;
    this.renderer.damage(reduced, 278, 242, forcedCritical, color); this.renderer.pulse('hit', 278, 268, color, forcedCritical ? 38 : 20);
    if (enemy.hp <= 0) this.killEnemy();
  }

  damagePlayer(raw) {
    const player = this.state.player;
    let amount = Math.max(1, raw * (100 / (100 + player.defense)));
    const shieldDamage = Math.min(player.shield, amount);
    player.shield -= shieldDamage; amount -= shieldDamage; player.hp = Math.max(0, player.hp - amount);
    this.battle.playerFlash = .38; this.battle.playerAction = 'hurt'; this.battle.playerActionIn = .28; this.renderer.damage(shieldDamage + amount, 110, 275, false, '#ff8f9d'); this.renderer.pulse('hit', 110, 305, '#ff859b', 26);
    if (player.hp <= 0) { this.battle.playerAction = 'downed'; this.battle.enemy = null; this.battle.reviveIn = 3; this.event('戰鬥失利', '3 秒後將在目前關卡重新集結。'); }
  }

  petAttack() { const pet = this.state.pets.find(item => item.id === this.state.activePetId); if (pet && this.battle.enemy) this.damageEnemy(pet.attack * (1 + (pet.stars - 1) * .13) * (1 + (this.state.player.petDamage || 0)), `${pet.name} 協同攻擊`, '#ffd979'); }

  killEnemy() {
    const { state, battle } = this; const enemy = battle.enemy;
    if (!enemy || battle.killing) return;
    battle.killing = true; enemy.alive = false;
    this.renderer.pulse('burst', 278, 270, enemy.boss ? '#ffad72' : '#cf8aff', enemy.boss ? 68 : 36);
    const mult = enemy.boss ? 4 : 1; const expResult = addExp(state, enemy.exp * mult * (1 + (state.player.expBonus || 0)));
    state.player.gold += enemy.gold * mult * (1 + (state.player.goldBonus || 0)); state.stats.kills += 1;
    this.quest('kills', 1); this.quest('bosses', enemy.boss ? 1 : 0);
    if (enemy.boss) state.stats.bosses += 1;
    if (expResult.levels > 0) { this.event('等級提升', `已升至 Lv.${state.player.level}，生命、攻擊與防禦提升。`); this.renderer.pulse('burst', 110, 298, '#ffdd71', 52); }
    const needTutorialGear = state.objectives?.currentId === 'first_gear' && state.inventory.length === 0;
    const needTutorialPet = state.objectives?.currentId === 'first_pet' && !state.activePetId;
    if (needTutorialGear || Math.random() < (enemy.boss ? 1 : .23)) this.grantEquipment(enemy.boss);
    if (needTutorialPet || Math.random() < (enemy.boss ? .12 : enemy.captureRate)) this.capture(enemy);
    if (enemy.boss) this.finishBoss(); else this.finishNormal();
    this.event(`擊敗 ${enemy.name}`, `+${Math.floor(enemy.exp * mult)} 經驗、+${Math.floor(enemy.gold * mult)} 金幣`);
    battle.enemy = null; battle.killing = false;
  }

  finishNormal() {
    this.state.killsInStage += 1;
    if (this.state.killsInStage >= 10) {
      if (this.state.settings.autoBoss) { this.battle.bossMode = true; this.battle.spawnIn = 1.15; }
      else { this.battle.bossMode = false; this.event('Boss 已可挑戰', '點擊「挑戰 Boss」開始區域戰。'); }
    } else { this.battle.bossMode = false; this.battle.spawnIn = .65; }
  }

  finishBoss() {
    const state = this.state;
    state.killsInStage = 0;
    if (!state.settings.autoAdvance) { this.battle.bossMode = false; this.battle.spawnIn = 1.1; this.event('關卡完成', '自動推進已關閉，將留在目前關卡繼續探索。'); return; }
    state.stage += 1;
    if (state.stage > 5) {
      if (state.mapId < MAPS.length) { state.mapId += 1; state.highestMap = Math.max(state.highestMap, state.mapId); state.stage = 1; this.event('新地圖解鎖', `${MAPS[state.mapId - 1].name} 已開放探索。`); }
      else state.stage = 5;
    }
    this.battle.bossMode = false; this.battle.spawnIn = 1.1;
  }

  grantEquipment(fromBoss) {
    const state = this.state; const item = createEquipment(state.mapId, fromBoss);
    const autoSellRank = qualityRank[state.settings.autoSell] || 0;
    if (autoSellRank && qualityRank[item.quality] <= autoSellRank) { const value = Math.floor(item.power * 2.4); state.player.gold += value; this.event('自動出售', `${item.name} 已換得 ${value} 金幣。`); return; }
    if (state.inventory.length >= 100) { this.event('背包已滿', `${item.name} 無法放入背包。`); return; }
    state.inventory.push(item); state.stats.equipment += 1; this.quest('equipment', 1);
    let equipped = false;
    if (state.settings.autoEquip) { const current = state.equipped[item.slot]; if (!current || item.power > current.power * 1.05) { state.equipped[item.slot] = item; equipped = true; } }
    recompute(state); this.renderer.pulse('burst', 235, 260, item.color, 44);
    this.event(`${item.name} 掉落`, `${item.label} ${equipped ? '已自動裝備，' : ''}戰力 +${item.power}`);
  }

  capture(enemy) {
    const existing = this.state.pets.find(item => item.source === enemy.name);
    if (existing) { this.state.petFragments[existing.id] = (this.state.petFragments[existing.id] || 0) + 2; this.event('獲得寵物碎片', `${enemy.name} 碎片 +2`); return; }
    const pet = petFromEnemy(enemy); this.state.pets.push(pet); if (!this.state.activePetId) this.state.activePetId = pet.id;
    this.state.stats.captures += 1; this.quest('captures', 1); this.renderer.pulse('burst', 180, 250, '#ffe17d', 60); this.event('收服成功', `成功收服 ${pet.name}！`);
  }

  challengeBoss() { if (this.battle.enemy || this.state.killsInStage < 10) return false; this.battle.bossMode = true; this.battle.spawnIn = .15; return true; }
  setMap(mapId) { if (mapId > this.state.highestMap || mapId < 1 || mapId > MAPS.length) return false; this.state.mapId = mapId; this.state.stage = 1; this.state.killsInStage = 0; this.battle = this.newBattle(); this.event('前往新地圖', MAPS[mapId - 1].name); return true; }
  equip(itemId) { const item = this.state.inventory.find(entry => entry.id === itemId); if (!item) return false; this.state.equipped[item.slot] = item; recompute(this.state); this.event('裝備變更', `${item.name} 已裝備至 ${SLOTS[item.slot].label}`); return true; }
  sell(itemId) { const item = this.state.inventory.find(entry => entry.id === itemId); if (!item || item.locked || this.state.equipped[item.slot]?.id === item.id) return false; this.state.inventory = this.state.inventory.filter(entry => entry.id !== itemId); this.state.player.gold += Math.floor(item.power * 2.4); this.event('出售裝備', `${item.name} 已換成金幣。`); return true; }
  toggleLock(itemId) { const item = this.state.inventory.find(entry => entry.id === itemId); if (!item) return false; item.locked = !item.locked; return true; }
  enhance(itemId) { const item=this.state.inventory.find(entry=>entry.id===itemId); if(!item)return {ok:false,reason:'missing'}; item.enhance=item.enhance||0; const cost=enhanceCost(item); if(this.state.player.gold<cost)return {ok:false,reason:'gold',cost}; this.state.player.gold-=cost; const chance=enhanceChance(item); if(Math.random()<=chance){item.enhance+=1; recompute(this.state); this.renderer.pulse('burst',235,260,item.color,52); this.event('強化成功',`${item.name} +${item.enhance}`);return {ok:true,cost,chance,item};} const down=item.enhance>=10&&Math.random()<.18; if(down)item.enhance-=1; recompute(this.state);this.event('強化失敗',down?'強化等級下降 1 級。':'僅消耗金幣，裝備未損失。');return {ok:false,reason:'fail',cost,chance,down,item}; }
  equipBest() { let changed=0; for(const item of this.state.inventory){const current=this.state.equipped[item.slot];const score=(entry)=>(entry?.power||0)*(1+(entry?.enhance||0)*.08);if(!current||score(item)>score(current)){this.state.equipped[item.slot]=item;changed+=1;}}if(changed){recompute(this.state);this.event('最佳裝備',`已穿戴 ${changed} 件更強裝備。`);}return changed; }
  toggleSkill(index) { this.state.skillAuto[index] = !this.state.skillAuto[index]; return this.state.skillAuto[index]; }
  upgradeSkill(index) { const price = 100 * (this.state.skills[index] || 1); if (this.state.player.gold < price) return false; this.state.player.gold -= price; this.state.skills[index] += 1; recompute(this.state); return true; }
  setActivePet(id) { if (!this.state.pets.some(pet => pet.id === id)) return false; this.state.activePetId = id; recompute(this.state); return true; }
  starPet(id) { const pet = this.state.pets.find(entry => entry.id === id); if (!pet || pet.stars >= 6) return false; const cost = pet.stars * 5; if ((this.state.petFragments[id] || 0) < cost) return false; this.state.petFragments[id] -= cost; pet.stars += 1; pet.attack += Math.max(1, Math.floor(pet.attack * .18)); recompute(this.state); return true; }
  quest(type, amount) { const key = ({ kills: 'kill50', bosses: 'boss3', equipment: 'gear10', captures: 'capture1' })[type]; if (key) this.state.quests.progress[key] = (this.state.quests.progress[key] || 0) + amount; }
  event(title, message) { this.callbacks.onEvent?.({ title, message }); }
  flush() { this.callbacks.onUpdate?.(this.state, this.battle); if (this.saveIn <= 0) { saveState(this.state); this.saveIn = 4; } }
}
