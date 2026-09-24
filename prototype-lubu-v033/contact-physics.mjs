export const CONTACT_PRESETS={
  contact:{gravity:535,normalLaunch:650,perfectLaunch:735,flipSide:118,bossY:285,bossRange:28,bossRadius:61,bossRetention:.91,wallRetention:.95,dashSpeed:820,gaugeRate:1},
  combo:{gravity:525,normalLaunch:665,perfectLaunch:755,flipSide:145,bossY:280,bossRange:30,bossRadius:60,bossRetention:.95,wallRetention:.975,dashSpeed:870,gaugeRate:1.05},
  burst:{gravity:530,normalLaunch:660,perfectLaunch:750,flipSide:118,bossY:310,bossRange:16,bossRadius:72,bossRetention:.93,wallRetention:.96,dashSpeed:845,gaugeRate:1.35}
};

function runFlip(config,index){
  let x=180,y=650,vx=(index%2?1:-1)*config.flipSide,vy=-(index%4===0?config.perfectLaunch:config.normalLaunch);
  let entered=false,direct=false,follower=0,dash=false,wall=false,empty=true,peak=y;
  for(let frame=0;frame<720;frame++){
    const t=frame/120,bossX=180+Math.sin(t*1.8+index*.7)*72,bossY=config.bossY+Math.sin(t*1.2)*config.bossRange;
    vy+=config.gravity/120;x+=vx/120;y+=vy/120;peak=Math.min(peak,y);
    if(y>=130&&y<=346)entered=true;
    if(x<22||x>338){x=Math.max(22,Math.min(338,x));vx=-vx*config.wallRetention;wall=true;empty=false}
    const distance=Math.hypot(x-bossX,y-bossY);
    if(!direct&&distance<config.bossRadius){direct=true;empty=false;vy=-Math.sign(vy||1)*Math.max(350,Math.abs(vy)*config.bossRetention);vx+=(x<bossX?-1:1)*120;follower=2}
    if(direct&&!dash&&frame%120===82){const dx=bossX-x,dy=bossY-y,len=Math.max(1,Math.hypot(dx,dy));vx=dx/len*config.dashSpeed;vy=dy/len*config.dashSpeed;dash=true}
    if(dash&&Math.hypot(x-bossX,y-bossY)<config.bossRadius){empty=false;dash='hit'}
    if(y>690)break;
  }
  return{entered,direct,follower,dash:dash==='hit',wall,empty,peak};
}

export function simulateContacts(config,flips=30){
  const runs=Array.from({length:flips},(_,i)=>runFlip(config,i));
  const count=key=>runs.filter(run=>run[key]).length;
  return{flips,zoneEntries:count('entered'),directHits:count('direct'),followerHits:runs.reduce((sum,run)=>sum+run.follower,0),dashSecondHits:count('dash'),wallInteractions:count('wall'),emptySwings:count('empty'),zoneRate:count('entered')/flips,directRate:count('direct')/flips,dashRate:count('dash')/flips,emptyRate:count('empty')/flips,averagePeak:runs.reduce((sum,run)=>sum+run.peak,0)/flips};
}

export function simulateBurst(config,seed=1){
  const hits=10+(seed*7)%7,followers=Math.max(3,Math.round(hits*(.65+(seed%3)*.08))),dash=2+(seed*3)%4;
  const skill=Math.floor((hits+followers)*config.gaugeRate/7),chain=Math.max(0,skill-1),fullChain=Math.floor(skill/3);
  const breaks=Math.max(1,Math.floor((hits+followers+dash)/13)),powerMax=Math.floor((hits+followers)*config.gaugeRate/24),ultimate=fullChain?1:0;
  const damage=Math.min(.72,.11+hits*.012+followers*.009+fullChain*.08+powerMax*.07+breaks*.035);
  return{seconds:20,bossHits:hits,followerHits:followers,dashHits:dash,maxCombo:hits+followers+dash,skills:skill,chains:chain,fullChains:fullChain,breaks,powerMax,ultimate,bossHpRemaining:Math.round((1-damage)*100)};
}
