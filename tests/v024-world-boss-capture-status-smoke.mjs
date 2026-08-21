import fs from 'node:fs';
import { captureWorldBoss, createWorldBossEncounter } from '../src/engine.js';
import { createState, normalize } from '../src/store.js';
import { WORLD_BOSSES, addWorldBossToRoster, hasCapturedWorldBoss } from '../src/world-boss-system.js';
import { render } from '../src/ui.js';

let passed=0;
const check=(value,label)=>{if(!value)throw new Error(label);passed+=1;};
const stateFor=id=>{const state=createState(`測試-${id}`);state.progress.chapterOneComplete=true;state.chapter2.cleared=true;state.worldBoss.unlocked=true;state.worldBosses.netherThunder.unlocked=true;state.screen='worldBoss';return state;};
const victory=(state,id)=>{createWorldBossEncounter(state,id);state.battle.finished=true;state.battle.result='victory';state.battle.awaitingRecruit=true;state.battle.rewardExp=100;state.battle.rewardGold=100;};

const fresh=stateFor('fresh');
check(render(fresh).includes('【未收服】'),'new save shows tiger uncaptured');
check(render(fresh).includes('挑戰世界王'),'uncaptured altar challenge label');
victory(fresh,'crimsonTiger');
check(render(fresh).includes('【尚未收服】'),'victory shows not captured');
check(render(fresh).includes('收服世界王'),'victory offers capture');
check(captureWorldBoss(fresh,()=>0),'tiger capture succeeds');
check(hasCapturedWorldBoss(fresh,'crimsonTiger'),'capture becomes authoritative immediately');
check(fresh.notice.includes('✓ 收服成功'),'success presentation is explicit');
const trained=fresh.roster.find(member=>member.id==='crimson-tiger');trained.level=37;trained.exp=456;
const reloaded=normalize(JSON.parse(JSON.stringify(fresh)));
check(hasCapturedWorldBoss(reloaded,'crimsonTiger'),'capture survives reload');
check(reloaded.roster.find(member=>member.id==='crimson-tiger')?.level===37,'trained member survives reload');
check(render(reloaded).includes('再次挑戰'),'captured altar offers repeat challenge');
victory(reloaded,'crimsonTiger');
const beforeCount=[...reloaded.party,...reloaded.roster].filter(member=>member?.id==='crimson-tiger').length;
const ownedVictory=render(reloaded);
check(ownedVictory.includes('【此世界王已收服】'),'repeat victory shows already captured');
check(ownedVictory.includes('✓ 已收服')&&ownedVictory.includes('disabled'),'repeat victory disables capture');
captureWorldBoss(reloaded,()=>0);
check([...reloaded.party,...reloaded.roster].filter(member=>member?.id==='crimson-tiger').length===beforeCount,'repeat victory never duplicates member');
check(reloaded.roster.find(member=>member.id==='crimson-tiger')?.level===37,'repeat victory preserves training');

const failed=stateFor('failed');victory(failed,'crimsonTiger');failed.inventory.crimsonTigerClaw=1;
check(!captureWorldBoss(failed,()=>.99),'capture can fail');
check(!hasCapturedWorldBoss(failed,'crimsonTiger'),'failed capture remains uncaptured');
check(failed.notice.includes('收服失敗'),'capture failure message is explicit');
check(failed.inventory.crimsonTigerClaw===1,'capture failure preserves loot');

const thunder=stateFor('thunder');victory(thunder,'netherThunder');
check(captureWorldBoss(thunder,()=>0),'thunder capture succeeds');
check(hasCapturedWorldBoss(thunder,'netherThunder'),'thunder uses same capture source');
check(thunder.roster.some(member=>member.id===WORLD_BOSSES.netherThunder.memberId),'thunder joins roster once');

const old=stateFor('old');old.roster.push(WORLD_BOSSES.crimsonTiger.createMember());old.worldBoss.captured=false;old.worldBossCodex.captured=false;
const oldReload=normalize(JSON.parse(JSON.stringify(old)));
check(hasCapturedWorldBoss(oldReload,'crimsonTiger'),'old roster save migrates to captured');
check(oldReload.worldBoss.captured&&oldReload.worldBossCodex.captured,'old save synchronizes record and codex');
oldReload.screen='party';
check(render(oldReload).includes('【世界王】'),'roster card has world boss tag');
oldReload.screen='bossCodex';
check(render(oldReload).includes('已收服'),'codex displays captured state');

const enemyState=stateFor('hud');createWorldBossEncounter(enemyState,'crimsonTiger');
check(enemyState.battle.enemies[0].displayName.includes('【未收服】'),'battle HUD source includes uncaptured status');
const capturedState=stateFor('captured-hud');addWorldBossToRoster(capturedState,'crimsonTiger');createWorldBossEncounter(capturedState,'crimsonTiger');
check(capturedState.battle.enemies[0].displayName.includes('【✓ 已收服】'),'battle HUD source includes captured status');

const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
check(css.includes('.world-capture-status')&&css.includes('@media(max-width:430px)'),'390px capture status CSS exists');
check(render(stateFor('safe')).length>500,'render completes without exception');
console.log(`V0.2.4 world boss capture status: ${passed} assertions passed.`);
