import { AIProvider, buildContext, validateScene } from './ai-provider.js';
import { meets } from './choice-engine.js';
import { eligibleIntimacyEvent } from './intimacy-engine.js';
export class LocalStoryProvider extends AIProvider {
  constructor(world) { super(); this.world = world; }
  async generateScene(context) { return this.scene(context.state); }
  scene(state) {
    let event = this.world.events[state.sceneId];
    if (!event) throw new Error('找不到劇情');
    if (event.intimacyEvent && !eligibleIntimacyEvent(state,event)) event = this.world.events[this.world.hubScene];
    const choices = event.choices.filter(c=>meets(state,c.requirements)).slice(0,3);
    const attitude = this.world.sceneSuffix?.(state) || '';
    return validateScene({ id:event.id,title:event.title,eyebrow:event.eyebrow,sceneText:[typeof event.text === 'function' ? event.text(state) : event.text, event.showAttitude ? attitude : ''].filter(Boolean).join('\n\n'),speaker:event.speaker,aside:event.aside,choices,media:event.media || {type:'none',src:null,prompt:null},stateEffects:[],memoryUpdates:[],possibleMediaEvent:null });
  }
}
export class StoryEngine {
  constructor(world, provider = new LocalStoryProvider(world)) { this.world = world; this.provider = provider; }
  async scene(state) { return validateScene(await this.provider.generateScene({...buildContext(state,this.world),state:structuredClone(state)})); }
  custom(state, text) {
    const input = text.trim().slice(0,160);
    if (!input) throw new Error('先寫下一個行動吧。');
    const intents = this.world.customActions;
    const intent = intents.find(i=>i.keywords.some(k=>input.includes(k))) || intents.at(-1);
    return validateScene({id:'custom',title:'夢境聽見了你的提議',eyebrow:'自由行動 / 本地規則',sceneText:`你提議：「${input}」\n\n${intent.text}\n\n目前使用本地劇情規則，請選擇如何落實這個行動。`,aside:'心有多大，選項就有三個。',media:{type:'none',src:null,prompt:null},choices:intent.choices.map(c=>({...c,next:state.sceneId,memoryEffects:c.memoryEffects.length ? [{text:`行動意圖「${input}」：${c.result}`,important:true}] : []})),stateEffects:[],memoryUpdates:[],possibleMediaEvent:null});
  }
}
