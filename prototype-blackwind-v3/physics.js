export const ARENA={width:360,height:520,padding:24,floor:480};
export const TEST_DURATION=30;

export function createPrototypeState(){
  return{running:true,complete:false,timeLeft:TEST_DURATION,core:{x:180,y:ARENA.floor-22,vx:0,vy:0,r:22,bottomTime:0,dashTime:0,launchBurst:0,powerAttack:false},boss:{x:180,y:112,r:52,maxHp:999999,hp:999999,flash:0,recoilX:0},combo:0,maxCombo:0,comboTime:0,power:0,powerReady:false,dashCooldown:0,counterWindow:0,skillGauge:0,skill:null,hitStop:0,shake:0,flash:0,history:[],pendingHits:[],events:[],tutorial:{flip:true,dash:false,power:false},stats:{flips:0,dashes:0,dashHits:0,powerFlips:0,perfects:0,counterDashes:0,skills:0,hits:0}};
}

function event(state,type,data={}){state.events.push({type,life:data.life||.65,...data});if(state.events.length>48)state.events.splice(0,state.events.length-48);}
function addGauge(state,amount){state.power=Math.min(100,state.power+amount);if(state.power>=100&&!state.powerReady){state.powerReady=true;state.tutorial.power=true;event(state,'power-ready',{text:'POWER READY！',x:180,y:300,life:1});}state.skillGauge=Math.min(100,state.skillGauge+amount*.3);}
function hit(state,kind='normal',follower=0){const strong=kind==='power'||kind==='skill-final',dash=kind==='dash'||kind==='counter',skill=kind.startsWith('skill');state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.comboTime=2.2;state.stats.hits++;if(dash&&!follower)state.stats.dashHits++;const damage=strong?(follower===2?420:260):skill?210:dash?175:95;state.boss.hp=Math.max(0,state.boss.hp-damage);state.boss.flash=strong?.16:dash?.1:.055;state.boss.recoilX=(state.core.vx>=0?1:-1)*(strong?13:dash?7:3);state.hitStop=strong&&follower===2?.09:dash?.052:.028;state.shake=strong&&follower===2?.28:dash?.13:.045;state.flash=strong&&follower===2?.14:dash?.07:.025;addGauge(state,strong?18:dash?10:5);event(state,strong?'power-hit':dash?'dash-hit':'hit',{x:state.boss.x,y:state.boss.y,text:`-${damage}`,follower,life:strong?.8:.55});}

export function tapPrototype(state){
  if(!state.running||state.complete||state.skill)return{type:'ignored'};
  const c=state.core,inZone=c.y>=ARENA.floor-38;
  if(inZone){const perfect=c.bottomTime>0&&c.bottomTime<=.34,power=state.powerReady;c.launchBurst=power?.18:.14;c.vx=(c.x<180?1:-1)*(power?55:35);c.vy=power?-735:-630;c.bottomTime=0;c.powerAttack=power;c.dashTime=0;state.dashCooldown=.3;state.stats.flips++;if(perfect){state.stats.perfects++;c.vy-=45;addGauge(state,18);event(state,'perfect',{text:'PERFECT FLIP！',x:180,y:398,life:.85});}if(power){state.stats.powerFlips++;state.power=0;state.powerReady=false;state.hitStop=.1;state.shake=.18;event(state,'power-flip',{text:'破军冲阵',x:180,y:350,life:1});}else event(state,'flip',{text:'FLIP！',x:180,y:410});state.tutorial.flip=false;state.tutorial.dash=true;return{type:power?'power-flip':'flip',perfect};}
  if(state.dashCooldown<=0){const dx=state.boss.x-c.x,dy=state.boss.y-c.y,d=Math.max(1,Math.hypot(dx,dy)),counter=state.counterWindow>0;c.vx=dx/d*(counter?690:610);c.vy=dy/d*(counter?690:610);c.dashTime=.2;state.dashCooldown=counter?1.05:.92;state.counterWindow=0;state.stats.dashes++;if(counter){state.stats.counterDashes++;addGauge(state,16);event(state,'counter',{text:'COUNTER DASH！',x:c.x,y:c.y-30,life:.8});}else event(state,'dash',{text:'DASH',x:c.x,y:c.y-28});return{type:counter?'counter-dash':'dash'};}
  event(state,'cooldown',{text:'DASH CHARGING',x:180,y:450,life:.32});return{type:'cooldown'};
}

function beginSkill(state){state.skill={elapsed:0,duration:1.55,phase:0,x:state.core.x,y:state.core.y,hitMask:0};state.stats.skills++;state.skillGauge=0;state.hitStop=.12;event(state,'skill-intro',{text:'关羽【青龙偃月】',x:180,y:180,life:.7});}
function updateSkill(state,dt){const s=state.skill;if(!s)return;const boss=state.boss;s.elapsed+=dt;const t=s.elapsed;if(t<.38){const p=t/.38;s.x=state.core.x+(boss.x-105-state.core.x)*p;s.y=state.core.y+(boss.y-state.core.y)*p;}else if(t<.76){const p=(t-.38)/.38;s.x=105+(150*p);s.y=boss.y+Math.sin(p*Math.PI)*-42;}else if(t<1.14){const p=(t-.76)/.38;s.x=255-(150*p);s.y=boss.y+Math.sin(p*Math.PI)*42;}else{const p=Math.min(1,(t-1.14)/.41);s.x=105+(state.core.x-105)*p;s.y=boss.y+(state.core.y-boss.y)*p;}
  for(const [index,at] of [.34,.72,1.12].entries())if(t>=at&&!(s.hitMask&(1<<index))){s.hitMask|=1<<index;hit(state,index===2?'skill-final':'skill',index);event(state,'skill-slash',{x:boss.x,y:boss.y,phase:index,life:index===2?.9:.55});if(index===2){state.hitStop=.1;state.shake=.3;state.flash=.16;}}
  if(t>=s.duration){state.skill=null;event(state,'skill-return',{text:'武圣归阵',x:state.core.x,y:state.core.y-28});}
}

export function stepPrototype(state,rawDt){
  if(!state.running||state.complete)return state;const dt=Math.min(.033,Math.max(0,rawDt));state.timeLeft=Math.max(0,state.timeLeft-dt);if(!state.timeLeft){state.running=false;state.complete=true;event(state,'complete',{text:'Prototype Complete',x:180,y:240,life:99});return state;}
  state.comboTime=Math.max(0,state.comboTime-dt);if(!state.comboTime)state.combo=0;state.dashCooldown=Math.max(0,state.dashCooldown-dt);state.counterWindow=Math.max(0,state.counterWindow-dt);state.boss.flash=Math.max(0,state.boss.flash-dt);state.boss.recoilX*=Math.pow(.78,dt*60);state.shake=Math.max(0,state.shake-dt);state.flash=Math.max(0,state.flash-dt);
  for(const e of state.events)e.life-=dt;state.events=state.events.filter(e=>e.life>0);
  if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return state;}updateSkill(state,dt);
  for(const queued of state.pendingHits)queued.delay-=dt;for(const queued of state.pendingHits.filter(q=>q.delay<=0))hit(state,queued.kind,queued.follower);state.pendingHits=state.pendingHits.filter(q=>q.delay>0);
  const c=state.core;if(c.launchBurst>0){c.launchBurst=Math.max(0,c.launchBurst-dt);c.vy-=480*dt;}c.dashTime=Math.max(0,c.dashTime-dt);c.vy+=500*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=Math.pow(.997,dt*60);
  const p=ARENA.padding;if(c.x-c.r<p){c.x=p+c.r;c.vx=Math.abs(c.vx)*.88;}else if(c.x+c.r>ARENA.width-p){c.x=ARENA.width-p-c.r;c.vx=-Math.abs(c.vx)*.88;}if(c.y-c.r<p){c.y=p+c.r;c.vy=Math.abs(c.vy)*.82;}
  if(c.y+c.r>=ARENA.floor){c.y=ARENA.floor-c.r;c.vy=0;c.vx*=.72;c.bottomTime+=dt;}else c.bottomTime=0;
  state.history.unshift({x:c.x,y:c.y});if(state.history.length>18)state.history.length=18;
  const dx=c.x-(state.boss.x+state.boss.recoilX),dy=c.y-state.boss.y,overlap=Math.hypot(dx,dy)<c.r+state.boss.r;if(overlap&&!state.bossContact){const kind=c.powerAttack?'power':c.dashTime>0?'dash':'normal';hit(state,kind,0);if(kind==='power')state.pendingHits.push({delay:.065,kind,follower:1},{delay:.14,kind,follower:2});else if(kind==='dash')state.pendingHits.push({delay:.09,kind,follower:1});state.bossContact=true;state.counterWindow=.32;const d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d,dot=c.vx*nx+c.vy*ny;c.x=state.boss.x+nx*(c.r+state.boss.r+1);c.y=state.boss.y+ny*(c.r+state.boss.r+1);c.vx=(c.vx-2*dot*nx)*.86;c.vy=(c.vy-2*dot*ny)*.86;c.powerAttack=false;}if(!overlap)state.bossContact=false;
  if(state.skillGauge>=100&&!state.skill)beginSkill(state);return state;
}

export function getFormation(state){const c=state.core,h=state.history,velocity=Math.hypot(c.vx,c.vy),angle=Math.atan2(c.vy,c.vx),px=-Math.sin(angle),py=Math.cos(angle);if(c.powerAttack)return[{x:c.x,y:c.y,angle},{x:c.x-px*30-Math.cos(angle)*24,y:c.y-py*30-Math.sin(angle)*24,angle},{x:c.x+px*30-Math.cos(angle)*24,y:c.y+py*30-Math.sin(angle)*24,angle}];const a=h[Math.min(5,h.length-1)]||c,b=h[Math.min(10,h.length-1)]||a,spread=velocity>180?18:27;return[{x:c.x,y:c.y,angle},{x:a.x+px*spread,y:a.y+py*spread,angle},{x:b.x-px*spread,y:b.y-py*spread,angle}];}

export function getResults(state){return{highestCombo:state.maxCombo,flips:state.stats.flips,dashes:state.stats.dashes,dashHits:state.stats.dashHits,powerFlips:state.stats.powerFlips,perfects:state.stats.perfects,counterDashes:state.stats.counterDashes,skills:state.stats.skills,hits:state.stats.hits};}
