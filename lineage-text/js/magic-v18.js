import{DOLLS}from'./data.js?v=38';
export function manaRegenPerSecond(p,{blue=false}={}){
 const wis=p.stats?.wis||0,equipment=Object.values(p.equipment||{}).filter(Boolean).reduce((n,i)=>n+(i.mpRegen||i.mpr||0),0),doll=DOLLS[p.doll]?.effect==='mpRegen'?(DOLLS[p.doll].value||0):0;
 const base=.18+Math.max(0,wis-8)*.035,blueBonus=blue?.45:0;
 return base+(equipment+doll)/8+blueBonus;
}
export function enabledAttackSkills(p,skills){let enabled=p.activeSkillSettings?.attack||[];return skills.filter(s=>s[2]==='active'&&p.learnedSkills?.includes(s[0])&&enabled.includes(s[0]));}
export function soulConversionReady(p,d,now=Date.now()){let a=p.activeSkillSettings||{},enabled=a.resource?.['魂體轉換']??true,mpBelow=a.soulMpBelow??30,hpAbove=a.soulHpAbove??70,ready=p.cls==='妖精'&&enabled&&p.learnedSkills?.includes('魂體轉換')&&now>=(p.skillCooldowns?.['魂體轉換']||0)&&p.mp/d.maxMp*100<mpBelow&&p.hp/d.maxHp*100>hpAbove;if(ready){p.skillCooldowns??={};p.skillCooldowns['魂體轉換']=now+3000}return ready;}
export function useSoulConversion(p,d){let hpCost=Math.max(10,Math.floor(d.maxHp*.08)),mpGain=Math.max(8,Math.floor(d.maxMp*.12));if(p.hp<=hpCost)return null;p.hp-=hpCost;p.mp=Math.min(d.maxMp,p.mp+mpGain);return{hpCost,mpGain};}
export function soulManaPerSecond(p,d){if(p.cls!=='妖精'||!p.learnedSkills?.includes('魂體轉換')||p.activeSkillSettings?.resource?.['魂體轉換']===false)return 0;return Math.max(8,Math.floor(d.maxMp*.12))/3;}
