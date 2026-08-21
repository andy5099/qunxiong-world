import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SAVE_VERSION, createBlackwindLeader, createCrimsonTiger, createNetherThunderBeast, createYellowBossMember } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { createBossEncounter, resolveMarbleEvent, retreatFlipperBattle, updateFlipperSystems } from '../src/engine.js';
import { BOND_DATA, discoverActiveBonds, executeBondCombo, getActiveBonds, getFormableBonds, initializeBondRuntime, normalizeBondState, updateBondScheduler } from '../src/bond-system.js';
import { render, renderMarblePanel } from '../src/ui.js';

let passed=0;const ok=(value,message)=>{assert.ok(value,message);passed++;},equal=(a,b,message)=>{assert.equal(a,b,message);passed++;};
const member=(state,id)=>state.party.find(unit=>unit?.id===id);
const bossState=party=>{const state=createState('羈絆測試');state.unlocks.stronghold=true;state.screen='stronghold';state.party=party;state.ui.bossWarning=true;state.ui.bossRarityRank=3;createBossEncounter(state,3);state.battle.enemies[0].maxHp=state.battle.enemies[0].hp=1e8;state.battle.marble.phase='pinball';initializeBondRuntime(state,state.battle.marble);return state;};

equal(SAVE_VERSION,16,'save version 16');
equal(BOND_DATA.length,8,'central bond table includes seven core bonds plus second-priority weak bond');
for(const bond of BOND_DATA)for(const key of ['id','name','requiredCharacterIds','minimumActiveCount','triggerType','effectType','cooldown','priority','visualTheme','description'])ok(bond[key]!=null,`${bond.id} has ${key}`);

const base=createState('組隊');const hero=base.party[0],liu=base.party[1],guan=base.party[2],zhang=base.party[3];
let party=[liu,guan,zhang,null,null];
ok(getActiveBonds(party).some(b=>b.id==='peach-oath'),'peach oath activates with three brothers');
party=[guan,zhang,null,liu,null];
ok(getActiveBonds(party).some(b=>b.id==='peach-oath'),'Liu Bei support activates peach oath');
ok(getActiveBonds(party).some(b=>b.id==='ten-thousand'),'ten thousand enemies activates');
ok(getActiveBonds([hero,liu,null,null,null]).some(b=>b.id==='zhaolie-spirit'),'Zhaolie spirit activates');
const captain=createYellowBossMember('yellow-captain'),commander=createYellowBossMember('yellow-commander'),bao=createYellowBossMember('zhang-bao');
ok(getActiveBonds([captain,commander,bao,null,null]).some(b=>b.id==='yellow-heaven'),'yellow heaven activates');
ok(getActiveBonds([captain,commander,null,null,null]).some(b=>b.id==='yellow-vanguard'),'yellow vanguard activates');
ok(getActiveBonds([createBlackwindLeader(),bao,null,null,null]).some(b=>b.id==='blackwind-thunder'),'blackwind thunder activates');
ok(getActiveBonds([createCrimsonTiger(),createNetherThunderBeast(),hero,null,null]).some(b=>b.id==='fire-thunder'),'fire thunder activates');
ok(getActiveBonds([guan,bao,null,null,null]).some(b=>b.id==='saint-thunder'),'saint thunder implemented');

const forming=getFormableBonds([liu,guan,null,null,null],zhang,2);ok(forming.some(b=>b.id==='peach-oath'),'candidate UI can preview newly formed bond');
const discovery=createState('發現');discovery.party=[liu,guan,zhang,null,null];equal(discoverActiveBonds(discovery).length,2,'multiple valid bonds discovered once');equal(discoverActiveBonds(discovery).length,0,'discovery does not repeat');
const migrated=normalize({...createState('舊存檔'),version:15,bonds:undefined});equal(migrated.version,16,'old save migrates');ok(Array.isArray(migrated.bonds.discovered),'old save gains bond codex');equal(normalizeBondState({discovered:['bad']}).discovered.length,0,'unknown bond ids removed safely');

const peach=bossState([liu,guan,zhang,null,null]),pm=peach.battle.marble,boss=peach.battle.enemies[0],before=boss.hp;pm.stats.breaks++;const triggered=updateBondScheduler(peach,.02);equal(triggered.id,'peach-oath','break scheduler prioritizes peach oath');ok(boss.hp<before,'peach combo deals real damage');ok(pm.breakGauge>=32,'peach combo adds break');ok(pm.skills.every(slot=>!slot||slot.energy>=10),'peach combo restores skill gauge');ok(pm.bonds.cooldowns['peach-oath']>0,'bond cooldown starts');equal(updateBondScheduler(peach,.02),null,'cooldown prevents immediate replay');

const counter=bossState([captain,commander,bao,null,null]);counter.battle.marble.stats.perfectCounters++;const counterBond=updateBondScheduler(counter,.02);equal(counterBond.id,'yellow-heaven','counter scheduler selects survival/control bond');ok(counter.battle.marble.supportGuard===1,'yellow heaven grants guard');
const combo=bossState([createBlackwindLeader(),bao,hero,null,null]);combo.battle.marble.combo=30;combo.battle.marble.bonds.wallHits=2;equal(updateBondScheduler(combo,.02).id,'blackwind-thunder','wall combo triggers blackwind thunder');ok(combo.battle.marble.combo>30,'blackwind thunder changes combo behavior');

const thunder=createNetherThunderBeast(),tiger=createCrimsonTiger();tiger.individualQuality='legendary';tiger.individualTalent='heavenBlood';thunder.individualQuality='legendary';thunder.individualTalent='netherLightning';const disaster=bossState([tiger,thunder,hero,null,null]),dm=disaster.battle.marble,target=disaster.battle.enemies[0];dm.stats.powerLevels[3]++;const hp=target.hp;equal(updateBondScheduler(disaster,.02).id,'fire-thunder','power max triggers world boss bond');ok(target.hp<hp,'fire thunder deals finite damage');ok(dm.combo>=10,'legendary fire thunder adds multi-hit combo');ok(target.marbleBurn>=3,'world boss talent linkage strengthens burn');
for(const id of ['crimson-tiger','nether-thunder-beast']){const unit=id==='crimson-tiger'?createCrimsonTiger():createNetherThunderBeast(),other=id==='crimson-tiger'?createNetherThunderBeast():createCrimsonTiger(),state=bossState([unit,other,hero,null,null]),damages=[];for(let i=0;i<180;i++){const result=resolveMarbleEvent(state,{type:'boss',entityIndex:i%3,weak:i%4===0,speed:680,x:i%2?100:260},()=>.5);if(result?.damage)damages.push(result.damage);updateFlipperSystems(state,.12,()=>.5);}ok(damages.length&&damages.every(v=>Number.isFinite(v)&&v>0),`${id} bond long battle stays positive`);ok(retreatFlipperBattle(state)&&!state.battle,`${id} bond queue retreats safely`);}

const uiState=createState('UI');uiState.party=[liu,guan,zhang,null,null];uiState.bonds.discovered=['peach-oath'];uiState.screen='party';let html=render(uiState);ok(html.includes('目前羈絆')&&html.includes('桃園結義'),'party UI shows active bonds');uiState.screen='bonds';html=render(uiState);ok(html.includes('武將羈絆')&&html.includes('？？？'),'codex protects undiscovered recipes');
const hud=bossState([liu,guan,zhang,null,null]);html=renderMarblePanel(hud,hud.battle);ok(html.includes('pinball-bonds')&&html.includes('桃園結義'),'battle HUD shows bond without new button');
const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8'),sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8'),index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');ok(css.includes('@media(max-width:430px)')&&css.includes('.bond-codex-grid'),'390px bond layout exists');ok(sw.includes('v026-bonds-combo-1')&&sw.includes('bond-system.js'),'service worker caches V0.2.6 module');ok(index.includes('v026-bonds-combo-1'),'HTML uses matching build version');ok(!sw.includes('localStorage'),'service worker preserves saves');
console.log(`V0.2.6 bonds combo smoke: ${passed} assertions passed.`);
