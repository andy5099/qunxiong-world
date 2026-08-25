export const MARBLE_ARENA={width:360,height:430,padding:22};
export const MARBLE_SKILLS={
  'guan-yu':{name:'青龍偃月',cost:8,firstHit:1.65,weak:1.25,motion:'slash',passive:'武聖'},
  'zhang-fei':{name:'震軍破陣',cost:8,firstHit:1.45,debuff:true,motion:'smash',passive:'豪膽'},
  'liu-bei':{name:'仁德軍陣',cost:7,heal:.08,motion:'support',passive:'皇叔之援'},
  'blackwind-lord':{name:'黑風亂舞',cost:5,power:1.18,damage:1.22,motion:'ricochet',passive:'黑風追擊'},
  'crimson-tiger':{name:'焚天狂襲',cost:10,firstHit:1.45,burn:true,motion:'burn',passive:'赤焰本能'},
  'nether-thunder-beast':{name:'雷影穿界',cost:10,firstHit:1.4,pierce:true,motion:'pierce',passive:'雷影'},
  'yellow-captain':{name:'鐵壁軍陣',cost:8,firstHit:1.35,guard:true,motion:'guard',passive:'重甲'},
  'yellow-commander':{name:'破軍追殺',cost:9,execute:true,motion:'hunt',passive:'乘勝追擊'},
  'zhang-bao':{name:'黃天雷陣',cost:10,firstHit:1.5,lightning:true,motion:'storm',passive:'雷引'},
  'basalt-turtle':{name:'玄武鎮岳',cost:12,firstHit:1.5,debuff:true,motion:'smash',passive:'玄武守護'},
  'storm-warden':{name:'雷谷反擊',cost:9,firstHit:1.45,lightning:true,motion:'storm',passive:'反擊'},
  'earth-brute':{name:'鎮地震破',cost:9,firstHit:1.5,debuff:true,motion:'smash',passive:'破陣'},
  'yellow-demon-general':{name:'黃天妖雷',cost:11,firstHit:1.55,lightning:true,motion:'storm',passive:'弱點轉移'},
  'nether-phoenix':{name:'冥火穿翔',cost:11,firstHit:1.5,burn:true,motion:'burn',passive:'涅槃'},
  hero:{name:'龍膽突擊',cost:6,firstHit:1.45,motion:'dash',passive:'勇進'}
};

// Ultimate data is deliberately separate from the renderer and from MP skills.
// `effect` is consumed by the battle engine; display names never drive logic.
export const MARBLE_ULTIMATES={
  hero:{name:'龍騰破軍',effect:'power',damage:2.45},
  'liu-bei':{name:'昭烈・天下歸心',effect:'heal',damage:1.75,heal:.12},
  'guan-yu':{name:'武聖・青龍滅陣',effect:'weak',damage:2.65,weak:1.2},
  'zhang-fei':{name:'萬軍俱裂',effect:'stun',damage:2.55,stun:true},
  'blackwind-lord':{name:'黑風霸天',effect:'bounce',damage:2.35,bounces:2},
  'crimson-tiger':{name:'焚天滅世',effect:'burn',damage:2.7,burn:true},
  'nether-thunder-beast':{name:'九幽天罰',effect:'pierce',damage:2.6,pierce:true},
  'yellow-captain':{name:'黃巾鐵陣',effect:'guard',damage:2.2,guard:true},
  'yellow-commander':{name:'黃天絕殺',effect:'combo',damage:2.35,combo:2},
  'zhang-bao':{name:'蒼天已死・黃天神雷',effect:'lightning',damage:2.6,lightning:true},
  'basalt-turtle':{name:'玄武・天地鎮壓',effect:'stun',damage:2.75,stun:true},
  'storm-warden':{name:'雷谷・天雷反擊',effect:'lightning',damage:2.55,lightning:true},
  'earth-brute':{name:'黃天・大地崩裂',effect:'stun',damage:2.65,stun:true},
  'yellow-demon-general':{name:'黃天崛起',effect:'combo',damage:2.75,combo:3},
  'nether-phoenix':{name:'幽冥・涅槃天火',effect:'burn',damage:2.8,burn:true}
};

export function getMarbleUltimate(member){return MARBLE_ULTIMATES[member?.id]||MARBLE_ULTIMATES.hero;}
export function getUltimateEnergy(member){return Math.max(0,Math.min(100,Number(member?.ultimateEnergy)||0));}

export function getMarbleSkill(member){return MARBLE_SKILLS[member?.id]||{name:'猛擊',cost:6,firstHit:1.35,passive:'奮戰'};}
export function hitMultiplier(hit){return hit<=1?1:hit===2?1.1:hit===3?1.2:hit===4?1.3:hit===5?1.45:Math.min(1.8,1.45+(hit-5)*.07);}
export function getBossVisualKey(battle){if(battle.worldBoss)return battle.worldBossId==='basaltTurtle'?'basalt-turtle':battle.worldBossId==='netherThunder'?'thunder-beast':'crimson-tiger';if(battle.bossKind)return battle.bossKind;return'blackwind-lord';}
export function getFormationTier(combo){return combo>=50?4:combo>=35?3:combo>=20?2:combo>=10?1:0;}
export function getFormationRole(member){const id=member?.id;if(['guan-yu','yellow-commander','storm-warden','yellow-demon-general','nether-phoenix'].includes(id))return'vanguard';if(['zhang-fei','earth-brute'].includes(id))return'breaker';if(['liu-bei','yellow-captain'].includes(id))return'support';if(id==='zhang-bao')return'mage';if(['crimson-tiger','nether-thunder-beast','basalt-turtle'].includes(id))return'world';return'vanguard';}

const LAYOUTS={
  forest:[[{type:'rock',shape:'circle',x:180,y:205,r:27}],[{type:'stump',shape:'rect',x:72,y:208,w:38,h:82}]],
  stronghold:[[{type:'palisade',shape:'rect',x:160,y:212,w:42,h:92}],[{type:'rock',shape:'circle',x:96,y:225,r:25},{type:'stump',shape:'rect',x:250,y:220,w:30,h:70}]],
  yellow:[[{type:'palisade',shape:'rect',x:82,y:215,w:34,h:94}],[{type:'pillar',shape:'circle',x:270,y:210,r:26}]],
  crimson:[[{type:'lava-rock',shape:'circle',x:90,y:220,r:28},{type:'lava-pillar',shape:'rect',x:252,y:215,w:36,h:92}],[{type:'lava-rock',shape:'circle',x:180,y:215,r:30}]],
  thunder:[[{type:'thunder-stone',shape:'circle',x:82,y:210,r:25},{type:'thunder-pillar',shape:'rect',x:252,y:212,w:34,h:94}],[{type:'thunder-stone',shape:'circle',x:180,y:205,r:27},{type:'thunder-pillar',shape:'rect',x:70,y:245,w:30,h:74}]]
};

export function createMarbleBattleState(battle,party,rng=Math.random){
  const visual=getBossVisualKey(battle),theme=visual==='basalt-turtle'?'forest':visual==='crimson-tiger'?'crimson':visual==='thunder-beast'?'thunder':battle.areaId?.startsWith('yellow')||battle.bossKind?'yellow':battle.areaId==='forest'?'forest':'stronghold';
  const layouts=LAYOUTS[theme]||LAYOUTS.stronghold,layout=layouts[Math.floor(rng()*layouts.length)%layouts.length];
  const entities=party.slice(0,3).map((member,i)=>member?{characterId:member.id,x:85+i*95,y:185+i*26,vx:(i-1)*45,vy:0,radius:20,rarityRank:member.rarityRank||1,worldBoss:Boolean(member.worldBoss),breakthroughLevel:member.breakthroughLevel||0,individualTalent:member.individualTalent||null}:null);
  // Collider radius remains authoritative; these fields only control artwork.
  const size=battle.worldBoss?58:Math.min(52,40+(battle.bossRarityRank||1)*2),boss={x:180,y:78,radius:size,visualKey:visual,weakAngle:Math.PI*.5,visualWidth:battle.worldBoss?154:size*2.2,visualHeight:battle.worldBoss?154:size*2.2,visualOffsetX:0,visualOffsetY:5};
  return{entities,boss,obstacles:layout.map(item=>({...item})),turnIndex:0,acted:[],phase:'pinball',flippers:{left:0,right:0},combo:0,maxCombo:0,comboTime:0,climaxTime:0,breakGauge:0,breakTime:0,breakImmunity:0,skills:entities.map(()=>({energy:0,armed:false,queued:false})),supports:party.slice(3,5).map((member,index)=>member?{index:index+3,energy:0,ready:false,queued:false}:null),skillQueue:[],schedulerCooldown:0,ultimateGauge:0,formationReady:0,formationActive:null,leadRole:getFormationRole(party[0]),bossAttackIn:5,bossTelegraph:0,counterWindow:0,perfectWindow:0,fieldPulseIn:5,skillArmed:false,ultimateArmed:false,assistIn:0,camera:{shake:0,nudgeX:0,zoom:1},hitStop:0,stats:{flips:0,dashes:0,assistDashes:0,counters:0,perfectCounters:0,powerLevels:[0,0,0,0],breaks:0,skills:0,ultimates:0,lastHitAt:null,hitGaps:[]},aim:{dx:0,dy:80,power:0,timeLeft:6},shot:{hits:0,damage:0,wallBounces:0,obstacleBounces:0,friendHits:[],ultimate:false,power:0},effects:[],theme,lastProgressAt:Date.now()};
}

export function ensureMarbleBattle(battle,party,rng=Math.random){if(!battle)return null;if(!battle.marble)battle.marble=createMarbleBattleState(battle,party,rng);const marble=battle.marble;marble.camera=marble.camera||{shake:0,nudgeX:0,zoom:1};marble.stats=marble.stats||{flips:0,dashes:0,assistDashes:0,counters:0,perfectCounters:0,powerLevels:[0,0,0,0],breaks:0,skills:0,ultimates:0,lastHitAt:null,hitGaps:[]};marble.stats.powerLevels=Array.isArray(marble.stats.powerLevels)?marble.stats.powerLevels:[0,0,0,0];marble.stats.hitGaps=Array.isArray(marble.stats.hitGaps)?marble.stats.hitGaps:[];marble.climaxTime=Number(marble.climaxTime)||0;marble.assistIn=Number(marble.assistIn)||0;marble.bossTelegraph=Number(marble.bossTelegraph)||0;marble.counterWindow=Number(marble.counterWindow)||0;marble.perfectWindow=Number(marble.perfectWindow)||0;return marble;}
export function getCurrentMarble(battle){return battle?.marble?.entities?.[battle.marble.turnIndex]||null;}
export function aimVelocity(dx,dy,maxPower=720){const distance=Math.hypot(dx,dy),power=Math.min(1,distance/115),scale=maxPower*power/Math.max(1,distance);return{vx:-dx*scale,vy:-dy*scale,power};}

function circleRect(entity,obstacle){const closestX=Math.max(obstacle.x-obstacle.w/2,Math.min(entity.x,obstacle.x+obstacle.w/2)),closestY=Math.max(obstacle.y-obstacle.h/2,Math.min(entity.y,obstacle.y+obstacle.h/2));const dx=entity.x-closestX,dy=entity.y-closestY;return dx*dx+dy*dy<entity.radius*entity.radius?{dx,dy,closestX,closestY}:null;}
function reflectCircle(entity,cx,cy,radius,bounce=.78){const dx=entity.x-cx,dy=entity.y-cy,dist=Math.max(.001,Math.hypot(dx,dy)),min=entity.radius+radius;if(dist>=min)return false;const nx=dx/dist,ny=dy/dist,dot=entity.vx*nx+entity.vy*ny;entity.x=cx+nx*(min+.5);entity.y=cy+ny*(min+.5);entity.vx=(entity.vx-2*dot*nx)*bounce;entity.vy=(entity.vy-2*dot*ny)*bounce;return true;}

export function stepMarblePhysics(marble,dt){
  if(marble.phase==='pinball')return stepPinballPhysics(marble,dt);
  const entity=marble.entities[marble.turnIndex],events=[];if(!entity||marble.phase!=='moving')return events;
  dt=Math.min(.032,Math.max(0,dt));entity.x+=entity.vx*dt;entity.y+=entity.vy*dt;
  const p=MARBLE_ARENA.padding,r=entity.radius,w=MARBLE_ARENA.width,h=MARBLE_ARENA.height;
  if(entity.x-r<p){entity.x=p+r;entity.vx=Math.abs(entity.vx)*.82;events.push({type:'wall'});}else if(entity.x+r>w-p){entity.x=w-p-r;entity.vx=-Math.abs(entity.vx)*.82;events.push({type:'wall'});}
  if(entity.y-r<p){entity.y=p+r;entity.vy=Math.abs(entity.vy)*.82;events.push({type:'wall'});}else if(entity.y+r>h-p){entity.y=h-p-r;entity.vy=-Math.abs(entity.vy)*.82;events.push({type:'wall'});}
  for(const obstacle of marble.obstacles){let hit=false;const bounce=(entity.characterId==='nether-thunder-beast'||entity.characterId==='yellow-captain') ? .9 : .8;if(obstacle.shape==='circle')hit=reflectCircle(entity,obstacle.x,obstacle.y,obstacle.r,bounce);else{const contact=circleRect(entity,obstacle);if(contact){const horizontal=Math.abs(contact.dx)>Math.abs(contact.dy);if(horizontal)entity.vx*=-bounce;else entity.vy*=-bounce;entity.x+=Math.sign(contact.dx||1)*2;entity.y+=Math.sign(contact.dy||1)*2;hit=true;}}if(hit)events.push({type:'obstacle'});}
  const boss=marble.boss,bossOverlap=Math.hypot(entity.x-boss.x,entity.y-boss.y)<entity.radius+boss.radius;
  if(bossOverlap&&!marble.bossContact){const angle=Math.atan2(entity.y-boss.y,entity.x-boss.x),weak=Math.abs(Math.atan2(Math.sin(angle-boss.weakAngle),Math.cos(angle-boss.weakAngle)))<.48;events.push({type:'boss',weak,speed:Math.hypot(entity.vx,entity.vy)});marble.bossContact=true;if(entity.characterId!=='nether-thunder-beast'||!marble.skillArmed)reflectCircle(entity,boss.x,boss.y,boss.radius,.86);}
  if(!bossOverlap)marble.bossContact=false;
  marble.entities.forEach((friend,i)=>{if(!friend||i===marble.turnIndex||marble.shot.friendHits.includes(i))return;if(Math.hypot(entity.x-friend.x,entity.y-friend.y)<entity.radius+friend.radius){marble.shot.friendHits.push(i);events.push({type:'friend',index:i});}});
  const friction=Math.pow(.985,dt*60);entity.vx*=friction;entity.vy*=friction;
  if(Math.hypot(entity.vx,entity.vy)<22){entity.vx=0;entity.vy=0;events.push({type:'stop'});marble.phase='settling';}
  return events;
}

export function activateMarbleFlippers(marble,side='both'){
  if(!marble||marble.phase!=='pinball')return false;
  if(!marble.flippers)marble.flippers={left:0,right:0};
  if(side==='left'||side==='both')marble.flippers.left=.16;
  if(side==='right'||side==='both')marble.flippers.right=.16;
  const formation=marble.formationReady||0,leadRole=marble.leadRole||'vanguard',formationBoost=formation?1+formation*.1:1;let launched=false;
  for(const entity of marble.entities.filter(Boolean)){
    const entitySide=entity.x<MARBLE_ARENA.width/2?'left':'right';
    if(entity.y>MARBLE_ARENA.height-145&&(side==='both'||side===entitySide)){const edge=entitySide==='left'?-1:1,center=(entitySide==='left'?118:242),angle=Math.max(-1,Math.min(1,(entity.x-center)/80)),roleBoost=leadRole==='world'?1.08:leadRole==='vanguard'?1.04:1;entity.vy=(-650-Math.abs(angle)*70)*formationBoost*roleBoost;entity.vx+=(edge*100-angle*185)*formationBoost;launched=true;}
  }
  if(!launched){const targets=marble.entities.filter(Boolean).filter(entity=>side==='both'||(entity.x<MARBLE_ARENA.width/2?'left':'right')===side),counter=marble.counterWindow>0,perfect=marble.perfectWindow>0;for(const entity of targets){const dx=marble.boss.x-entity.x,dy=marble.boss.y-entity.y,d=Math.max(1,Math.hypot(dx,dy)),speed=perfect?820:counter?760:690;entity.vx=dx/d*speed;entity.vy=dy/d*speed;launched=true;}if(launched){marble.stats.dashes++;marble.camera.nudgeX=side==='left'?5:-5;marble.camera.shake=counter?.18:.08;if(counter){marble.stats.counters++;if(perfect)marble.stats.perfectCounters++;marble.breakGauge=Math.min(100,marble.breakGauge+(perfect?38:25));marble.formationReady=Math.max(marble.formationReady,perfect?3:2);marble.comboTime=Math.max(marble.comboTime,3);marble.effects.push({type:'counter',x:180,y:210,text:perfect?'PERFECT COUNTER！':'COUNTER DASH！',life:.8});marble.bossTelegraph=0;marble.counterWindow=0;marble.perfectWindow=0;}}}
  else marble.stats.flips++;
  if(formation&&launched){marble.formationActive={tier:formation,role:leadRole,hits:0,time:formation===4?1.2:4};marble.stats.powerLevels[formation-1]++;marble.formationReady=0;marble.effects.push({type:'formation',x:180,y:335,text:`POWER ${formation===4?'MAX':['','I','II','III'][formation]}！`,life:1});if(formation===4){marble.camera.zoom=1.035;marble.camera.shake=.25;for(const entity of marble.entities.filter(Boolean)){const dx=marble.boss.x-entity.x,dy=marble.boss.y-entity.y,d=Math.max(1,Math.hypot(dx,dy));entity.vx=dx/d*760;entity.vy=dy/d*760;}}}
  marble.lastProgressAt=Date.now();
  return true;
}

function stepPinballPhysics(marble,dt){
  const events=[];dt=Math.min(.032,Math.max(0,dt));if(marble.hitStop>0){marble.hitStop=Math.max(0,marble.hitStop-dt);return events;}
  marble.flippers=marble.flippers||{left:0,right:0};marble.flippers.left=Math.max(0,marble.flippers.left-dt);marble.flippers.right=Math.max(0,marble.flippers.right-dt);
  marble.comboTime=Math.max(0,(marble.comboTime||0)-dt);if(!marble.comboTime)marble.combo=0;marble.climaxTime=Math.max(0,(marble.climaxTime||0)-dt);marble.assistIn=(marble.assistIn||0)+dt;marble.camera.shake=Math.max(0,(marble.camera.shake||0)-dt);marble.camera.nudgeX*=.84;if(!marble.formationActive)marble.camera.zoom+=(1-marble.camera.zoom)*.12;marble.boss.flash=Math.max(0,(marble.boss.flash||0)-dt);marble.boss.recoilX=(marble.boss.recoilX||0)*.88;
  marble.breakTime=Math.max(0,(marble.breakTime||0)-dt);
  marble.breakImmunity=Math.max(0,(marble.breakImmunity||0)-dt);if(!marble.breakTime&&marble.breakGauge>=100){marble.breakGauge=0;marble.breakImmunity=2;}
  if(marble.formationActive){marble.formationActive.time-=dt;if(marble.formationActive.time<=0)marble.formationActive=null;}
  const p=MARBLE_ARENA.padding,w=MARBLE_ARENA.width,h=MARBLE_ARENA.height,boss=marble.boss;
  marble.entities.forEach((entity,index)=>{
    if(!entity)return;entity.vy+=490*dt;entity.x+=entity.vx*dt;entity.y+=entity.vy*dt;
    const r=entity.radius;
    if(entity.x-r<p){entity.x=p+r;entity.vx=Math.abs(entity.vx)*.86;events.push({type:'wall',entityIndex:index});}
    else if(entity.x+r>w-p){entity.x=w-p-r;entity.vx=-Math.abs(entity.vx)*.86;events.push({type:'wall',entityIndex:index});}
    if(entity.y-r<p){entity.y=p+r;entity.vy=Math.abs(entity.vy)*.82;events.push({type:'wall',entityIndex:index});}
    const floor=h-p-r;
    if(entity.y>floor){const side=entity.x<w/2?'left':'right',active=marble.flippers[side]>0;entity.y=floor;entity.vy=active?-610:-Math.max(70,Math.abs(entity.vy)*.45);entity.vx+=(side==='left'?-1:1)*(active?120:25);events.push({type:'flipper',entityIndex:index,side});}
    const overlap=Math.hypot(entity.x-boss.x,entity.y-boss.y)<r+boss.radius;
    const contactKey=`contact${index}`;
    if(overlap&&!marble[contactKey]){const angle=Math.atan2(entity.y-boss.y,entity.x-boss.x),weak=Math.abs(Math.atan2(Math.sin(angle-boss.weakAngle),Math.cos(angle-boss.weakAngle)))<.5;events.push({type:'boss',entityIndex:index,weak,speed:Math.hypot(entity.vx,entity.vy),x:entity.x,y:entity.y});marble[contactKey]=true;reflectCircle(entity,boss.x,boss.y,boss.radius,.94);}
    if(!overlap)marble[contactKey]=false;
    entity.vx*=Math.pow(marble.formationActive?.role==='world'||marble.climaxTime>0 ? .9992 : .997,dt*60);if(Math.hypot(entity.vx,entity.vy)<80&&entity.y<h-125){const dx=boss.x-entity.x,dy=boss.y-entity.y,d=Math.max(1,Math.hypot(dx,dy));entity.vx+=dx/d*55*dt;entity.vy+=dy/d*55*dt;}
  });
  const leader=marble.entities[0];if(leader)marble.entities.slice(1).forEach((entity,index)=>{if(!entity)return;const side=index?1:-1,tight=marble.formationActive||marble.climaxTime>0,targetX=leader.x+side*(tight?18:34),targetY=leader.y+(tight?18:28);entity.vx+=(targetX-entity.x)*(tight?2.8:1.4)*dt;entity.vy+=(targetY-entity.y)*(tight?2.8:1.4)*dt;});
  if(marble.assistIn>1.15){const entity=marble.entities.filter(Boolean).sort((a,b)=>Math.hypot(a.x-boss.x,a.y-boss.y)-Math.hypot(b.x-boss.x,b.y-boss.y))[0];if(entity&&entity.y<h-80){const dx=boss.x-entity.x,dy=boss.y-entity.y,d=Math.max(1,Math.hypot(dx,dy));entity.vx=dx/d*520;entity.vy=dy/d*520;marble.assistIn=.35;marble.stats.assistDashes++;marble.effects.push({type:'assist',x:entity.x,y:entity.y-22,text:'ASSIST',life:.4});}}
  for(let i=0;i<marble.entities.length;i++)for(let j=i+1;j<marble.entities.length;j++){
    const a=marble.entities[i],b=marble.entities[j];if(!a||!b)continue;
    const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy),minimum=a.radius+b.radius;if(!distance||distance>=minimum)continue;
    const nx=dx/distance,ny=dy/distance,relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(relative>0){a.vx-=relative*nx;a.vy-=relative*ny;b.vx+=relative*nx;b.vy+=relative*ny;}
    const overlap=(minimum-distance)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;events.push({type:'friend',entityIndex:i,index:j});
  }
  return events;
}
