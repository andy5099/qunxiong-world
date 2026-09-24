import { meets } from './choice-engine.js';
import { getCharacter } from './character-engine.js';
import { relationships } from './relationship-engine.js';
import { characterConsent } from '../data/intimacy/dialogue.js';
export function consentDecision(state,id,kind='date') {
  const card=getCharacter(state,id),c=state.characters[id],p=characterConsent[id]||characterConsent.default;
  if(!card?.adult || card.age<18 || !c || !state.flags[`met:${id}`])return {accepted:false,reason:'尚未認識符合條件的成年同伴'};
  if(c.flags.refusePrivate || (c.flags.platonic && kind==='date'))return {accepted:false,reason:'對方已表明私人互動的界線'};
  const threshold=kind==='date'?Math.max(30,p.dreamTrust):kind==='resonance'?Math.max(35,p.dreamTrust):p.dreamTrust;
  if(c.trust<threshold || relationships.indexOf(c.relationship)<relationships.indexOf(p.relationship))return {accepted:false,reason:'對方希望先建立更多信任'};
  if(kind==='date' && (c.affection<35 || c.intimacy<8))return {accepted:false,reason:'對方今天只想以朋友方式相處'};
  if(kind==='resonance' && p.affinity<70)return {accepted:false,reason:'目前契合不足以穩定共鳴'};
  return {accepted:true,reason:'對方自願接受，並確認可以隨時停止'};
}
export function eligibleIntimacyEvent(state, event) {
  if ((!event.repeatable && state.flags[`event:${event.id}`]) || event.worldRequirement !== state.worldId) return false;
  return meets(state,event.requirements) && event.characters.every(id => {
    const card = getCharacter(state,id);
    return card?.adult === true && card.age >= 18 && !state.characters[id]?.flags.refusePrivate && !state.characters[id]?.flags.platonic && meets(state,{character:id,relationship:event.relationshipRequirement,affection:event.affectionRequirement,trust:event.trustRequirement,intimacy:event.intimacyRequirement});
  });
}
export function resolveConsent(state,choice) {
  if(!choice.consentAction)return choice;
  const {target,kind,accepted,declined}=choice.consentAction,decision=consentDecision(state,target,kind);
  const c=state.characters[target],changes=decision.accepted?{affection:5,trust:3,intimacy:5,flags:{privateEvening:true},...(c.affection>=55 && c.trust>=50?{relationship:'戀人'}:{})}:{trust:2};
  const result=decision.accepted?accepted:`${declined}\n${decision.reason}。你尊重了對方的回答。`;
  return {...choice,result,effects:{characters:{[target]:changes}},memoryEffects:[{text:result,character:target,important:true,intimate:decision.accepted}]};
}
