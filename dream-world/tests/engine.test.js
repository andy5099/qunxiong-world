import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taixu as world } from '../data/worlds/taixu.js';
import { createState, SAVE_KEY } from '../src/state.js';
import { StoryEngine } from '../src/story-engine.js';
import { applyChoice } from '../src/choice-engine.js';
import { createAdultCharacter, createCharacterState } from '../src/character-engine.js';
import { parseSave as parseArchive, exportSave, readSave as readArchive, writeSave } from '../src/save.js';
import { eligibleIntimacyEvent } from '../src/intimacy-engine.js';
import { buildContext } from '../src/ai-provider.js';
import { registerWorld } from '../src/world-engine.js';
import { safeMediaURL, presentMedia } from '../src/media-engine.js';
import { characters } from '../data/characters/cast.js';
const engine=new StoryEngine(world);
const parseSave=text=>parseArchive(text).worlds[0];
const readSave=storage=>readArchive(storage).worlds[0];
async function choose(state,id){const scene=await engine.scene(state),choice=scene.choices.find(c=>c.id===id);assert.ok(choice,`${state.sceneId} missing ${id}`);return applyChoice(state,world,choice);}
async function complete(){let s=createState(world);s.started=true;for(const id of ['greet','cake','shield','invite','sync','credit','su-respect','together'])s=await choose(s,id);return s;}
test('first world, adult cast, and media contracts',async()=>{
 const s=createState(world),scene=await engine.scene(s);assert.equal(scene.choices.length,3);assert.equal(s.stats.realm,1);assert.equal(s.player.name,'白見微');
 for(const c of Object.values(characters)){assert.equal(c.adult,true);assert.ok(c.age>=18);assert.ok(c.intimacyStyle);assert.ok(c.personas[0].worldId);}
 for(const e of Object.values(world.events)){assert.deepEqual(e.media,{type:'none',src:null,prompt:null});for(const c of e.choices)assert.ok(world.events[c.next]);}
});
test('opening choices change route, trust, flags and memories independently',async()=>{
 const outcomes=await Promise.all(['greet','tease','gimmick-eye'].map(id=>choose(createState(world),id)));
 assert.equal(new Set(outcomes.map(s=>s.sceneId)).size,3);assert.equal(new Set(outcomes.map(s=>s.characters.shen.trust)).size,3);assert.equal(new Set(outcomes.map(s=>s.memory.long[0].text)).size,3);
});
test('complete shared route, breakthrough, Su and Gu, relationship event',async()=>{
 let s=await complete();assert.equal(s.sceneId,'hub');assert.equal(s.stats.realm,2);assert.ok(s.flags['met:su']);assert.ok(s.flags['met:gu']);assert.ok(s.flags.sharedTraining);
 s=await choose(s,'train');s=await choose(s,'pastry');assert.equal(eligibleIntimacyEvent(s,world.events.moon),true);
 s=await choose(s,'moon');s=await choose(s,'mutual');assert.equal(s.characters.shen.relationship,'戀人');assert.ok(s.memory.long.some(m=>m.text.includes('成為戀人')));assert.equal(eligibleIntimacyEvent(s,world.events.moon),false);
 assert.equal((await engine.scene(s)).choices.length,3);
});
test('low-trust route respects refusal and still progresses',async()=>{
 let s=createState(world);for(const id of ['tease','double','leaf','seal'])s=await choose(s,id);
 assert.ok(!(await engine.scene(s)).choices.some(c=>c.id==='invite'));s=await choose(s,'hesitant');assert.equal(s.sceneId,'soloDream');assert.ok(s.flags.declined);
 for(const id of ['rune','boast','su-flirt','su-advice'])s=await choose(s,id);assert.equal(s.sceneId,'hub');assert.equal((await engine.scene(s)).choices.length,3);
});
test('seeded exploration: 160 routes x 40 turns always offer exactly three legal choices',async()=>{
 let seed=7321;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<160;i++){let s=createState(world);for(let n=0;n<40;n++){const scene=await engine.scene(s);assert.equal(scene.choices.length,3);s=applyChoice(s,world,scene.choices[Math.floor(random()*3)]);parseSave(exportSave(s));}assert.ok(s.flags.chapterComplete);}
});
test('friendship boundary persists after future interactions',async()=>{
 let s=await complete();for(const id of ['train','pastry','moon','friend','train','pastry'])s=await choose(s,id);assert.equal(s.characters.shen.relationship,'朋友');
});
test('custom action returns to scene and records intent without granting invented progress',async()=>{
 const s=createState(world),custom=engine.custom(s,'我想送禮物');assert.equal(custom.choices.length,3);const next=applyChoice(s,world,custom.choices[0]);assert.equal(next.sceneId,s.sceneId);assert.deepEqual(next.stats,s.stats);assert.ok(next.memory.long[0].text.includes('我想送禮物'));assert.equal((await engine.scene(next)).choices.length,3);
});
test('save, reload, export/import and isolated namespace',async()=>{
 const map=new Map([['other-game','untouched']]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const s=await complete();writeSave(s,storage);const loaded=readSave(storage);assert.equal(loaded.sceneId,s.sceneId);assert.deepEqual(loaded.characters,s.characters);assert.deepEqual(loaded.memory,s.memory);assert.equal(map.get('other-game'),'untouched');assert.ok(map.has(SAVE_KEY));assert.equal(parseSave(exportSave(s)).stats.realm,2);
});
test('reject malformed/oversized saves and preserve current state',async()=>{
 const s=await complete(),copy=structuredClone(s);for(const patch of [{version:99},{worldId:'missing'},{sceneId:'missing'},{sceneId:'constructor'},{stats:{}},{characters:{}},{memory:null},{flags:{constructor:true}}])assert.throws(()=>parseSave(JSON.stringify({...s,...patch})));
 assert.throws(()=>parseSave('{'));assert.throws(()=>parseSave(' '.repeat(4000001)));assert.deepEqual(s,copy);
});
test('adult creation, validation and save roundtrip',()=>{
 assert.throws(()=>createAdultCharacter({name:'A',age:17},world.id,'custom-a'));const s=createState(world),c=createAdultCharacter({name:'江聽雨',age:24,appearance:'深色短髮'},world.id,'custom-a');s.customCharacters.push(c);s.characters[c.id]=createCharacterState();const loaded=parseSave(exportSave(s));assert.equal(loaded.customCharacters[0].name,'江聽雨');assert.equal(loaded.customCharacters[0].appearance,'深色短髮');
});
test('provider context is bounded and detached; world stats are modular',async()=>{
 let s=await complete();for(let n=0;n<45;n++){s=await choose(s,'train');s=await choose(s,'listen');}const context=buildContext(s,world);assert.ok(context.recentStory.length<=6);assert.ok(context.memories.short.length<=8);assert.ok(context.memories.long.length<=40);context.flags.changed=true;assert.equal(s.flags.changed,undefined);
 const urban={...world,id:'urban-test',stats:{money:{name:'金錢',initial:10,min:0,max:100}},characters:[],flags:{},sceneSuffix:()=>'',events:{intro:{id:'intro',title:'城市',text:'早安',choices:[1,2,3].map(i=>({id:String(i),label:String(i),next:'intro',effects:{stats:{money:i}}}))}},startScene:'intro'};registerWorld(urban);let u=createState(urban);const scene=await new StoryEngine(urban).scene(u);u=applyChoice(u,urban,scene.choices[2]);assert.equal(u.stats.money,13);assert.equal(u.stats.realm,undefined);
});
test('media placeholder falls back immediately, external and traversal sources rejected',async()=>{
 await presentMedia({type:'none',src:null});assert.equal(safeMediaURL('https://example.com/clip.mp4'),null);assert.equal(safeMediaURL('../lineage-text/asset.png'),null);
});
