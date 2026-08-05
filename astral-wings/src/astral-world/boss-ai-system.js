export const BOSS_STATES=['idle','choosing','telegraphing','charging','resolving','recovering','staggered','summoning','enraged','dead'];
export const MAX_BOSS_ADDS=2;

export const CROWN_BOSS_SKILLS=[
  {id:'crown-smash',name:'王冠重擊',phaseMin:1,cooldown:3.8,telegraphTime:.65,chargeTime:.2,recoveryTime:.8,damageMultiplier:1.2,target:'player',aoe:false,interruptible:false,interruptThreshold:0,priority:30},
  {id:'royal-charge',name:'皇家衝撞',phaseMin:1,cooldown:5.5,telegraphTime:.9,chargeTime:.35,recoveryTime:1,damageMultiplier:1.45,target:'player',aoe:false,interruptible:false,interruptThreshold:0,priority:40},
  {id:'astral-burst',name:'王星爆發',phaseMin:2,cooldown:6,telegraphTime:1.05,chargeTime:.45,recoveryTime:1.05,damageMultiplier:1.3,target:'all',aoe:true,interruptible:false,interruptThreshold:0,priority:55},
  {id:'summon-minions',name:'王庭召集',phaseMin:2,cooldown:8,telegraphTime:.8,chargeTime:.35,recoveryTime:1.1,damageMultiplier:0,target:'self',aoe:false,interruptible:false,interruptThreshold:0,summonProfile:{count:2,duration:6},priority:48},
  {id:'final-cataclysm',name:'終焉星墜',phaseMin:3,cooldown:8.5,telegraphTime:1.2,chargeTime:2.1,recoveryTime:1.3,damageMultiplier:2.15,target:'all',aoe:true,interruptible:true,interruptThreshold:70,priority:90},
];

const cooldownMap=()=>Object.fromEntries(CROWN_BOSS_SKILLS.map(skill=>[skill.id,0]));
export function createBossRuntime(){return{phase:1,state:'idle',skillId:null,stateRemaining:.75,cooldowns:cooldownMap(),enraged:false,interrupted:false,interruptPower:0,summonCount:0,adds:[],transitionLock:false,transitioned:[1],telegraph:null,skillCursor:0,resolvedToken:null};}
export const getBossSkill=id=>CROWN_BOSS_SKILLS.find(skill=>skill.id===id)||null;

function phaseFor(ratio){return ratio<=.3?3:ratio<=.7?2:1;}
function chooseSkill(runtime){
  const ready=CROWN_BOSS_SKILLS.filter(skill=>skill.phaseMin<=runtime.phase&&(runtime.cooldowns[skill.id]||0)<=0&&!(skill.id==='summon-minions'&&runtime.adds.length>=MAX_BOSS_ADDS));
  if(!ready.length)return null;
  ready.sort((a,b)=>b.priority-a.priority);const skill=ready[runtime.skillCursor%ready.length];runtime.skillCursor+=1;return skill;
}

function beginSkill(runtime,skill,actions){runtime.skillId=skill.id;runtime.state='telegraphing';runtime.stateRemaining=skill.telegraphTime;runtime.interrupted=false;runtime.interruptPower=0;runtime.resolvedToken=null;runtime.telegraph={skillId:skill.id,name:skill.name,total:skill.telegraphTime+skill.chargeTime,remaining:skill.telegraphTime+skill.chargeTime,aoe:skill.aoe,interruptible:skill.interruptible,threshold:skill.interruptThreshold};actions.push({type:'telegraph',skill});}

export function updateBossRuntime(runtime,{dt,hpRatio=1,alive=true,powerSave=false}={}){
  const actions=[];if(!runtime)return actions;
  const step=Math.max(0,Math.min(.1,Number(dt)||0));
  if(!alive){runtime.state='dead';runtime.skillId=null;runtime.telegraph=null;runtime.adds.length=0;runtime.summonCount=0;return actions;}
  for(const id of Object.keys(runtime.cooldowns))runtime.cooldowns[id]=Math.max(0,runtime.cooldowns[id]-step);
  for(const add of runtime.adds){add.remaining-=step;add.attackIn-=step;if(add.attackIn<=0){add.attackIn+=1.6;actions.push({type:'addAttack',add});}}
  runtime.adds=runtime.adds.filter(add=>add.remaining>0);runtime.summonCount=runtime.adds.length;
  const nextPhase=phaseFor(hpRatio);
  if(nextPhase>runtime.phase&&!runtime.transitioned.includes(nextPhase)){runtime.phase=nextPhase;runtime.transitioned.push(nextPhase);runtime.transitionLock=true;runtime.state='recovering';runtime.stateRemaining=.7;runtime.skillId=null;runtime.telegraph=null;actions.push({type:'phaseTransition',phase:nextPhase});if(nextPhase===3&&!runtime.enraged){runtime.enraged=true;actions.push({type:'enraged'});}return actions;}
  runtime.stateRemaining=Math.max(0,runtime.stateRemaining-step);if(runtime.telegraph)runtime.telegraph.remaining=Math.max(0,runtime.telegraph.remaining-step);
  if(runtime.state==='staggered'){if(runtime.stateRemaining<=0){runtime.state='recovering';runtime.stateRemaining=.65;actions.push({type:'staggerRecovered'});}return actions;}
  if(runtime.state==='recovering'){if(runtime.stateRemaining<=0){runtime.transitionLock=false;runtime.state=runtime.enraged?'enraged':'idle';runtime.stateRemaining=.25;}return actions;}
  if(runtime.state==='idle'||runtime.state==='enraged'){if(runtime.stateRemaining<=0)runtime.state='choosing';else return actions;}
  if(runtime.state==='choosing'){const skill=chooseSkill(runtime);if(!skill){runtime.state='idle';runtime.stateRemaining=.25;return actions;}beginSkill(runtime,skill,actions);return actions;}
  const skill=getBossSkill(runtime.skillId);if(!skill){runtime.state='idle';runtime.stateRemaining=.3;runtime.telegraph=null;return actions;}
  if(runtime.state==='telegraphing'&&runtime.stateRemaining<=0){runtime.state=skill.chargeTime>0?'charging':'resolving';runtime.stateRemaining=skill.chargeTime;actions.push({type:'charging',skill});return actions;}
  if(runtime.state==='charging'&&runtime.stateRemaining<=0)runtime.state='resolving';
  if(runtime.state==='summoning'){if(runtime.stateRemaining<=0){runtime.state='recovering';runtime.stateRemaining=skill.recoveryTime*(runtime.enraged ? .8 : 1);}return actions;}
  if(runtime.state==='resolving'){
    const token=`${skill.id}:${runtime.skillCursor}`;
    if(runtime.resolvedToken!==token){runtime.resolvedToken=token;if(skill.summonProfile){runtime.state='summoning';runtime.stateRemaining=.35;const room=Math.max(0,MAX_BOSS_ADDS-runtime.adds.length),count=Math.min(room,skill.summonProfile.count);for(let i=0;i<count;i+=1)runtime.adds.push({id:`add-${runtime.skillCursor}-${i}`,remaining:skill.summonProfile.duration,attackIn:1+i*.35});runtime.summonCount=runtime.adds.length;actions.push({type:'summon',skill,count});runtime.cooldowns[skill.id]=skill.cooldown*(runtime.enraged ? .72 : 1);return actions;}actions.push({type:'resolve',skill});runtime.cooldowns[skill.id]=skill.cooldown*(runtime.enraged ? .72 : 1);}
    runtime.state='recovering';runtime.stateRemaining=skill.recoveryTime*(runtime.enraged ? .8 : 1);runtime.skillId=null;runtime.telegraph=null;return actions;
  }
  return actions;
}

export function applyBossInterrupt(runtime,power){
  const skill=getBossSkill(runtime?.skillId);if(!runtime||runtime.state!=='charging'||!skill?.interruptible)return{ok:false,power:runtime?.interruptPower||0,threshold:skill?.interruptThreshold||0};
  runtime.interruptPower=Math.min(skill.interruptThreshold,Math.max(0,runtime.interruptPower+(Number(power)||0)));
  if(runtime.interruptPower<skill.interruptThreshold)return{ok:false,power:runtime.interruptPower,threshold:skill.interruptThreshold};
  runtime.interrupted=true;runtime.state='staggered';runtime.stateRemaining=2;runtime.cooldowns[skill.id]=skill.cooldown;runtime.telegraph=null;runtime.skillId=null;return{ok:true,power:runtime.interruptPower,threshold:skill.interruptThreshold};
}
