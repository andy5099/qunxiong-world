import { createAIState } from './ai-memory.js';
import { object, text, number, list, record, id, location, quest, fact, entity, validateAIResponse } from './ai-schema.js';
export function validateAISave(raw,validateCheckpoint) {
  if(raw===undefined)return createAIState('offline');
  object(raw,['version','mode','minutes','scene','recent','summaries','compactedScenes','facts','locations','quests','threads','entities','checkpoint']);
  if(raw.version!==1||!['ai','offline'].includes(raw.mode))throw new Error('AI 存檔版本或模式錯誤');
  const a=createAIState(raw.mode);a.minutes=number(raw.minutes,0,1e12);a.compactedScenes=number(raw.compactedScenes,0,1e7);
  a.scene=raw.scene===null?null:validateAIResponse(raw.scene,{allowLegacyChoices:true});
  a.recent=list(raw.recent,12,s=>{object(s,['turn','type','location','participants','choice','text']);return {turn:number(s.turn,0,1e7),type:text(s.type,30),location:id(s.location),participants:list(s.participants,6,id),choice:text(s.choice,300),text:text(s.text,6000)};});
  a.summaries=list(raw.summaries,12,s=>text(s,1000));
  for(const [key,fn,max] of [['facts',fact,1000],['locations',location,200],['quests',quest,200],['threads',quest,200],['entities',entity,500]]){
    a[key]=record(raw[key],fn,max);for(const [k,v] of Object.entries(a[key]))if(k!==v.id)throw new Error('AI 永久登錄 ID 不符');
  }
  if(raw.checkpoint!==null){if(!validateCheckpoint)throw new Error('AI 檢查點不可巢狀');object(raw.checkpoint,['state','action']);a.checkpoint={state:validateCheckpoint(raw.checkpoint.state),action:text(raw.checkpoint.action,300)};}
  return a;
}
