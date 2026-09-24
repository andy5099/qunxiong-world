import { gimmickTemplates, gimmickLevel, levelThresholds } from '../data/gimmicks/templates.js';
import { characterConsent } from '../data/intimacy/dialogue.js';
import { getCharacter } from './character-engine.js';
import { consentDecision } from './intimacy-engine.js';

export function createGimmick(selection={template:'taixu'}) {
  const template=gimmickTemplates[selection.template];
  if(!template) throw new Error('外掛模板不存在');
  const custom=selection.custom;
  return { ...structuredClone(template),id:custom?'custom':template.id,templateId:template.id,
    name:custom?.name || template.name,description:custom?.description || template.description,
    coreAbility:custom?.coreAbility || template.abilities[0].name,growth:custom?.growth || template.growth,
    trigger:custom?.trigger || template.trigger,level:1,exp:0,activeEffects:template.abilities.map(a=>a.id),
    unlockConditions:template.abilities.map(a=>({ability:a.id,level:a.level})),cooldowns:{},
    specialResources:{energy:40,stamina:60,yuan:0},resourceName:custom?.resourceName || template.resourceName,flags:{},quest:{id:'first-trust',completed:false,description:'取得任一成年同伴的信任（≥ 25）；無同伴時，累積 5 次有效世界行動。',reward:'特殊能量 +20、外掛 EXP +10'} };
}
export function availableAbilities(state) {return state.gimmick.abilities.filter(a=>a.level<=state.gimmick.level);}
export function nextLevelExp(g) {return levelThresholds[g.level] ?? null;}
export function knownTargets(state) {return Object.keys(state.characters).filter(id=>state.flags[`met:${id}`] && getCharacter(state,id)?.adult===true);}
export function inspectTarget(state,world,id) {
  const card=getCharacter(state,id),c=state.characters[id],profile=characterConsent[id] || characterConsent.default;
  const persona=card.personas.find(p=>p.worldId===world.id);
  const lines=[`仙緣之眼 · ${card.name}（${card.age} 歲）`,`身份：${persona?.identity || '同行者'}`,`境界／能力層次：${world.characterProfiles?.[id]?.realm || (world.theme==='修仙'?profile.realm:'尚未評估')}`,`關係：${c.relationship}｜好感 ${c.affection}｜信任 ${c.trust}`,`仙緣契合度：${profile.affinity}%`];
  if(state.gimmick.level>=2)lines.push(`喜好：${card.likes}；心情：${c.mood}`);
  if(state.gimmick.level>=3)lines.push(`成長瓶頸：${profile.bottleneck}；提示：先建立信任，再邀請共夢。`);
  if(state.gimmick.level>=4)lines.push(c.trust>=50?`對方願意透露的情報：${card.secret}`:'隱藏情報尚未獲得對方信任，不強行讀取。');
  return lines.join('\n');
}
export function abilityStatus(state,ability) {
  if(state.gimmick.level<ability.level)return `需要 Lv.${ability.level}`;
  const remaining=(state.gimmick.cooldowns[ability.id]||0)-state.turn;
  if(remaining>0)return `冷卻 ${remaining} 回合`;
  if(state.gimmick.specialResources.energy<ability.cost)return '特殊能量不足，先進行日常行動';
  if(ability.id==='resonance' && state.gimmick.specialResources.stamina<10)return '體力不足，先休息';
  if(ability.id==='refine' && state.gimmick.specialResources.yuan<1)return '尚無仙元可煉化';
  return null;
}
export function gimmickChoice(state,world,ability,target) {
  if(!['eye','dream','resonance'].includes(ability.id))target=null;
  return {id:`gimmick-${ability.id}`,label:`✨【外掛選項】${ability.name}`,hint:`消耗 ${ability.cost} ${state.gimmick.resourceName} · ${target?getCharacter(state,target).name:'世界能力'}`,next:state.sceneId,gimmickAction:{ability:ability.id,target:target||null},effects:{},memoryEffects:[],media:{type:'none',src:null,prompt:null}};
}
export function specialChoice(state,world) {
  const ready=availableAbilities(state).filter(a=>!abilityStatus(state,a) && (!['dream','resonance'].includes(a.id) || knownTargets(state).length>0) && (a.id!=='return' || (world.resourceStat && state.stats[world.resourceStat]>=2)));
  if(!ready.length)return null;
  const ability=state.sceneId===world.startScene && ready.some(a=>a.id==='eye')?ready.find(a=>a.id==='eye'):ready[state.turn%ready.length];
  const target=knownTargets(state)[0] || world.characters.find(id=>getCharacter(state,id)?.adult);
  return gimmickChoice(state,world,ability,target);
}
// Resolve a known executable mechanic, never evaluate custom text as code.
export function resolveGimmick(state,world,choice) {
  const action=choice.gimmickAction;if(!action)return choice;
  const ability=state.gimmick.abilities.find(a=>a.id===action.ability);
  if(!ability)throw new Error('未知外掛能力');
  const blocked=abilityStatus(state,ability);if(blocked)throw new Error(blocked);
  const id=['eye','dream','resonance'].includes(ability.id)?action.target:null,card=id?getCharacter(state,id):null;
  const effect={stats:{},flags:{},characters:{}},resourceDelta={energy:-ability.cost,stamina:0,yuan:0},worldDelta={};
  let result='',important=true;
  const grow=amount=>{if(world.growthStat)effect.stats[world.growthStat]=(effect.stats[world.growthStat]||0)+amount;};
  const supplies=amount=>{if(world.resourceStat)effect.stats[world.resourceStat]=(effect.stats[world.resourceStat]||0)+amount;};
  const kind=ability.id;
  if(kind==='eye') {
    result=card?inspectTarget(state,world,id):`仙緣之眼掃過周圍：${world.description}\n你找出一條安全路線，世界見識與特殊情報增加。`;
    if(card){effect.flags[`met:${id}`]=true;effect.flags[`eye:${id}`]=true;effect.characters[id]={unlock:[`eye-level-${state.gimmick.level}`]};}
    else grow(2);
    worldDelta.intelligence=1;
  } else if(['dream','resonance'].includes(kind)) {
    if(!card || !state.flags[`met:${id}`])throw new Error('先認識一位成年同伴，再發出邀請。');
    const decision=consentDecision(state,id,kind);
    if(!decision.accepted){result=`${card.name}沒有接受這次邀請：${decision.reason}。你收起能力，尊重對方的決定。`;resourceDelta.energy=-2;effect.characters[id]={trust:1};}
    else if(kind==='dream') {result=`${card.name}確認可以隨時離開後，自願踏入夢境。你們交換了今天的心事，這次的靠近是共同的選擇。`;effect.characters[id]={affection:4,trust:4,intimacy:3,status:'自願共夢'};effect.flags.dreamOpened=true;effect.flags.consent=true;effect.flags[`dream:${id}`]=true;grow(3);}
    else {
      const p=characterConsent[id]||characterConsent.default;
      const gain=Math.min(18,Math.floor((p.tier+state.gimmick.level)*p.affinity/100*(state.characters[id].trust/100))+3);
      result=`${card.name}同意共鳴。契合度 ${p.affinity}% 與彼此信任穩住了能量；你與對方各獲得 ${gain} 點成長，凝成仙元 2 點。`;
      resourceDelta.stamina=-10;resourceDelta.yuan=2;grow(gain);effect.characters[id]={affection:3,trust:3,intimacy:3,progress:gain,status:'共鳴後休息'};effect.flags.sharedTraining=true;effect.flags.consent=true;
    }
  } else if(kind==='refine') {const used=Math.min(3,state.gimmick.specialResources.yuan);resourceDelta.yuan=-used;grow(used*6);result=`你煉化 ${used} 點仙元，轉為 ${used*6} 點${world.stats[world.growthStat]?.name || '成長'}。仙元存量確實減少，成果留在這個世界。`;}
  else if(kind==='shelter'){worldDelta.shelter=1;resourceDelta.stamina=18;supplies(3);result='一道安全屋入口在你身旁展開。你回收 3 點資源並恢復 18 點體力，這個世界多了一處可依靠的據點。';}
  else if(kind==='expand'){worldDelta.shelter=2;worldDelta.population=2;grow(5);result='安全屋擴建出新的房間，庇護人口增加 2，據點等級增加 2。';}
  else if(kind==='beacon'){worldDelta.population=4;supplies(8);result='庇護信標引來願意合作的旅人。你獲得 8 點資源，4 位新成員加入據點。';}
  else if(kind==='return'){if(!world.resourceStat || state.stats[world.resourceStat]<2)throw new Error('需要至少 2 點世界資源才能返還。');supplies(18);result=`投入 2 點${world.stats[world.resourceStat].name}，十倍回收 20 點，淨增加 18 點。能力進入冷卻，不能立即重複領取。`;}
  else if(kind==='invest'){grow(10);result='你把返還機緣投入自身，額外獲得 10 點成長。';}
  else if(kind==='windfall'){supplies(25);worldDelta.intelligence=2;result='機緣回收帶來 25 點資源與兩份情報，下一步有了更多選擇。';}
  else if(kind==='recruit'){worldDelta.population=2;grow(Math.min(8,2+Math.floor((state.worldState.population||0)/4)));result='兩位自願加入的成員來到營地。族群人口增加 2，繁榮回饋提升你的成長。';}
  else if(kind==='territory'){worldDelta.territory=1;supplies(5);result='族群開闢一片新領地，帶回 5 點資源。擴張的成果寫入這個世界。';}
  else if(kind==='bloodline'){grow(12);worldDelta.diplomacy=2;result='族群的支持喚醒血脈回響。你獲得 12 點成長，外交影響增加 2。';}
  else throw new Error('尚未實作的能力');
  return {...choice,result,effects:effect,gimmickResolved:{ability:ability.id,resourceDelta,worldDelta,cooldown:ability.cooldown},memoryEffects:[{text:result,character:card?id:null,important,intimate:['dream','resonance'].includes(kind) && !!effect.flags.consent}]};
}
export function settleGimmick(state,world,choice) {
  const g=state.gimmick,resolved=choice.gimmickResolved;
  if(resolved) {
    for(const [key,delta] of Object.entries(resolved.resourceDelta))g.specialResources[key]=Math.max(0,Math.min(key==='yuan'?9999:100,g.specialResources[key]+delta));
    g.cooldowns[resolved.ability]=state.turn+resolved.cooldown;
    for(const [key,delta] of Object.entries(resolved.worldDelta))state.worldState[key]=Math.min(99999,(state.worldState[key]||0)+delta);
  } else {g.specialResources.energy=Math.min(100,g.specialResources.energy+4);g.specialResources.stamina=Math.min(100,g.specialResources.stamina+6);}
  const substantive=!choice.id.startsWith('custom-') && !choice.noGimmickExp;
  if(substantive)g.exp=Math.min(100000,g.exp+(resolved?7:5));
  if(!g.quest.completed && (Object.values(state.characters).some(c=>c.trust>=25) || (!Object.keys(state.characters).length && state.turn>=5))) {
    g.quest.completed=true;g.exp=Math.min(100000,g.exp+10);g.specialResources.energy=Math.min(100,g.specialResources.energy+20);
    state.lastOutcome.text+='\n【任務完成】特殊能量 +20，外掛 EXP +10。';
  }
  const before=g.level;g.level=gimmickLevel(g.exp);
  if(g.level>before)state.lastOutcome.text+=`\n【外掛升級】${g.name} Lv.${g.level}，新能力已解鎖。`;
  for(const [worldKey,statKey] of Object.entries(world.systemBindings||{}))if(resolved?.worldDelta[worldKey])state.stats[statKey]=Math.min(world.stats[statKey].max,state.stats[statKey]+resolved.worldDelta[worldKey]);
}
