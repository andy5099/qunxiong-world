const TAU = Math.PI * 2;

function disc(ctx, x, y, r, fill, stroke = null) { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); } }
function poly(ctx, points, fill, stroke = null) { ctx.fillStyle = fill; ctx.beginPath(); for (let i=0;i<points.length;i+=1) { const p=points[i]; if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]); } ctx.closePath();ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();} }
function line(ctx,x1,y1,x2,y2,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function shadow(ctx, floating=false) { ctx.save();ctx.globalAlpha=floating ? .15 : .24;ctx.fillStyle='#07111e';ctx.beginPath();ctx.ellipse(0,floating?20:24,floating?15:18,floating?3:4,0,0,TAU);ctx.fill();ctx.restore(); }
function eyes(ctx,y=-4,color='#1e2942'){disc(ctx,-5,y,2.35,color);disc(ctx,5,y,2.35,color);disc(ctx,-4.4,y-.7,.65,'#fff');disc(ctx,5.6,y-.7,.65,'#fff');}
function qualityAdornment(ctx, pet, state) {
  const rank={common:0,uncommon:1,rare:1,epic:2,legendary:3,mythic:3,astral:3}[pet?.quality] || 0;
  if (!rank) return;
  const color=rank===1?'#8be8ff':rank===2?'#d29cff':'#ffd66f';
  ctx.save();ctx.globalAlpha=state.powerSave ? .2 : .48;ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,6,22+rank*2,Math.PI*.1,Math.PI*.9);ctx.stroke();
  if(rank>1)disc(ctx,0,-28,2.5,color); if(rank>2){disc(ctx,-18,1,1.6,color);disc(ctx,18,1,1.6,color);} ctx.restore();
}

function drawSlimePet(ctx, pet, state) {
  const icy=pet.visualType==='iceSlimePet'; const bounce=Math.sin(state.time*5)*2.2+(state.attack?-5:0);
  ctx.save();ctx.translate(0,bounce);ctx.scale(state.hurt ? .86 : 1, state.hurt?1.12:1);
  const fill=ctx.createRadialGradient(-6,-11,1,0,0,22);fill.addColorStop(0,'#efffff');fill.addColorStop(1,icy?'#6dbde9':'#62d4ae');
  ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(-20,13);ctx.quadraticCurveTo(-20,-17,-2,-22);ctx.quadraticCurveTo(17,-20,22,8);ctx.quadraticCurveTo(20,16,0,17);ctx.quadraticCurveTo(-17,17,-20,13);ctx.fill();
  eyes(ctx,-2);ctx.strokeStyle='#31506c';ctx.beginPath();ctx.arc(0,5,3,.1,Math.PI-.1);ctx.stroke();
  if(icy)poly(ctx,[[-5,-17],[0,-31],[6,-17]],'#cfffff','#fff');else{line(ctx,0,-18,2,-29,'#72b96c',2);disc(ctx,5,-30,3.6,'#c6f48d');}
  if(state.attack){ctx.globalAlpha=.5;disc(ctx,26,-3,5,icy?'#d5ffff':'#d9ffb1');}ctx.restore();
}

function drawSlimeE0(ctx, pet, state) { drawSlimePet(ctx, pet, state); }
function drawSlimeE1(ctx, pet, state) { drawSlimePet(ctx, pet, state); for(const x of[-14,0,14])poly(ctx,[[x-4,-12],[x,-27-(x===0?4:0)],[x+4,-12]],'#b6fff2','#efffff'); }
function drawSlimeE2(ctx, pet, state) { drawSlimeE1(ctx,pet,state); poly(ctx,[[-12,-22],[-7,-35],[-1,-26],[5,-39],[10,-25],[16,-34],[17,-19]],'#f7cf69','#fff2b0'); line(ctx,-20,5,-30,-1,'#6bb5ad',3);line(ctx,20,5,30,-1,'#6bb5ad',3); }
function drawSlimeE3(ctx, pet, state) { drawSlimeE2(ctx,pet,state); for(const side of[-1,1])poly(ctx,[[side*12,-4],[side*36,-19],[side*29,11],[side*12,14]],'#af8cff','#f3d8ff'); }
function drawSlimeE4(ctx, pet, state) { drawSlimeE3(ctx,pet,state); ctx.save();ctx.globalAlpha=state.powerSave ? .22 : .58;ctx.strokeStyle='#ff90e8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,1,34+Math.sin(state.time*3)*3,0,TAU);ctx.stroke();disc(ctx,0,-43,4,'#fff3a6');ctx.restore(); }
function drawSlimeEvolution(ctx, pet, state) { [drawSlimeE0,drawSlimeE1,drawSlimeE2,drawSlimeE3,drawSlimeE4][Math.max(0,Math.min(4,pet.evolutionRank||0))](ctx,pet,state); }

function drawEvolutionForm(ctx, pet, state) {
  const rank=Math.max(0,Math.min(4,pet.evolutionRank||0)); if(!rank || pet.visualType==='slimePet')return;
  const theme=pet.visualTheme||'astral'; const colors={moonRabbit:'#f3b4ff',thornBeetle:'#b8ff9b',forestWolf:'#8fffc7',crystalBloom:'#94ffd0',runeSpirit:'#d7a5ff',magmaLizard:'#ff9a62',emberFiend:'#ff825f',solarHawk:'#ffd56f',frostSlime:'#a9efff',frostWolf:'#b8f7ff',frostGolem:'#cdf6ff',ruinSentinel:'#cdb1ff',astralOrb:'#d6a5ff',astralMech:'#ffadf0',crownBeast:'#ffdc75',worldTree:'#9cf2a6',infernoDragon:'#ff864f',frostQueen:'#b7ecff',voidDestroyer:'#e2a7ff'};
  const glow=colors[theme]||'#c29aff';ctx.save();ctx.globalAlpha=state.powerSave ? .2 : .58;
  const beast=['moonRabbit','forestWolf','frostWolf'].includes(theme); const shell=theme==='thornBeetle'; const plant=['crystalBloom','worldTree'].includes(theme); const flame=['magmaLizard','emberFiend','solarHawk','infernoDragon'].includes(theme); const machine=['frostGolem','ruinSentinel','astralMech','voidDestroyer'].includes(theme); const mystic=['runeSpirit','astralOrb','frostQueen','frostSlime'].includes(theme);
  if(rank>=1){
    if(beast)for(const side of[-1,1])poly(ctx,[[side*8,-11],[side*16,-29],[side*23,-9]],glow,'#f8fbff');
    else if(shell)for(const side of[-1,1])line(ctx,side*10,-6,side*22,-22,glow,3);
    else if(plant)for(const side of[-1,1])poly(ctx,[[side*7,-7],[side*23,-21],[side*18,3]],glow,'#e8ffe4');
    else if(flame)for(const side of[-1,1])poly(ctx,[[side*8,-5],[side*20,-27],[side*24,4]],glow,'#ffe3a3');
    else if(machine)for(const side of[-1,1])poly(ctx,[[side*11,-8],[side*25,-17],[side*23,6]],'#8694bb',glow);
    else {ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.stroke();}
  }
  if(rank>=2){
    if(beast)poly(ctx,[[-12,-19],[-7,-34],[-1,-25],[5,-38],[10,-24],[16,-32],[17,-16]],'#ffd86f','#fff0b0');
    else if(shell)for(const side of[-1,1])poly(ctx,[[side*7,-12],[side*18,-25],[side*17,8],[side*8,12]],glow,'#efffff');
    else if(plant)for(let i=0;i<5;i+=1){ctx.save();ctx.rotate(i*TAU/5);poly(ctx,[[-4,-22],[0,-35],[4,-22]],glow,'#f0ffe2');ctx.restore();}
    else if(flame)for(const side of[-1,1])line(ctx,side*12,7,side*31,14,glow,4);
    else if(machine){disc(ctx,0,-22,7,glow,'#fff');for(const side of[-1,1])disc(ctx,side*27,2,4,glow);}
    else {for(const side of[-1,1])poly(ctx,[[side*9,-3],[side*28,-20],[side*23,13]],glow,'#f2dfff');}
  }
  if(rank>=3){
    if(beast||flame)for(const side of[-1,1])poly(ctx,[[side*12,1],[side*39,-16],[side*31,17],[side*13,13]],glow,'#f8e4ff');
    else if(shell||machine)for(const side of[-1,1])poly(ctx,[[side*13,-3],[side*40,-10],[side*32,16],[side*12,12]],glow,'#edfaff');
    else if(plant)for(const side of[-1,1])line(ctx,side*8,10,side*35,-9,glow,4);
    else {ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,34,0,TAU);ctx.stroke();}
  }
  if(rank>=4){ctx.strokeStyle=glow;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,1,35+Math.sin(state.time*3)*3,0,TAU);ctx.stroke();disc(ctx,0,-43,4,'#fff3a6');for(const side of[-1,1])disc(ctx,side*31,4,3,glow);}
  ctx.restore();
}

function drawRabbitPet(ctx, pet, state) {
  const hop=Math.max(0,Math.sin(state.time*3.2))*2+(state.attack?-7:0); const ear=Math.sin(state.time*4)*2;
  ctx.save();ctx.translate(0,hop);shadow(ctx);disc(ctx,13,11,5,'#f8edff');ctx.fillStyle='#d8c4f5';ctx.beginPath();ctx.ellipse(-1,6,17,12,-.08,0,TAU);ctx.fill();disc(ctx,-3,-9,13,'#f0e4ff');
  poly(ctx,[[-12,-17],[-15,-38-ear],[-4,-18]],'#dfd0ff','#8e77af');poly(ctx,[[5,-18],[13,-38+ear],[16,-16]],'#dfd0ff','#8e77af');
  poly(ctx,[[-10,-20],[-12,-34-ear],[-6,-19]],'#f59acb');poly(ctx,[[8,-20],[11,-34+ear],[13,-18]],'#f59acb');eyes(ctx,-9);disc(ctx,1,-4,1.5,'#ef8eaa');line(ctx,-8,13,-11,20,'#a287cf',3);line(ctx,7,13,11,20,'#a287cf',3);
  if(state.attack){ctx.globalAlpha=.38;line(ctx,13,3,38,-7,'#f4c6ff',3);}ctx.restore();
}

function drawBeetlePet(ctx, pet, state) {
  const wing=Math.sin(state.time*7)*3;ctx.save();shadow(ctx);poly(ctx,[[-17,8],[-13,-9],[0,-17],[15,-9],[18,9],[10,16],[-10,16]],'#426b78','#c6f5dc');poly(ctx,[[-12,9],[-8,-11],[0,-14],[0,16]],'#70d49d','#e1ffdc');poly(ctx,[[12,9],[8,-11],[0,-14],[0,16]],'#4ba883','#e1ffdc');disc(ctx,0,-17,8,'#b4f2a8');eyes(ctx,-18);for(const side of[-1,1]){line(ctx,side*10,5,side*22,13+wing,'#345763',2);line(ctx,side*9,11,side*19,20-wing,'#345763',2);}if(state.attack)disc(ctx,27,-3,5,'#aaffc4');ctx.restore();
}

function drawWolfPet(ctx, pet, state) {
  const frost=pet.visualType==='frostWolfPet';const trot=Math.sin(state.time*5)*2;ctx.save();ctx.translate(state.attack?13:0,0);shadow(ctx);poly(ctx,[[-20,8],[-12,-9],[5,-13],[19,-5],[22,8],[9,14],[-12,14]],frost?'#91d8ed':'#739a8b',frost?'#efffff':'#c9ead0');poly(ctx,[[2,-10],[13,-23],[26,-11],[20,1],[8,0]],frost?'#d7fbff':'#b0cdb0','#effff2');poly(ctx,[[9,-18],[10,-30],[16,-18]],frost?'#e1ffff':'#87ad8e');poly(ctx,[[18,-17],[25,-29],[23,-14]],frost?'#e1ffff':'#87ad8e');eyes(ctx,-12);line(ctx,-16,7,-29,1,frost?'#67b9df':'#527a6d',3);for(const side of[-1,1])line(ctx,side*6,11,side*8,19+(side>0?trot:-trot),frost?'#61a8c9':'#4a6f62',3);if(frost)poly(ctx,[[-1,-11],[3,-25],[7,-11]],'#c7f9ff');if(state.attack){ctx.globalAlpha=.4;line(ctx,18,-6,38,-11,frost?'#d5ffff':'#d2ffbf',3);}ctx.restore();
}

function drawBloomPet(ctx, pet, state) {
  const spirit=pet.visualType==='spiritPet';const sway=Math.sin(state.time*2.5)*3;ctx.save();ctx.rotate(sway*.025);shadow(ctx,spirit);
  if(spirit){poly(ctx,[[-13,-4],[0,-20],[14,-4],[10,13],[0,18],[-10,13]],'#8c72c7','#ead4ff');disc(ctx,0,-2,7,'#d7b2ff');eyes(ctx,-3);for(const side of[-1,1])line(ctx,side*7,10,side*17,23+Math.sin(state.time*4+side)*2,'#d5aaff',2);}
  else{line(ctx,0,4,0,20,'#5ca66d',5);for(let i=0;i<5;i+=1){ctx.save();ctx.rotate(i*TAU/5+state.time*.14);ctx.fillStyle=i%2?'#8ce0b1':'#57bb9f';ctx.beginPath();ctx.ellipse(0,-16,7,13,0,0,TAU);ctx.fill();ctx.restore();}disc(ctx,0,-1,10,'#f1d48c');eyes(ctx,-2);line(ctx,-2,11,-13,18,'#559b68',2);line(ctx,2,11,13,18,'#559b68',2);}
  if(state.attack){ctx.globalAlpha=.55;for(const x of[16,27])disc(ctx,x,-9,3,spirit?'#e3b5ff':'#b9ffd5');}ctx.restore();
}

function drawLizardPet(ctx, pet, state) { ctx.save();ctx.translate(state.attack?12:0,0);shadow(ctx);poly(ctx,[[-24,9],[-37,13],[-20,0],[-7,-9],[10,-10],[21,-2],[18,10],[-5,15]],'#a85045','#ffc06e');poly(ctx,[[7,-8],[19,-20],[31,-7],[23,2],[13,0]],'#d77451','#ffd07d');eyes(ctx,-9);for(const x of[-5,7,17])line(ctx,x,-3,x+3,8,'#ff9c52',1.5);line(ctx,-16,10,-29,18,'#72363d',3);if(state.attack)disc(ctx,37,-5,5,'#ffb05b');ctx.restore(); }
function drawFiendPet(ctx, pet, state) { const flap=Math.sin(state.time*8)*4;ctx.save();ctx.translate(0,-4);shadow(ctx,true);poly(ctx,[[-10,10],[-12,-11],[0,-19],[13,-10],[10,12]],'#cf5262','#ffd07b');poly(ctx,[[-10,-5],[-28,-17-flap],[-20,7]],'#794276','#db95b3');poly(ctx,[[10,-5],[28,-17+flap],[20,7]],'#794276','#db95b3');poly(ctx,[[-8,-14],[-13,-26],[-2,-16]],'#ffc765');poly(ctx,[[8,-14],[13,-26],[2,-16]],'#ffc765');eyes(ctx,-5);line(ctx,8,9,20,15,'#822f50',2.5);if(state.attack)disc(ctx,28,9,5,'#ffb05c');ctx.restore(); }
function drawHawkPet(ctx, pet, state) { const flap=Math.sin(state.time*9)*6;ctx.save();ctx.translate(state.attack?11:0,-11);shadow(ctx,true);poly(ctx,[[-16,0],[-31,-13-flap],[-10,-6],[0,-15],[10,-6],[31,-13+flap],[17,2],[4,10],[-7,10]],'#c46851','#ffd377');disc(ctx,1,-5,7,'#edaa63');eyes(ctx,-6);poly(ctx,[[8,-5],[18,-2],[8,1]],'#ffdf74');if(state.attack)disc(ctx,32,-7,4,'#ffdc72');ctx.restore(); }
function drawGolemPet(ctx, pet, state) { ctx.save();shadow(ctx);poly(ctx,[[-12,12],[-15,-5],[0,-16],[16,-5],[12,13]],'#7099b7','#e1fbff');poly(ctx,[[-9,-15],[0,-25],[9,-15],[6,-6],[-6,-6]],'#d2f6ff','#fff');eyes(ctx,-14, '#244a68');for(const side of[-1,1]){line(ctx,side*11,0,side*23,state.attack?-9:8,'#6190ab',4);disc(ctx,side*25,state.attack?-11:9,4,'#bdf5ff');}disc(ctx,0,1,state.attack?7:4,'#9eeaff');ctx.restore(); }
function drawSentinelPet(ctx, pet, state) { ctx.save();ctx.translate(0,-3);shadow(ctx,true);poly(ctx,[[-12,12],[-15,-6],[0,-17],[15,-6],[12,12],[0,18]],'#62468a','#e3c5ff');poly(ctx,[[-8,-17],[0,-27],[8,-17],[5,-8],[-5,-8]],'#e8e2ff','#a999df');disc(ctx,0,0,state.attack?7:4,'#9eeaff');for(const side of[-1,1])line(ctx,side*11,-2,side*23,4,'#7653a0',3);if(state.attack)line(ctx,18,-2,34,-10,'#d8b9ff',2);ctx.restore(); }

function drawCrownCub(ctx, pet, state) { const stomp=Math.sin(state.time*4)*1.5;ctx.save();ctx.translate(state.attack?15:0,stomp);shadow(ctx);poly(ctx,[[-20,8],[-14,-7],[4,-12],[20,-3],[17,11],[-4,15]],'#9d704a','#f2cf7a');for(const x of[-9,11])line(ctx,x,10,x,21,'#58393a',5);poly(ctx,[[2,-7],[12,-20],[25,-8],[18,2],[7,1]],'#8f6044','#ffdc8d');poly(ctx,[[7,-17],[10,-29],[15,-18],[19,-29],[21,-14]],'#edbe62','#fff0ac');eyes(ctx,-9,'#fff0a1');if(state.attack){ctx.globalAlpha=.5;line(ctx,20,3,43,3,'#ffd77a',3);}ctx.restore(); }
function drawTreeSprite(ctx, pet, state) { const sway=Math.sin(state.time*2)*2;ctx.save();ctx.rotate(sway*.03);shadow(ctx);line(ctx,-5,9,-9,21,'#63442f',5);line(ctx,5,9,9,21,'#63442f',5);poly(ctx,[[-12,10],[-10,-10],[0,-19],[11,-9],[12,11],[0,17]],'#76503a','#c99a5f');for(const p of[[-14,-21],[0,-29],[14,-21]])disc(ctx,p[0],p[1],9,'#6aa95c','#c7ef95');disc(ctx,0,-2,4,'#b2f19a');eyes(ctx,-10,'#ecffcf');if(state.attack){ctx.globalAlpha=.5;for(const x of[16,25])disc(ctx,x,6,3,'#b9ef8b');}ctx.restore(); }
function drawLavaWhelp(ctx, pet, state) { const pulse=1+Math.sin(state.time*5)*.04;ctx.save();ctx.scale(pulse,pulse);shadow(ctx);poly(ctx,[[-13,10],[-33,1],[-21,-12],[-7,-4],[7,-5],[20,6],[7,15],[-9,15]],'#843e3d','#ff9b58');poly(ctx,[[-5,-6],[3,-22],[17,-11],[12,0],[3,1]],'#b95842','#ffc16d');poly(ctx,[[0,-17],[3,-28],[8,-17]],'#f57742','#ffe183');poly(ctx,[[-15,-4],[-33,-22],[-25,5]],'#683142','#ff8d5d');eyes(ctx,-10,'#ffe694');disc(ctx,0,4,state.attack?7:4,'#ffbd60');if(state.attack){ctx.globalAlpha=.5;poly(ctx,[[12,-4],[38,-12],[29,3]],'#ff824b','#ffe394');}ctx.restore(); }
function drawFrostSprite(ctx, pet, state) { const bob=Math.sin(state.time*3)*3;ctx.save();ctx.translate(0,bob-6);shadow(ctx,true);poly(ctx,[[-11,11],[-8,-6],[0,-16],[9,-6],[13,13],[0,20]],'#75abd1','#e1fbff');poly(ctx,[[-8,-15],[0,-28],[8,-15],[5,-5],[-5,-5]],'#d9f8ff','#fff');for(const side of[-1,1])poly(ctx,[[side*8,-3],[side*26,-18],[side*19,10]],'#a8e8ff','#efffff');disc(ctx,0,1,state.attack?7:4,'#aef5ff');eyes(ctx,-13,'#eefeff');if(state.attack){ctx.globalAlpha=.5;poly(ctx,[[11,-8],[35,-16],[24,1]],'#dfffff','#fff');}ctx.restore(); }
function drawAstralDrone(ctx, pet, state) { const bob=Math.sin(state.time*3.5)*3;ctx.save();ctx.translate(0,bob-7);shadow(ctx,true);ctx.save();ctx.rotate(state.time*1.5);ctx.strokeStyle='#d7b4ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,20,0,TAU);ctx.stroke();ctx.restore();poly(ctx,[[-12,7],[-15,-7],[0,-16],[15,-7],[12,8],[0,15]],'#5d4285','#e7c7ff');poly(ctx,[[-8,-16],[0,-25],[8,-16],[5,-8],[-5,-8]],'#e9ebff','#a89ce1');disc(ctx,0,0,state.attack?7:4,'#a7ecff');for(const side of[-1,1])disc(ctx,side*20,3,4,'#694898','#d9bbff');if(state.attack){ctx.globalAlpha=.55;line(ctx,-16,0,-39,-1,'#cbabff',3);}ctx.restore(); }

function drawFallbackPet(ctx, pet, state) { ctx.save();shadow(ctx,true);poly(ctx,[[-12,10],[-17,-8],[0,-19],[17,-8],[12,10],[0,17]],'#6a6992','#def1ff');disc(ctx,0,0,state.attack?7:4,'#9eeaff');eyes(ctx,-7);ctx.restore(); }
const PET_DRAWERS={slimePet:drawSlimeEvolution,iceSlimePet:drawSlimeEvolution,rabbitPet:drawRabbitPet,beetlePet:drawBeetlePet,wolfPet:drawWolfPet,frostWolfPet:drawWolfPet,bloomPet:drawBloomPet,spiritPet:drawBloomPet,lizardPet:drawLizardPet,fiendPet:drawFiendPet,hawkPet:drawHawkPet,golemPet:drawGolemPet,sentinelPet:drawSentinelPet,orbPet:drawAstralDrone,crownCub:drawCrownCub,treeSprite:drawTreeSprite,lavaWhelp:drawLavaWhelp,frostSprite:drawFrostSprite,astralDrone:drawAstralDrone};

export function drawPet(ctx, pet, { time=0, action='idle', actionIn=0, returnIn=0, summonIn=0, skillType=null, skillProgress=0, powerSave=false, silhouette=false } = {}, x=142, y=300) {
  if (!pet) return;
  const skill=action==='skill'; const attacking=action==='attack'||skill; const returning=action==='return'; const celebrating=action==='celebrate';
  const attackProgress=attacking ? Math.max(0, 1-actionIn/.36) : 0;
  const returnProgress=returning ? Math.max(0, returnIn/.26) : 0;
  const travel=attacking ? Math.sin(Math.min(1,attackProgress)*Math.PI)*68 : returning ? returnProgress*68 : 0;
  const summon=Math.min(1,Math.max(.16,1-summonIn/.52)); const cheer=celebrating ? Math.abs(Math.sin(time*10))*7 : 0;
  const state={time,attack:attacking,skill,hurt:action==='hurt',powerSave}; const drawer=PET_DRAWERS[pet.visualType]||drawFallbackPet;
  const bossScale = pet.species?.startsWith('boss') ? .1 : 0;
  ctx.save();ctx.translate(x+travel,y-cheer);ctx.globalAlpha=summon;ctx.scale((.82+bossScale)*summon,(.82+bossScale)*summon);
  if(summonIn>0&&!powerSave){ctx.globalAlpha*=.42;ctx.strokeStyle='#b7e9ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,18,28*summon,0,TAU);ctx.stroke();ctx.globalAlpha=summon;}
  if(skill&&!powerSave){ctx.strokeStyle='#fff1ae';ctx.globalAlpha*=.5;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,30+Math.sin(time*10)*4,0,TAU);ctx.stroke();ctx.globalAlpha=summon;} if(!silhouette)qualityAdornment(ctx,pet,state);drawer(ctx,pet,state);if(!silhouette)drawEvolutionForm(ctx,pet,state);if(silhouette){ctx.globalCompositeOperation='source-atop';ctx.fillStyle='#17223b';ctx.fillRect(-54,-58,108,116);}ctx.restore();
}
