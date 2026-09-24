import { AIProvider, buildContext, validateScene } from './ai-provider.js';
import { meets } from './choice-engine.js';
import { eligibleIntimacyEvent } from './intimacy-engine.js';
import { specialChoice, gimmickChoice, abilityStatus } from './gimmick-engine.js';
import { privateEvent, socialEvent } from '../data/intimacy/events.js';
import { getCharacter } from './character-engine.js';
import { intimacyDialogue } from '../data/intimacy/dialogue.js';
export class LocalStoryProvider extends AIProvider {
  constructor(world) { super(); this.world = world; }
  async generateScene(context) { return this.scene(context.state); }
  scene(state) {
    let event = this.world.events[state.sceneId];
    if (!event) throw new Error('找不到劇情');
    if (event.intimacyEvent && !eligibleIntimacyEvent(state,event)) event = this.world.events[this.world.hubScene];
    const candidates=typeof event.choices==='function'?event.choices(state):event.choices;
    const choices = candidates.filter(c=>meets(state,c.requirements)).slice(0,3);
    if(event.showGimmick) {const special=specialChoice(state,this.world);if(special)choices[2]=special;}
    const attitude = this.world.sceneSuffix?.(state) || '';
    return validateScene({ id:event.id,title:event.title,eyebrow:event.eyebrow,sceneText:[typeof event.text === 'function' ? event.text(state) : event.text, event.showAttitude ? attitude : ''].filter(Boolean).join('\n\n'),speaker:event.speaker,aside:event.aside,choices,media:event.media || {type:'none',src:null,prompt:null},stateEffects:[],memoryUpdates:[],possibleMediaEvent:null });
  }
}
export class StoryEngine {
  constructor(world, provider = new LocalStoryProvider(world)) { this.world = world; this.provider = provider; }
  async scene(state) { return validateScene(await this.provider.generateScene({...buildContext(state,this.world),state:structuredClone(state)})); }
  abilityScene(state,id,target) {
    const ability=state.gimmick.abilities.find(a=>a.id===id);if(!ability)throw new Error('能力不存在');
    const reason=abilityStatus(state,ability);if(reason)throw new Error(reason);
    const use=gimmickChoice(state,this.world,ability,target);
    return validateScene({id:'ability-preview',title:ability.name,eyebrow:`${state.gimmick.name} / Lv.${state.gimmick.level}`,sceneText:`${state.gimmick.description}\n\n消耗 ${ability.cost} ${state.gimmick.resourceName}。使用後進入冷卻；目標的意願仍需另外判定。`,choices:[use,{id:'ability-rest',label:'先休息，恢復能量',hint:'恢復特殊能量與體力',next:state.sceneId,result:'你先穩定狀態，再決定如何使用能力。',noGimmickExp:true},{id:'ability-back',label:'先回到眼前的事',hint:'保留資源',next:state.sceneId,result:'你收起能力，繼續眼前的故事。',noGimmickExp:true}],media:{type:'none',src:null,prompt:null}});
  }
  privateScene(state,id) {
    const card=getCharacter(state,id);if(!card || !state.flags[`met:${id}`])throw new Error('先在這個世界認識對方。');
    const event=privateEvent(id,card,null,state.sceneId,state.worldId);
    if(!eligibleIntimacyEvent(state,event))throw new Error('需要相識、信任至少 10，並尊重對方已表明的界線。');
    const dialogue=(intimacyDialogue[id]||intimacyDialogue.default)[state.characters[id].intimacyDialogueLevel||0];
    return validateScene({...event,sceneText:`${dialogue}\n\n${event.text}`});
  }
  socialScene(state,id) {
    const card=getCharacter(state,id);if(!card?.adult || card.age<18 || !state.flags[`met:${id}`])throw new Error('先認識對方，再開始互動。');
    const event=socialEvent(id,card,state.sceneId,state),line=(intimacyDialogue[id]||intimacyDialogue.default)[state.characters[id].intimacyDialogueLevel||0];
    return validateScene({...event,sceneText:`${line}\n\n${event.sceneText}`});
  }
  custom(state, text) {
    const input = text.trim().slice(0,160);
    if (!input) throw new Error('先寫下一個行動吧。');
    const intents = this.world.customActions;
    const intent = intents.find(i=>i.keywords.some(k=>input.includes(k))) || intents.at(-1);
    return validateScene({id:'custom',title:'夢境聽見了你的提議',eyebrow:'自由行動 / 本地規則',sceneText:`你提議：「${input}」\n\n${intent.text}\n\n目前使用本地劇情規則，請選擇如何落實這個行動。`,aside:'心有多大，選項就有三個。',media:{type:'none',src:null,prompt:null},choices:intent.choices.map(c=>({...c,id:`custom-${c.id}`,noGimmickExp:true,next:state.sceneId,memoryEffects:c.memoryEffects.length ? [{text:`行動意圖「${input}」：${c.result}`,important:true}] : []})),stateEffects:[],memoryUpdates:[],possibleMediaEvent:null});
  }
}
