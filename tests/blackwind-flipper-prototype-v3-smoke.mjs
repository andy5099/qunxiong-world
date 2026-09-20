import assert from'node:assert/strict';
import fs from'node:fs';
import{ARENA,createPrototypeState,getFormation,getResults,stepPrototype,tapPrototype}from'../prototype-blackwind-v3/physics.js';
let passed=0;const check=(v,m)=>{assert.ok(v,m);passed++;};

const idle=createPrototypeState();for(let i=0;i<1900;i++)stepPrototype(idle,1/60);
check(idle.complete&&idle.stats.hits===0,'no input cannot auto-play the core loop');

const rounds=[];
for(let run=0;run<10;run++){
  const state=createPrototypeState();let nextDashAt=0;
  for(let frame=0;frame<2200&&!state.complete;frame++){
    const time=frame/60,inZone=state.core.y>=ARENA.floor-38;
    if(inZone&&frame%2===run%2)tapPrototype(state);
    else if(!inZone&&state.dashCooldown<=0&&time>=nextDashAt){tapPrototype(state);nextDashAt=time+.42+(run%4)*.09;}
    stepPrototype(state,1/60);
    const formation=getFormation(state);check(formation.length===3,'party core always produces three visible members');
  }
  const metrics=getResults(state);check(state.complete&&state.timeLeft===0,'round ends at 30 seconds');check(metrics.flips>0,'tap produces FLIP');check(metrics.dashes>0,'air tap produces DASH');check(metrics.hits>0&&metrics.highestCombo>0,'player actions create combo');check(metrics.powerFlips>0,'combo produces POWER FLIP');check(metrics.skills>0,'Guan Yu ultimate triggers');rounds.push(metrics);
}

const timing=createPrototypeState();timing.core.y=ARENA.floor-timing.core.r;timing.core.bottomTime=.12;const perfect=tapPrototype(timing);check(perfect.type==='flip'&&perfect.perfect&&timing.stats.perfects===1,'wide launch window creates PERFECT FLIP');timing.core.y=250;timing.dashCooldown=0;timing.counterWindow=.2;const counter=tapPrototype(timing);check(counter.type==='counter-dash'&&timing.stats.counterDashes===1,'post-hit window creates COUNTER DASH');const blocked=tapPrototype(timing);check(blocked.type==='cooldown'&&timing.stats.dashes===1,'dash cooldown blocks tap spam without penalty');

const power=createPrototypeState();power.power=100;power.powerReady=true;power.core.y=ARENA.floor-power.core.r;power.core.bottomTime=.2;const powerTap=tapPrototype(power);check(powerTap.type==='power-flip'&&power.core.powerAttack,'POWER READY changes the next launch state');

const html=fs.readFileSync(new URL('../prototype-blackwind-v3/index.html',import.meta.url),'utf8'),game=fs.readFileSync(new URL('../prototype-blackwind-v3/game.js',import.meta.url),'utf8');
check(html.includes('touch-action:none')===false&&html.includes('game.js?v=v3-30s-2'),'preview loads a versioned standalone module');
check(game.includes("qunxiong-world-blackwind-prototype-v3"),'preview uses an isolated localStorage key');
check(!html.includes('serviceWorker')&&!game.includes('serviceWorker'),'preview registers no service worker');
check(game.includes('hudIn=.1')&&game.includes('dataset.fps'),'HUD is throttled while Canvas tracks observable FPS');
const summary=rounds.map((r,index)=>({run:index+1,combo:r.highestCombo,dashes:r.dashes,dashHitRate:r.dashes?Number((r.dashHits/r.dashes*100).toFixed(1)):0,power:r.powerFlips,skills:r.skills}));
console.log(`Blackwind Flipper Prototype V3: ${passed} assertions passed.`);console.table(summary);
