import { getCharacter } from './character-engine.js';
import { consentDecision, eligibleIntimacyEvent } from './intimacy-engine.js';
export function createAIState(mode='ai') {
  return {version:1,mode,minutes:0,scene:null,recent:[],summaries:[],compactedScenes:0,facts:{},locations:{},quests:{},threads:{},entities:{},checkpoint:null};
}
export function intimacyAllowed(state,world,id,kind) {
  if(kind!=='flirt')return consentDecision(state,id,kind).accepted;
  return eligibleIntimacyEvent(state,{id:'ai-flirt',repeatable:true,worldRequirement:world.id,characters:[id],relationshipRequirement:'相識',affectionRequirement:10,trustRequirement:10,intimacyRequirement:0,requirements:{}});
}
export function storePermanent(table,entries,limit,label) {
  for(const entry of entries){if(!Object.hasOwn(table,entry.id)&&Object.keys(table).length>=limit)throw new Error(`${label}已達容量；請匯出並建立新世界。既有記憶未刪除。`);table[entry.id]=structuredClone(entry);}
}
export function rememberAIScene(state,response,action) {
  const ai=state.ai;
  // Immutable facts cannot be overwritten under an existing ID.
  for(const f of response.memoryUpdates){if(ai.facts[f.id]&&JSON.stringify(ai.facts[f.id])!==JSON.stringify(f))throw new Error('重要記憶 ID 已存在；新事件請使用新 ID');}
  storePermanent(ai.facts,response.memoryUpdates,1000,'重要記憶');
  ai.recent.push({turn:state.turn,type:response.sceneType,location:response.location,participants:response.participants,choice:action.slice(0,300),text:response.sceneText});
  if(ai.recent.length>12){
    const old=ai.recent.shift();ai.compactedScenes++;
    // Deterministic extractive compaction cannot invent or rewrite promises/relationships.
    ai.summaries.push(`第${old.turn}幕｜${old.type}｜${old.location}｜${old.participants.join('、')}｜${old.choice.slice(0,80)}：${old.text.slice(0,240)}`);
    ai.summaries=ai.summaries.slice(-12);
  }
}
export function directorContext(state,world,action) {
  const ai=state.ai, recent=ai.recent,latest=recent.at(-1),needle=action+' '+(latest?.text||'');
  const scored=Object.keys(state.characters).map((id,index)=>({id,score:(latest?.participants.includes(id)?100:0)+((needle.includes(id)||needle.includes(getCharacter(state,id)?.name))?80:0)+(state.flags['met:'+id]?10:0)-index/100})).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.id);
  const select=entries=>entries.map((v,i)=>({v,score:(v.character&&scored.includes(v.character)?50:0)+(['promise','enemy','romance','thread'].includes(v.kind)?10:0)+(needle.includes(v.id)||needle.includes(v.name)?30:0)+i/10000})).sort((a,b)=>b.score-a.score).slice(0,40).map(x=>x.v);
  const last=recent.slice(-4),stagnationScore=last.filter(s=>s.type==='dialogue').length+(last.length>=3&&new Set(last.map(s=>s.location)).size===1?2:0);
  return structuredClone({
    WORLD:{id:world.id,name:world.name,setting:world.description,background:state.definition?.background,style:world.theme,rules:world.rules,timeMinutes:ai.minutes,location:state.location,locations:[...world.locations,...Object.values(ai.locations)],majorEvents:select(Object.values(ai.facts).filter(f=>f.kind==='event')),entities:select(Object.values(ai.entities)),catalog:Object.values(ai.entities).map(e=>({id:e.id,name:e.name,kind:e.kind}))},
    PLAYER:{...state.player,stats:state.stats,statRules:world.stats,abilities:world.playerRole.abilities,inventory:state.inventory,worldState:state.worldState,gimmick:state.gimmick,quests:Object.values(ai.quests).filter(q=>q.status==='active'),questArchive:Object.values(ai.quests).map(q=>({id:q.id,title:q.title,status:q.status}))},
    CHARACTERS:scored.map(id=>({id,core:getCharacter(state,id),state:state.characters[id],consent:{flirt:intimacyAllowed(state,world,id,'flirt'),date:intimacyAllowed(state,world,id,'date'),resonance:intimacyAllowed(state,world,id,'resonance')}})),
    CHARACTER_CATALOG:Object.keys(state.characters).map(id=>({id,name:getCharacter(state,id)?.name,relationship:state.characters[id].relationship,met:!!state.flags['met:'+id]})),
    MEMORY:{recent:recent.length?recent:state.memory.recent.slice(-12),longTerm:select(Object.values(ai.facts)),legacyImportant:state.memory.long,olderSceneSummary:ai.summaries,compactedScenes:ai.compactedScenes,relationshipSummary:state.memory.relationshipSummary,worldSummary:state.memory.worldSummary,unresolvedThreads:Object.values(ai.threads).filter(t=>t.status==='active')},
    PACING:{recentSceneTypes:last.map(s=>s.type),recentLocations:last.map(s=>s.location),recentCharacters:last.flatMap(s=>s.participants),stagnationScore,mustAdvance:stagnationScore>=4},
    TONE:{style:world.theme,comedy:2,romance:3,adultFlirt:2,darkness:2,adventure:4,scale:'0–5；成熟曖昧但不露骨，成年人、自願、尊重界線'},
    ACTION:{intent:action,settledOutcome:state.lastOutcome,rule:'已套用的本地能力效果不可重複發放；敘述結果並建立後續劇情。'}
  });
}
