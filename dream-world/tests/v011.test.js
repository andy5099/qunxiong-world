import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createArchive,activeState,addWorld,switchWorld,deleteWorld,putState,worldFor,characterLibrary } from '../src/archive-engine.js';
import { createWorldDefinition } from '../src/world-factory.js';
import { worldPresets } from '../data/worlds/presets.js';
import { createState,SAVE_KEY } from '../src/state.js';
import { taixu } from '../data/worlds/taixu.js';
import { StoryEngine } from '../src/story-engine.js';
import { applyChoice } from '../src/choice-engine.js';
import { parseSave,exportSave,writeSave,readSave,backupLegacy } from '../src/save.js';
import { createAdultCharacter,createCharacterState,getCharacter } from '../src/character-engine.js';
import { createGimmick,gimmickChoice,inspectTarget,availableAbilities } from '../src/gimmick-engine.js';
import { gimmickLevel } from '../data/gimmicks/templates.js';
import { updateRelationship } from '../src/relationship-engine.js';
import { intimacyDialogue } from '../data/intimacy/dialogue.js';
import { eligibleIntimacyEvent,consentDecision } from '../src/intimacy-engine.js';
import { privateEvent } from '../data/intimacy/events.js';
import { esc,characterPage,landing } from '../src/ui.js';
import { runInNewContext } from 'node:vm';
import { existsSync } from 'node:fs';
const oldText=readFileSync(new URL('./playable-save.json',import.meta.url),'utf8');
const definition=(id,type='fantasy',template='prosperity',members=[])=>createWorldDefinition({worldType:type,name:worldPresets[type].title,gimmickMode:'template',template,characters:members},id);
async function act(s,index=0){const w=worldFor(s),scene=await new StoryEngine(w).scene(s);assert.equal(scene.choices.length,3);return applyChoice(s,w,scene.choices[index]);}
function leveled(s,exp=80){s.gimmick.exp=exp;s.gimmick.level=gimmickLevel(exp);s.gimmick.specialResources.energy=100;return s;}
function use(s,id,target=null){const w=worldFor(s),ability=s.gimmick.abilities.find(a=>a.id===id);return applyChoice(s,w,gimmickChoice(s,w,ability,target));}
test('actual V0.1 fixture migrates without losing story, relationships, memories or stats',()=>{
 const old=JSON.parse(oldText);assert.equal(old.version,1);const a=parseSave(oldText),s=activeState(a);assert.equal(a.version,2);assert.equal(a.migratedFrom,1);assert.equal(s.worldId,old.worldId);assert.equal(s.sceneId,old.sceneId);assert.deepEqual(s.stats,old.stats);assert.deepEqual(s.memory,old.memory);
 for(const [id,c] of Object.entries(old.characters))for(const key of ['affection','trust','intimacy','relationship','memories'])assert.deepEqual(s.characters[id][key],c[key]);assert.ok(s.gimmick.level>=2);assert.equal(s.gimmick.name,'太虛系統');
 const map=new Map([[SAVE_KEY,oldText],['lineage-save','unchanged']]),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};backupLegacy(storage);writeSave(a,storage);assert.equal(map.get(SAVE_KEY+'MigrationBackupV1'),oldText);assert.equal(map.get('lineage-save'),'unchanged');assert.equal(readSave(storage).worlds.length,1);
});
test('second and third world, switch, refresh, independent state and delete',async()=>{
 const a=parseSave(oldText),original=structuredClone(activeState(a));addWorld(a,definition('world-second','fantasy','prosperity',['shen']));let s=await act(activeState(a));putState(a,s);const second=structuredClone(s);addWorld(a,definition('world-third','apocalypse','shelter',['shen']));s=await act(activeState(a),1);putState(a,s);assert.equal(a.worlds.length,3);assert.equal(s.characters.shen.trust,0);assert.deepEqual(a.worlds[0],original);assert.deepEqual(a.worlds[1],second);
 switchWorld(a,'world-second');assert.equal(activeState(a).turn,1);const restored=parseSave(exportSave(a));assert.equal(restored.worlds.length,3);assert.equal(activeState(restored).worldId,'world-second');deleteWorld(restored,'world-second');assert.equal(restored.worlds.length,2);assert.ok(restored.worlds.some(s=>s.worldId==='taixu'));assert.notEqual(restored.activeWorldId,'world-second');
});
test('every world type x every gimmick generates playable independent three-choice loops',async()=>{
 for(const type of Object.keys(worldPresets))for(const template of ['taixu','shelter','return','prosperity']){
  const a=createArchive();addWorld(a,definition(`world-${type}-${template}`,type,template));let s=activeState(a);
  for(let n=0;n<18;n++){s=await act(s,n%3);putState(a,s);assert.equal(parseSave(exportSave(a)).worlds.length,2);}assert.ok(s.turn>=18);assert.equal(s.gimmick.templateId,template);assert.equal(s.stats.realm,undefined);
 }
});
test('custom world, custom executable gimmick and custom character survive import',async()=>{
 const a=createArchive(),source=activeState(a),card=createAdultCharacter({name:'江聽雨',age:24},source.worldId,'custom-test');source.customCharacters.push(card);source.characters[card.id]=createCharacterState();
 const d=createWorldDefinition({worldType:'custom',name:'玻璃海',description:'沒有土地的世界',playerIdentity:'海上信使',rules:'島嶼會移動',background:'海底傳來鐘聲',statsText:'見識|0\n貝幣|10',gimmickMode:'custom',template:'return',gimmick_name:'潮汐返還',gimmick_description:'隨潮汐投入資源',gimmick_coreAbility:'十倍返還',gimmick_growth:'完成委託成長',gimmick_resourceName:'潮能',gimmick_trigger:'持有貝幣',characters:['custom-test']},'world-custom');
 addWorld(a,d,characterLibrary(a));let s=activeState(a);s=use(s,'return');assert.equal(s.stats.stat1,28);assert.equal(s.gimmick.name,'潮汐返還');assert.equal(s.customCharacters[0].personas[0].worldId,'world-custom');putState(a,s);const loaded=activeState(parseSave(exportSave(a)));assert.equal(loaded.definition.rules,'島嶼會移動');assert.equal(loaded.gimmick.resourceName,'潮能');assert.equal(loaded.customCharacters[0].name,'江聽雨');
});
test('gimmick XP unlocks progressively and quest rewards only once',async()=>{
 const a=createArchive();addWorld(a,definition('world-quest'));let s=activeState(a);assert.equal(availableAbilities(s).length,1);for(let i=0;i<5;i++)s=await act(s,0);assert.equal(s.gimmick.quest.completed,true);assert.ok(s.gimmick.level>=2);assert.ok(availableAbilities(s).length>=2);const before=s.gimmick.exp;s=await act(s,0);assert.equal(s.gimmick.exp-before,5);
});
test('all selected companions can be met without requiring an eye gimmick',async()=>{
 const a=createArchive();addWorld(a,definition('world-three-people','modern','return',['shen','su','gu']));let s=activeState(a);
 for(const index of [0,0,1,1])s=await act(s,index);
 for(const id of ['shen','su','gu']){assert.ok(s.flags[`met:${id}`]);assert.ok(s.characters[id].memories.length);assert.ok(getCharacter(s,id).personas.some(p=>p.worldId===s.worldId));}
});
test('awakening and eye are a real third choice, locked details remain hidden',async()=>{
 let s=createState(taixu);const e=new StoryEngine(taixu),scene=await e.scene(s);assert.match(scene.sceneText,/太虛系統覺醒/);assert.equal(scene.choices[2].id,'gimmick-eye');s=applyChoice(s,taixu,scene.choices[2]);assert.ok(s.flags['eye:shen']);assert.equal(s.gimmick.specialResources.energy,34);assert.match(s.lastOutcome.text,/仙緣契合度/);assert.doesNotMatch(s.lastOutcome.text,/喜好：/);assert.ok(!(await e.scene(s)).choices.some(c=>c.id==='gimmick-eye'));assert.throws(()=>use(s,'eye','shen'),/冷卻/);leveled(s,80);assert.match(inspectTarget(s,taixu,'shen'),/成長瓶頸/);assert.match(inspectTarget(s,taixu,'shen'),/尚未獲得/);
});
test('dream can decline; resonance benefits both with energy/stamina cost; yuan refines',()=>{
 let s=leveled(createState(taixu));s.flags['met:shen']=true;let denied=use(s,'dream','shen');assert.match(denied.lastOutcome.text,/沒有接受/);assert.equal(denied.characters.shen.intimacy,0);
 updateRelationship(s.characters.shen,{trust:70,affection:65,intimacy:20});const accepted=use(s,'dream','shen');assert.ok(accepted.flags['dream:shen']);assert.ok(accepted.characters.shen.intimacy>20);
 const resonance=use(s,'resonance','shen');assert.ok(resonance.stats.cultivation>s.stats.cultivation);assert.ok(resonance.characters.shen.progress>0);assert.equal(resonance.gimmick.specialResources.stamina,50);assert.equal(resonance.gimmick.specialResources.yuan,2);
 const refined=use(resonance,'refine');assert.equal(refined.gimmick.specialResources.yuan,0);assert.equal(refined.stats.cultivation-resonance.stats.cultivation,12);
 s.characters.shen.flags.refusePrivate=true;assert.equal(consentDecision(s,'shen','dream').accepted,false);s.gimmick.specialResources.energy=0;assert.throws(()=>use(s,'resonance','shen'),/能量不足/);
});
test('shelter, prosperity and return change world mechanics rather than labels',()=>{
 const a=createArchive();addWorld(a,definition('world-safe','cultivation','shelter'));let s=use(activeState(a),'shelter');assert.equal(s.worldState.shelter,1);assert.equal(s.stats.stat1,13);
 addWorld(a,definition('world-tribe','fantasy','prosperity'));s=use(activeState(a),'recruit');assert.equal(s.worldState.population,7);assert.equal(s.stats.stat3,7);assert.ok(s.stats.stat0>0);
 addWorld(a,definition('world-profit','modern','return'));s=use(activeState(a),'return');assert.equal(s.stats.stat1,28);
});
test('dialogue levels and distinct character voices, adult/consent/boundary gates',()=>{
 const s=createState(taixu);for(const id of ['shen','su','gu']){
  s.flags[`met:${id}`]=true;const c=s.characters[id];assert.equal(c.intimacyDialogueLevel,0);updateRelationship(c,{affection:20,trust:15});assert.equal(c.intimacyDialogueLevel,1);updateRelationship(c,{affection:30,trust:30,intimacy:15});assert.equal(c.intimacyDialogueLevel,2);updateRelationship(c,{relationship:'戀人',trust:10,intimacy:15});assert.equal(c.intimacyDialogueLevel,3);updateRelationship(c,{trust:20,intimacy:25,flags:{privateEvening:true}});assert.equal(c.intimacyDialogueLevel,4);
  const event=privateEvent(id,getCharacter(s,id),null,'hub',s.worldId);assert.equal(eligibleIntimacyEvent(s,event),true);c.flags.refusePrivate=true;assert.equal(eligibleIntimacyEvent(s,event),false);c.flags.refusePrivate=false;c.flags.platonic=true;assert.equal(consentDecision(s,id,'date').accepted,false);
 }
 for(let level=0;level<=4;level++)assert.equal(new Set(['shen','su','gu'].map(id=>intimacyDialogue[id][level])).size,3);
 const card=createAdultCharacter({name:'測試',age:24},s.worldId,'custom-age');card.age=17;s.customCharacters.push(card);s.characters[card.id]=createCharacterState();s.flags[`met:${card.id}`]=true;assert.equal(consentDecision(s,card.id).accepted,false);
});
test('relationship scenes keep exactly three choices, mutate memory and return to story',async()=>{
 let s=parseSave(oldText).worlds[0];const engine=new StoryEngine(taixu);const privateScene=engine.privateScene(s,'shen');assert.equal(privateScene.choices.length,3);s=applyChoice(s,taixu,privateScene.choices[0]);assert.equal(s.sceneId,'hub');assert.ok(s.characters.shen.memories.at(-1));const custom=engine.custom(s,'想準備一份禮物');s=applyChoice(s,taixu,custom.choices[0]);assert.equal((await engine.scene(s)).choices.length,3);
});
test('archive rejects corruption atomically; no prototype keys and bounded data',()=>{
 const a=createArchive();addWorld(a,definition('world-safe'));const before=JSON.stringify(a);for(const change of [b=>b.worlds.push(b.worlds[0]),b=>b.activeWorldId='missing',b=>b.worlds[1].definition.worldType='constructor',b=>b.worlds[1].gimmick.specialResources.energy=-1,b=>b.worlds[1].inventory={constructor:1}]){const b=structuredClone(a);change(b);assert.throws(()=>parseSave(JSON.stringify(b)));}assert.equal(JSON.stringify(a),before);assert.throws(()=>deleteWorld(createArchive(),'taixu'));
});
test('user world/character strings escaped and private text stays in data layer',()=>{
 const a=createArchive();addWorld(a,definition('world-escape'));const raw=activeState(a),w=worldFor(raw);w.name='<script>bad()</script>';w.description='<img src=x onerror=bad()>';assert.ok(!landing(raw,w).includes('<script>'));assert.ok(!landing(raw,w).includes('<img'));
 assert.equal(esc('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');const s=createState(taixu),card=createAdultCharacter({name:'<script>x</script>',age:24},s.worldId,'custom-x');s.customCharacters.push(card);s.characters[card.id]=createCharacterState();assert.ok(!characterPage(s,taixu,card.id).includes('<script>'));
 const engine=readFileSync(new URL('../src/intimacy-engine.js',import.meta.url),'utf8');assert.ok(!engine.includes('這一次，不是玩笑'));assert.ok(readFileSync(new URL('../data/intimacy/moon.js',import.meta.url),'utf8').includes('月光不必替誰說話'));
});
test('service worker only owns dream-world scope and caches all local module dependencies',async()=>{
 const handlers={},cached=[];let responded=false;
 const self={location:{href:'https://example.test/qunxiong-world/dream-world/service-worker.js'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve()}};
 runInNewContext(readFileSync(new URL('../service-worker.js',import.meta.url),'utf8'),{self,URL,Request,caches:{open:async()=>({addAll:async urls=>cached.push(...urls)}),match:async()=>null},fetch:async()=>({ok:true})});
 let installed;handlers.install({waitUntil:p=>installed=p});await installed;
 for(const request of cached){assert.equal(request.cache,'reload');const path=new URL(request.url).pathname.split('/dream-world/')[1] || 'index.html';assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);}
 handlers.fetch({request:{method:'GET',url:'https://example.test/qunxiong-world/lineage-text/'},respondWith:()=>responded=true});assert.equal(responded,false);
 handlers.fetch({request:{method:'GET',url:'https://example.test/qunxiong-world/dream-world/src/main.js'},respondWith:()=>responded=true});assert.equal(responded,true);
});
