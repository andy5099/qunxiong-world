// Untrusted model output is data, never executable effects or HTML.
export const isRecord = v => !!v && typeof v === 'object' && !Array.isArray(v);
export function object(v, allowed, label='資料') {
  if (!isRecord(v) || Object.keys(v).some(k=>!allowed.includes(k))) throw new Error(`${label} 欄位格式錯誤`);
  return v;
}
export function text(v,max=600) { if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error('AI 文字格式錯誤');return v.trim(); }
export function id(v) { if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(v)||['__proto__','prototype','constructor'].includes(v))throw new Error('AI ID 格式錯誤');return v; }
export function number(v,min,max) { if(!Number.isFinite(v)||v<min||v>max)throw new Error('AI 數值超出範圍');return v; }
export function list(v,max,fn) { if(!Array.isArray(v)||v.length>max)throw new Error('AI 清單超出範圍');return v.map(fn); }
export function record(v,fn,max=200) { if(!isRecord(v)||Object.keys(v).length>max)throw new Error('AI 資料表錯誤');return Object.fromEntries(Object.entries(v).map(([k,x])=>[id(k),fn(x)])); }
const bool=v=>{if(typeof v!=='boolean')throw new Error('AI 布林格式錯誤');return v;};
export function character(v) {
  object(v,['id','name','age','identity','appearance','corePersonality','speechStyle','background','abilities','relationshipStyle','intimacyStyle','boundaries','likes','dislikes','weakness','secret']);
  const c={id:id(v.id),age:number(v.age,18,9999)};
  if(!c.id.startsWith('ai-')||!Number.isInteger(c.age))throw new Error('AI 新角色必須使用 ai- ID 並明確成年');
  for(const k of ['name','identity','corePersonality','speechStyle','background','boundaries'])c[k]=text(v[k],k==='name'?30:400);
  for(const k of ['appearance','abilities','relationshipStyle','intimacyStyle','likes','dislikes','weakness','secret'])if(v[k]!==undefined)c[k]=text(v[k],400);
  return c;
}
export function location(v) {object(v,['id','name','description']);return {id:id(v.id),name:text(v.name,80),description:text(v.description,600)};}
export function quest(v) {object(v,['id','title','description','status']);if(!['active','resolved','failed'].includes(v.status))throw new Error('任務狀態錯誤');return {id:id(v.id),title:text(v.title,100),description:text(v.description,600),status:v.status};}
export function fact(v) {object(v,['id','text','character','kind']);if(!['event','promise','enemy','romance','item','ability','secret','thread'].includes(v.kind))throw new Error('記憶種類錯誤');return {id:id(v.id),text:text(v.text,1500),character:v.character===null?null:id(v.character),kind:v.kind};}
export function entity(v) {object(v,['id','name','description','kind']);if(!['item','faction','secret','event','change','ability'].includes(v.kind))throw new Error('世界內容種類錯誤');return {id:id(v.id),name:text(v.name,80),description:text(v.description,600),kind:v.kind};}
export function validateAIResponse(raw) {
  const keys=['sceneText','sceneType','location','timeAdvance','choices','stateChanges','relationshipChanges','memoryUpdates','newCharacters','newLocations','questUpdates','gimmickEvents','media','participants','intimacyChecks'];
  object(raw,keys,'AI 回應');if(keys.some(k=>!Object.hasOwn(raw,k)))throw new Error('AI 回應缺少必要欄位');
  if(!['adventure','dialogue','discovery','crisis','quest','twist','gimmick','world','intimacy'].includes(raw.sceneType))throw new Error('場景類型錯誤');
  if(raw.media!==null)throw new Error('AI 媒體暫只接受 null');
  const s={sceneText:text(raw.sceneText,6000),sceneType:raw.sceneType,location:id(raw.location),timeAdvance:number(raw.timeAdvance,0,1440),media:null};
  s.choices=list(raw.choices,3,c=>{object(c,['label','intent','risk','abilityAction']);const out={label:text(c.label,120),intent:text(c.intent,300),risk:text(c.risk,120)};if(c.abilityAction){object(c.abilityAction,['ability','target']);out.abilityAction={ability:id(c.abilityAction.ability),target:c.abilityAction.target===null?null:id(c.abilityAction.target)};}return out;});
  if(new Set(s.choices.map(c=>c.label)).size!==s.choices.length||new Set(s.choices.map(c=>c.intent)).size!==s.choices.length)throw new Error('快捷行動的標籤與意圖不可重複');
  const changes=object(raw.stateChanges,['stats','inventory','worldState','entities','threads']);
  s.stateChanges={stats:record(changes.stats??{},v=>number(v,-20,20)),inventory:record(changes.inventory??{},v=>number(v,-20,20)),worldState:record(changes.worldState??{},v=>number(v,-20,20)),entities:list(changes.entities??[],8,entity),threads:list(changes.threads??[],8,quest)};
  s.relationshipChanges=record(raw.relationshipChanges,c=>{
    object(c,['affection','trust','intimacy','mood','status','met','refusePrivate','platonic']);const out={};
    for(const k of ['affection','trust','intimacy'])if(c[k]!==undefined)out[k]=number(c[k],-10,k==='intimacy'?3:5);
    for(const k of ['mood','status'])if(c[k]!==undefined)out[k]=text(c[k],100);
    for(const k of ['met','refusePrivate','platonic'])if(c[k]!==undefined)out[k]=bool(c[k]);
    return out;
  },12);
  s.memoryUpdates=list(raw.memoryUpdates,8,fact);s.newCharacters=list(raw.newCharacters,3,character);s.newLocations=list(raw.newLocations,3,location);s.questUpdates=list(raw.questUpdates,8,quest);
  s.gimmickEvents=list(raw.gimmickEvents,3,e=>{object(e,['ability','text']);return {ability:id(e.ability),text:text(e.text,600)};});
  s.participants=list(raw.participants,6,id);
  s.intimacyChecks=list(raw.intimacyChecks,6,c=>{object(c,['character','kind']);if(!['flirt','date','resonance'].includes(c.kind))throw new Error('親密種類錯誤');return {character:id(c.character),kind:c.kind};});
  for(const entries of [s.newCharacters,s.newLocations,s.memoryUpdates,s.questUpdates,s.stateChanges.entities,s.stateChanges.threads])if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('AI 回應 ID 重複');
  return s;
}
