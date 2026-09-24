import { worldPresets } from '../data/worlds/presets.js';
import { gimmickTemplates } from '../data/gimmicks/templates.js';
import { customActions } from '../data/events/taixu.js';
import { intimacyDialogue } from '../data/intimacy/dialogue.js';
import { getCharacter } from './character-engine.js';
const clean=(v,max,fallback='')=>String(v??fallback).trim().slice(0,max);
export function parseWorldStats(input) {
  const lines=String(input).trim().split('\n').filter(Boolean);
  if(lines.length<2 || lines.length>8)throw new Error('請填寫 2–8 個世界數值，每行「名稱|初始值」。第一項用於成長，第二項用於資源。');
  const stats={};lines.forEach((line,index)=>{const [name,value]=line.split('|'),initial=Number(value);if(!name?.trim() || !Number.isFinite(initial) || initial<0 || initial>99999)throw new Error('數值格式應為「名稱|初始值」，初始值介於 0–99999。');stats[`stat${index}`]={name:name.trim().slice(0,20),initial,min:0,max:99999};});return stats;
}
export function createWorldDefinition(input,id) {
  if(!/^world-[a-zA-Z0-9-]{1,60}$/.test(id))throw new Error('世界 ID 格式錯誤');
  if(!Object.hasOwn(worldPresets,input.worldType))throw new Error('請選擇世界類型');
  const preset=worldPresets[input.worldType];
  const name=clean(input.name,50);if(!name)throw new Error('請填寫世界名稱');
  const selected=Array.isArray(input.characters)?[...new Set(input.characters)]:[];
  if(selected.length>23 || selected.some(id=>!['shen','su','gu'].includes(id) && !/^custom-[a-zA-Z0-9-]{1,60}$/.test(id)))throw new Error('角色名單格式錯誤');
  const template=input.gimmickMode==='recommended'?preset.gimmick:input.template;
  if(!Object.hasOwn(gimmickTemplates,template))throw new Error('請選擇外掛模板');
  let custom=null;
  if(input.gimmickMode==='custom') {custom={};for(const key of ['name','description','coreAbility','growth','resourceName','trigger']){custom[key]=clean(input[`gimmick_${key}`],key==='name'?50:400);if(!custom[key])throw new Error('請填完自訂外掛的六個欄位');}}
  return {id,worldType:input.worldType,name,description:clean(input.description,1000,preset.intro),playerIdentity:clean(input.playerIdentity,100,preset.role),rules:clean(input.rules,1500,preset.rules),background:clean(input.background,1000,preset.background),statsText:clean(input.statsText,1000,preset.stats),stats:parseWorldStats(input.statsText||preset.stats),characters:selected,gimmickSelection:{template,custom}};
}
export function validateDefinition(raw) {
  if(!raw || typeof raw!=='object')throw new Error('缺少自訂世界設定');
  const s=raw.gimmickSelection;
  return createWorldDefinition({...raw,gimmickMode:s?.custom?'custom':'template',template:s?.template,...Object.fromEntries(Object.entries(s?.custom||{}).map(([k,v])=>[`gimmick_${k}`,v]))},raw.id);
}
export function createWorldModule(definition) {
  const d=validateDefinition(definition),p=worldPresets[d.worldType],first=d.characters[0],media={type:'none',src:null,prompt:null};
  const c=(id,label,next,result,effects={})=>({id,label,hint:'選擇將改變這個世界',next,result,effects,memoryEffects:[{text:result,important:true}],media});
  const event=(id,title,text,choices)=>({id,title,text,choices,eyebrow:`${p.name} / ${d.name}`,media,showGimmick:true});
  const relation=changes=>first?{characters:{[first]:changes},flags:{[`met:${first}`]:true}}:{};
  const stats=(a,b)=>({stats:{stat0:a,stat1:b}});
  const events={
    intro:event('intro',`${d.name}，第一個清晨`,`${d.description}\n\n你以「${d.playerIdentity}」的身份醒來。${d.background}\n\n【叮！】${d.gimmickSelection.custom?.name || gimmickTemplates[d.gimmickSelection.template].name}已覺醒。這個世界的規則仍在，但你多了一種走法。`,[
      c('explore','先探索周圍，尋找線索','crossroads',`你帶回關於「${p.goal}」的第一條線索。`,{...stats(2,2),flags:{firstClue:true}}),
      c('prepare','建立落腳處，整理物資','crossroads','你把眼前的混亂整理成可用的起點，多了一份底氣。',{...stats(1,4),worldState:{shelter:1},inventory:{supplies:1}}),
      c('meet',first?'認識一起抵達的成年同行者':'調查這個世界的規則','crossroads',first?'你向同行者介紹自己，約好先互相照應。':'你記下公開的規則，找到一條可靠的安全路線。',{...stats(2,1),...relation({trust:6,affection:3})})
    ]),
    crossroads:event('crossroads','機會，總帶著一點風險',s=>`關於「${p.goal}」的消息傳到${p.place}。${s.flags.firstClue?'先前的線索讓你多知道一步。':'你得先找出消息的真假。'}\n\n${d.rules}\n\n眼前有三種做法。`,[
      c('negotiate','坦誠協商，爭取合作','daily','你以明確的條件換來合作，外交影響增加，同行者也更信任你。',{...stats(3,3),worldState:{diplomacy:1},...relation({trust:5,affection:2})}),
      c('secure','準備好裝備，再處理危險','daily','準備讓你在風險前站穩腳步。你完成一次防衛，帶回物資。',{...stats(4,2),worldState:{defense:1},inventory:{supplies:1},flags:{defended:true}}),
      c('investigate','獨自調查，帶回證據','daily','你找到關鍵證據，世界的謎團推進了一步。',{...stats(5,1),flags:{evidence:true},worldState:{intelligence:1}})
    ]),
    daily:event('daily','把選擇，活成自己的路',s=>`你在${p.place}留下足跡，已做出 ${s.turn} 次選擇。${s.flags.evidence?'帶回的證據成為探索的起點。':'新的委託仍在等候。'}\n\n據點 ${s.worldState.shelter||0} · 人口 ${s.worldState.population||0} · 領地 ${s.worldState.territory||0} · 外交 ${s.worldState.diplomacy||0}\n\n${first && s.flags[`met:${first}`]?(intimacyDialogue[first]||intimacyDialogue.default)[s.characters[first].intimacyDialogueLevel||0]:'世界很大，先做好今天能做的事。'}`,[
      c('expedition','探索與防衛，帶回成長','crossroads','你完成探索，帶回補給，並標記下一個安全路口。',{...stats(3,3),inventory:{supplies:1},worldState:{defense:1}}),
      c('company',first?'與同行者相處，聽聽今天的心情':'休整據點，安排下一次行程','daily',first?'你與同行者交換今天的心情，真誠的陪伴讓彼此更親近。':'你休整據點，恢復精神並保留備用物資。',{...stats(1,2),...relation({trust:5,affection:5,intimacy:2}),worldState:{shelter:1}}),
      c('diplomacy','拓展外交與領地','crossroads','你達成互利協議，領地與外交影響各增加 1。',{...stats(2,2),worldState:{territory:1,diplomacy:1}})
    ])
  };
  // Meet every selected companion, then rotate time together; never strand later selections.
  if(first)for(const e of Object.values(events)) {
    const choices=e.choices;
    e.choices=state=>choices.map(choice=>{
      if(!choice.effects.characters?.[first])return choice;
      const target=d.characters.find(id=>!state.flags[`met:${id}`]) || d.characters[state.turn%d.characters.length];
      const name=getCharacter(state,target).name;
      return {...choice,label:`${choice.label} · ${name}`,result:`${name}：${choice.result}`,effects:{...choice.effects,characters:{[target]:choice.effects.characters[first]},flags:{[`met:${target}`]:true}},memoryEffects:[{text:`你與${name}相處：${choice.result}`,character:target,important:true}]};
    });
  }
  const bindings={};for(const [key,name] of Object.entries({population:d.worldType==='apocalypse'?'倖存者':'人口',territory:'領地',diplomacy:'外交',defense:'戰備',shelter:'基地'})){const found=Object.entries(d.stats).find(([,v])=>v.name===name);if(found)bindings[key]=found[0];}
  return {id:d.id,name:d.name,worldType:d.worldType,theme:p.name,description:d.description,definition:d,playerRole:{name:'旅夢者',age:24,identity:d.playerIdentity,abilities:[]},locations:[{id:'home',name:p.place}],rules:d.rules.split('\n').filter(Boolean),stats:d.stats,characters:d.characters.filter(id=>!id.startsWith('custom-')),selectedCharacters:d.characters,events,customActions,startScene:'intro',hubScene:'daily',memory:d.background,flags:{},mediaStyle:{type:'text',mood:p.name},growthStat:'stat0',resourceStat:'stat1',systemBindings:bindings,gimmickSelection:d.gimmickSelection};
}
