export const MARBLE_ARENA={width:360,height:430,padding:22};
export const MARBLE_SKILLS={
  'guan-yu':{name:'青龍斬',cost:8,firstHit:1.65,weak:1.25,passive:'武聖'},
  'zhang-fei':{name:'震地猛擊',cost:8,firstHit:1.45,debuff:true,passive:'豪膽'},
  'liu-bei':{name:'仁德',cost:7,heal:.08,passive:'皇叔之援'},
  'blackwind-lord':{name:'強襲',cost:5,power:1.18,damage:1.22,passive:'黑風追擊'},
  'crimson-tiger':{name:'烈焰突襲',cost:10,firstHit:1.45,burn:true,passive:'赤焰本能'},
  'nether-thunder-beast':{name:'雷霆穿擊',cost:10,firstHit:1.4,pierce:true,passive:'雷影'},
  'yellow-captain':{name:'鐵壁衝鋒',cost:8,firstHit:1.35,guard:true,passive:'重甲'},
  'yellow-commander':{name:'破軍',cost:9,execute:true,passive:'乘勝追擊'},
  'zhang-bao':{name:'妖雷',cost:10,firstHit:1.5,lightning:true,passive:'雷引'},
  hero:{name:'猛擊',cost:6,firstHit:1.45,passive:'勇進'}
};

// Ultimate data is deliberately separate from the renderer and from MP skills.
// `effect` is consumed by the battle engine; display names never drive logic.
export const MARBLE_ULTIMATES={
  hero:{name:'星刃・破軍一閃',effect:'power',damage:2.45},
  'liu-bei':{name:'仁德・萬軍同心',effect:'heal',damage:1.75,heal:.12},
  'guan-yu':{name:'武聖・青龍偃月',effect:'weak',damage:2.65,weak:1.2},
  'zhang-fei':{name:'燕人・震天怒擊',effect:'stun',damage:2.55,stun:true},
  'blackwind-lord':{name:'黑風・百裂旋刃',effect:'bounce',damage:2.35,bounces:2},
  'crimson-tiger':{name:'赤焰・焚天虎嘯',effect:'burn',damage:2.7,burn:true},
  'nether-thunder-beast':{name:'九幽・萬雷天劫',effect:'pierce',damage:2.6,pierce:true},
  'yellow-captain':{name:'黃巾・鐵壁衝陣',effect:'guard',damage:2.2,guard:true},
  'yellow-commander':{name:'蒼天・萬軍號令',effect:'combo',damage:2.35,combo:2},
  'zhang-bao':{name:'地公・雷獄天罰',effect:'lightning',damage:2.6,lightning:true}
};

export function getMarbleUltimate(member){return MARBLE_ULTIMATES[member?.id]||MARBLE_ULTIMATES.hero;}
export function getUltimateEnergy(member){return Math.max(0,Math.min(100,Number(member?.ultimateEnergy)||0));}

export function getMarbleSkill(member){return MARBLE_SKILLS[member?.id]||{name:'猛擊',cost:6,firstHit:1.35,passive:'奮戰'};}
export function hitMultiplier(hit){return hit<=1?1:hit===2?1.1:hit===3?1.2:hit===4?1.3:hit===5?1.45:Math.min(1.8,1.45+(hit-5)*.07);}
export function getBossVisualKey(battle){if(battle.worldBoss)return battle.worldBossId==='netherThunder'?'thunder-beast':'crimson-tiger';if(battle.bossKind)return battle.bossKind;return'blackwind-lord';}

const LAYOUTS={
  forest:[[{type:'rock',shape:'circle',x:180,y:205,r:27}],[{type:'stump',shape:'rect',x:72,y:208,w:38,h:82}]],
  stronghold:[[{type:'palisade',shape:'rect',x:160,y:212,w:42,h:92}],[{type:'rock',shape:'circle',x:96,y:225,r:25},{type:'stump',shape:'rect',x:250,y:220,w:30,h:70}]],
  yellow:[[{type:'palisade',shape:'rect',x:82,y:215,w:34,h:94}],[{type:'pillar',shape:'circle',x:270,y:210,r:26}]],
  crimson:[[{type:'lava-rock',shape:'circle',x:90,y:220,r:28},{type:'lava-pillar',shape:'rect',x:252,y:215,w:36,h:92}],[{type:'lava-rock',shape:'circle',x:180,y:215,r:30}]],
  thunder:[[{type:'thunder-stone',shape:'circle',x:82,y:210,r:25},{type:'thunder-pillar',shape:'rect',x:252,y:212,w:34,h:94}],[{type:'thunder-stone',shape:'circle',x:180,y:205,r:27},{type:'thunder-pillar',shape:'rect',x:70,y:245,w:30,h:74}]]
};

export function createMarbleBattleState(battle,party,rng=Math.random){
  const visual=getBossVisualKey(battle),theme=visual==='crimson-tiger'?'crimson':visual==='thunder-beast'?'thunder':battle.areaId?.startsWith('yellow')||battle.bossKind?'yellow':battle.areaId==='forest'?'forest':'stronghold';
  const layouts=LAYOUTS[theme]||LAYOUTS.stronghold,layout=layouts[Math.floor(rng()*layouts.length)%layouts.length];
  const entities=party.slice(0,3).map((member,i)=>member?{characterId:member.id,x:85+i*95,y:185+i*26,vx:(i-1)*45,vy:0,radius:20,rarityRank:member.rarityRank||1,worldBoss:Boolean(member.worldBoss)}:null);
  const size=battle.worldBoss?58:Math.min(52,40+(battle.bossRarityRank||1)*2),boss={x:180,y:78,radius:size,visualKey:visual,weakAngle:Math.PI*.5};
  return{entities,boss,obstacles:[],turnIndex:0,acted:[],phase:'pinball',flipperTime:0,combo:0,comboTime:0,weakStreak:0,breakTime:0,skills:entities.map(()=>({energy:0,armed:false})),skillArmed:false,ultimateArmed:false,aim:{dx:0,dy:80,power:0,timeLeft:6},shot:{hits:0,damage:0,wallBounces:0,obstacleBounces:0,friendHits:[],ultimate:false,power:0},effects:[],theme};
}

export function ensureMarbleBattle(battle,party,rng=Math.random){if(!battle)return null;if(!battle.marble)battle.marble=createMarbleBattleState(battle,party,rng);return battle.marble;}
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

export function activateMarbleFlippers(marble){
  if(!marble||marble.phase!=='pinball')return false;
  marble.flipperTime=.16;
  for(const entity of marble.entities.filter(Boolean)){
    if(entity.y>MARBLE_ARENA.height-145){entity.vy=-610;entity.vx+=(entity.x<MARBLE_ARENA.width/2?-1:1)*115;}
  }
  return true;
}

function stepPinballPhysics(marble,dt){
  const events=[];dt=Math.min(.032,Math.max(0,dt));
  marble.flipperTime=Math.max(0,(marble.flipperTime||0)-dt);
  marble.comboTime=Math.max(0,(marble.comboTime||0)-dt);if(!marble.comboTime)marble.combo=0;
  marble.breakTime=Math.max(0,(marble.breakTime||0)-dt);
  const p=MARBLE_ARENA.padding,w=MARBLE_ARENA.width,h=MARBLE_ARENA.height,boss=marble.boss;
  marble.entities.forEach((entity,index)=>{
    if(!entity)return;entity.vy+=520*dt;entity.x+=entity.vx*dt;entity.y+=entity.vy*dt;
    const r=entity.radius;
    if(entity.x-r<p){entity.x=p+r;entity.vx=Math.abs(entity.vx)*.86;events.push({type:'wall',entityIndex:index});}
    else if(entity.x+r>w-p){entity.x=w-p-r;entity.vx=-Math.abs(entity.vx)*.86;events.push({type:'wall',entityIndex:index});}
    if(entity.y-r<p){entity.y=p+r;entity.vy=Math.abs(entity.vy)*.82;events.push({type:'wall',entityIndex:index});}
    const floor=h-p-r;
    if(entity.y>floor){entity.y=floor;entity.vy=marble.flipperTime>0?-610:-Math.max(70,Math.abs(entity.vy)*.45);entity.vx+=(entity.x<w/2?-1:1)*(marble.flipperTime>0?120:25);events.push({type:'flipper',entityIndex:index});}
    const overlap=Math.hypot(entity.x-boss.x,entity.y-boss.y)<r+boss.radius;
    const contactKey=`contact${index}`;
    if(overlap&&!marble[contactKey]){const angle=Math.atan2(entity.y-boss.y,entity.x-boss.x),weak=Math.abs(Math.atan2(Math.sin(angle-boss.weakAngle),Math.cos(angle-boss.weakAngle)))<.5;events.push({type:'boss',entityIndex:index,weak,speed:Math.hypot(entity.vx,entity.vy)});marble[contactKey]=true;reflectCircle(entity,boss.x,boss.y,boss.radius,.9);}
    if(!overlap)marble[contactKey]=false;
    entity.vx*=Math.pow(.997,dt*60);
  });
  for(let i=0;i<marble.entities.length;i++)for(let j=i+1;j<marble.entities.length;j++){
    const a=marble.entities[i],b=marble.entities[j];if(!a||!b)continue;
    const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy),minimum=a.radius+b.radius;if(!distance||distance>=minimum)continue;
    const nx=dx/distance,ny=dy/distance,relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(relative>0){a.vx-=relative*nx;a.vy-=relative*ny;b.vx+=relative*nx;b.vy+=relative*ny;}
    const overlap=(minimum-distance)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;events.push({type:'friend',entityIndex:i,index:j});
  }
  return events;
}
