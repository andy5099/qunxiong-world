import fs from 'node:fs';
import { SAVE_VERSION, AREAS, ENEMIES, ITEMS, YELLOW_DUNGEON, CHARACTER_ROLES, createNetherThunderBeast, createYellowBossMember } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { enterArea, createEncounter, createBossEncounter, createWorldBossEncounter, getFinalStats, getMemberPower, getTeamPower, enterDungeon, createDungeonFloor, captureWorldBoss } from '../src/engine.js';
import { CHAPTER2_BOSSES, getChapter2Resonance, recruitChapter2Boss, spareChapter2Boss } from '../src/chapter2-system.js';
import { WORLD_BOSSES, addWorldBossToRoster, deployRosterMember, quickBestParty } from '../src/world-boss-system.js';
import { render } from '../src/ui.js';

let passed=0;
const check=(value,label)=>{if(!value)throw new Error(label);passed+=1;};
const equal=(actual,expected,label)=>check(actual===expected,`${label}: ${actual} !== ${expected}`);
const state=()=>{const s=createState('測試主公');s.progress.chapterOneComplete=true;s.party.forEach(m=>{if(m)m.level=20;});return s;};

equal(SAVE_VERSION,19,'save version');
for(const id of ['yellowRoad','yellowCamp','yellowFortress'])check(AREAS[id],`${id} area exists`);
for(const id of ['yellowBladeSoldier','yellowShieldSoldier','yellowBowSoldier','yellowWarlock','yellowBrute'])check(ENEMIES[id],`${id} enemy exists`);
for(const id of ['yellowCaptainBoss','yellowCommanderBoss','zhangBaoBoss'])check(ENEMIES[id]?.bossKind,`${id} boss exists`);
equal(Object.keys(CHAPTER2_BOSSES).length,3,'three chapter bosses');
for(const profile of Object.values(CHAPTER2_BOSSES))equal(profile.drops.length,3,`${profile.name} has three exclusive drops`);
for(const id of ['yellowIronBlade','yellowSpear','yellowHardBow','yellowBattleGarb','yellowIronArmor','yellowCharm'])check(ITEMS[id],`${id} general gear exists`);
for(const id of ['captainBlade','yellowHeavyArmor','captainToken','commanderSpear','breakerArmor','commanderTalisman','earthLordSword','yellowSkyRobe','earthLordSeal'])check(ITEMS[id]?.bossOnly,`${id} boss gear exists`);

const unlock=state();check(enterArea(unlock,'yellowRoad'),'chapter two road enters');check(unlock.unlocks.chapter2,'chapter two unlocks');check(unlock.chapter2.areas.yellowRoad,'road visit saved');check(enterArea(unlock,'yellowCamp'),'camp enters');check(unlock.chapter2.areas.yellowCamp,'camp visit saved');check(enterArea(unlock,'yellowFortress'),'fortress enters');check(unlock.chapter2.areas.yellowFortress,'fortress visit saved');
for(const [area,enemy] of [['yellowRoad','yellowBladeSoldier'],['yellowCamp','yellowWarlock'],['yellowFortress','yellowBrute']]){const s=state();enterArea(s,area);check(createEncounter(s,enemy),`${area} encounter starts`);equal(s.battle.areaId,area,`${area} battle area`);}

for(const [area,enemyId,kind] of [['yellowRoad','yellowCaptainBoss','yellow-captain'],['yellowCamp','yellowCommanderBoss','yellow-commander'],['yellowFortress','zhangBaoBoss','zhang-bao']]){const s=state();enterArea(s,area);s.ui.bossWarning=true;s.ui.bossKind=enemyId;check(createBossEncounter(s,3),`${kind} battle starts`);equal(s.battle.bossKind,kind,`${kind} identity`);equal(s.battle.bossRarityRank,3,`${kind} rarity`);}

const recruit=state();recruit.screen='yellowRoad';recruit.battle={awaitingRecruit:true,bossKind:'yellow-captain',bossRarityRank:1,areaId:'yellowRoad'};check(recruitChapter2Boss(recruit,()=>0),'captain recruits');check(recruit.roster.some(m=>m.id==='yellow-captain'),'captain enters roster');check(recruit.equipment['yellow-captain'],'captain equipment initialized');
const spare=state();spare.screen='yellowCamp';spare.battle={awaitingRecruit:true,bossKind:'yellow-commander',bossRarityRank:3,areaId:'yellowCamp'};check(spareChapter2Boss(spare),'commander can be spared');equal(spare.battle,null,'spare clears battle');
const clear=state();clear.screen='yellowFortress';clear.battle={awaitingRecruit:true,bossKind:'zhang-bao',bossRarityRank:1,areaId:'yellowFortress'};check(recruitChapter2Boss(clear,()=>0),'zhang bao recruits');check(clear.progress.chapter2Cleared,'chapter two clear saved');check(clear.worldBosses.netherThunder.unlocked,'nether boss unlocks');

const resonance=state(),captain=createYellowBossMember('yellow-captain');resonance.roster.push(captain);resonance.equipment['yellow-captain']={weapon:'captainBlade',armor:'yellowHeavyArmor',accessory:'captainToken'};check(getChapter2Resonance(resonance,captain).defensePct>0,'captain resonance works');check(getFinalStats(resonance,captain).defense>captain.defense,'resonance changes stats');

check(WORLD_BOSSES.netherThunder,'second world boss config');equal(WORLD_BOSSES.netherThunder.captureRate,.05,'nether capture rate');equal(WORLD_BOSSES.netherThunder.drops.length,3,'nether has three drops');const nether=createNetherThunderBeast();equal(nether.id,'nether-thunder-beast','nether member id');check(CHARACTER_ROLES[nether.id],'nether role exists');
const world=state();world.progress.chapter2Cleared=true;world.worldBosses.netherThunder.unlocked=true;check(createWorldBossEncounter(world,'netherThunder'),'nether battle starts');equal(world.battle.worldBossId,'netherThunder','nether battle identity');equal(world.battle.enemies[0].phase,1,'nether starts phase one');check(world.battle.enemies[0].maxHp>WORLD_BOSSES.crimsonTiger.stats.maxHp,'nether is stronger');
const captured=state();captured.worldBosses.netherThunder.unlocked=true;captured.battle={worldBoss:true,worldBossId:'netherThunder',awaitingRecruit:true};check(captureWorldBoss(captured,()=>0),'nether capture succeeds');check(captured.roster.some(m=>m.id==='nether-thunder-beast'),'nether added to roster');

const formation=state();formation.roster.push(createYellowBossMember('yellow-captain'),createNetherThunderBeast());const storedEquipment=formation.equipment['yellow-captain'];check(deployRosterMember(formation,'yellow-captain',4),'one click deploy');equal(formation.party[4].id,'yellow-captain','deployed into slot five');equal(formation.equipment['yellow-captain'],storedEquipment,'equipment reference preserved');check(!deployRosterMember(formation,'nether-thunder-beast',0),'hero slot protected');check(quickBestParty(formation,getMemberPower),'quick best formation runs');equal(formation.party.length,5,'formation keeps five slots');equal(new Set(formation.party.filter(Boolean).map(m=>m.id)).size,formation.party.filter(Boolean).length,'no duplicate members');check(getTeamPower(formation)>0,'team power recalculates');
const blocked=state();blocked.roster.push(createYellowBossMember('yellow-captain'));blocked.battle={finished:false};check(!deployRosterMember(blocked,'yellow-captain',4),'battle blocks formation edits');check(!quickBestParty(blocked,getMemberPower),'battle blocks quick formation');

const tomb=state();enterArea(tomb,'yellowCamp');tomb.dungeon.warning=true;tomb.dungeon.dungeonId='yellowTomb';tomb.dungeon.name=YELLOW_DUNGEON.name;tomb.dungeon.sourceScreen='yellowCamp';tomb.dungeon.sourceLocation='黃巾營地';check(enterDungeon(tomb,()=>0),'yellow tomb enters');equal(tomb.dungeon.name,YELLOW_DUNGEON.name,'tomb name');equal(tomb.dungeon.sourceScreen,'yellowCamp','tomb source saved');tomb.dungeon.floor=4;tomb.battle=null;check(createDungeonFloor(tomb,5,()=>0),'tomb boss floor starts');check(tomb.battle.boss,'tomb final floor boss');check(CHAPTER2_BOSSES[tomb.battle.bossKind],'tomb boss belongs to chapter two');

const migrated=normalize({...createState('舊玩家'),version:13,progress:{chapterOneComplete:true},inventory:{ironSword:4},roster:[createYellowBossMember('yellow-captain')]});equal(migrated.version,19,'v13 migrates');equal(migrated.inventory.ironSword,4,'inventory preserved');check(migrated.chapter2,'chapter state added');check(migrated.chapter2Codex['yellow-captain'],'chapter codex added');check(migrated.worldBosses.netherThunder,'nether state added');equal(migrated.party.length,5,'five party slots preserved');

const ui=state();ui.screen='party';ui.roster.push(createYellowBossMember('yellow-captain'),createNetherThunderBeast());let html=render(ui);check(html.includes('快速編隊'), 'quick formation UI');check(html.includes('支援 2'),'fifth slot support UI');check(html.includes('候補武將名冊'),'roster UI');ui.ui.partySwapSlot=4;html=render(ui);check(html.includes('立即換入'),'one-click swap UI');ui.screen='yellowRoad';html=render(ui);check(html.includes('黃巾荒道'),'chapter area UI');ui.screen='worldBoss';ui.worldBosses.netherThunder.unlocked=true;html=render(ui);check(html.includes('九幽雷獸'),'second world boss UI');

const sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');check(sw.includes('chapter2-system.js'),'service worker caches chapter module');
console.log(`V0.2.0 Yellow Turban smoke: ${passed} assertions passed.`);
