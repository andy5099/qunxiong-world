export const MAX_LEVEL=100;
export const STAR_COSTS=[3,5,8,12,18];
export const QUALITY_SOULS={normal:1,rare:2,epic:4,legendary:8};
export const CHARACTER_CONFIG={
 guanyu:{name:'關羽',basePower:620,effects:['弱點 Hit：Skill Gauge +25%','青龍偃月追加第二道刀光','Power Flip 弱點追斬 +25%','青龍滅陣 Final 爆發 +35%','武聖・極：BREAK 弱點追擊']},
 zhangfei:{name:'張飛',basePower:650,effects:['高速撞擊 BREAK +25%','震軍破陣追加第二震波','Power Flip 追加破陣震波','萬軍俱裂第三震波 +40%','萬人敵・極：Perfect Counter 反撞']},
 liubei:{name:'劉備',basePower:580,effects:['仁德治療 +30%','軍陣持續時間 +35%','Power Flip 全隊恢復','天下歸心追加護盾','昭烈・極：FULL CHAIN Gauge 加速']},
 lubu:{name:'呂布',basePower:760,effects:['飛將戰意衰減減緩','無雙亂舞追加戟光','飛將破軍追擊強化','鬼神・天下無雙強化','鬼神無雙・極：3.6秒鬼神狀態']}
};
const fresh=(id,captured=true)=>({id,captured,level:1,exp:0,stars:0,souls:0,breakthroughEffects:[]});
export function normalizeProgression(save){
 save.gold=Number.isFinite(save.gold)?Math.max(0,Math.floor(save.gold)):12000;
 save.characters??={};
 for(const id of Object.keys(CHARACTER_CONFIG)){const old=save.characters[id]||{},legacy=id==='lubu'?save.lubu||{}:{};save.characters[id]={...fresh(id,id!=='lubu'||!!legacy.captured),...old,captured:id==='lubu'?!!(old.captured??legacy.captured):true,level:Math.min(MAX_LEVEL,Math.max(1,Math.floor(old.level||1))),exp:Math.max(0,Math.floor(old.exp||0)),stars:Math.min(5,Math.max(0,Math.floor(old.stars??legacy.breakthrough??0))),souls:Math.max(0,Math.floor(old.souls??legacy.souls??0))};save.characters[id].breakthroughEffects=CHARACTER_CONFIG[id].effects.slice(0,save.characters[id].stars)}
 const lu=save.characters.lubu;save.lubu={...(save.lubu||{}),captured:lu.captured,souls:lu.souls,breakthrough:lu.stars};return save
}
export const expCost=level=>Math.round(80+level*level*7.5);
export const goldCost=level=>Math.round(120+level*level*18);
export function previewEnhance(save,id,all=false){const c=save.characters[id];let level=c.level,exp=c.exp,gold=save.gold,cost=0,usedExp=0;while(level<MAX_LEVEL){const ec=expCost(level),gc=goldCost(level);if(exp<ec||gold<gc||(!all&&level>c.level))break;exp-=ec;gold-=gc;usedExp+=ec;cost+=gc;level++}return{from:c.level,to:level,gold:cost,exp:usedExp}}
export function enhance(save,id,all=false){const p=previewEnhance(save,id,all);const c=save.characters[id];c.level=p.to;c.exp-=p.exp;save.gold-=p.gold;return p}
export function canBreakthrough(save,id){const c=save.characters[id];return c.stars<5&&c.souls>=STAR_COSTS[c.stars]}
export function breakthrough(save,id){if(!canBreakthrough(save,id))return null;const c=save.characters[id],from=c.stars;c.souls-=STAR_COSTS[from];c.stars++;c.breakthroughEffects=CHARACTER_CONFIG[id].effects.slice(0,c.stars);if(id==='lubu'){save.lubu.souls=c.souls;save.lubu.breakthrough=c.stars}return{from,to:c.stars,effect:CHARACTER_CONFIG[id].effects[from]}}
export function characterPower(save,id){const c=save.characters[id],cfg=CHARACTER_CONFIG[id];return Math.round(cfg.basePower*(1+(c.level-1)*.055)*(1+c.stars*.12))}
export function partyPower(save,ids=['guanyu','zhangfei','liubei']){return ids.reduce((sum,id)=>sum+characterPower(save,id),0)}
export function recommendedPower(difficulty){return Math.round(1750*Math.pow(1.135,Math.max(0,difficulty-1)))}
export function combatBonus(save,id){const c=save.characters[id];return{level:c.level,stars:c.stars,damage:1+(c.level-1)*.012+c.stars*.08,breakPower:1+(c.level-1)*.004+(id==='zhangfei'?c.stars*.08:c.stars*.035),skill:1+(c.level-1)*.006+c.stars*.1,gauge:id==='guanyu'?1+c.stars*.05:1,fullChainGauge:id==='liubei'&&c.stars>=5?1.35:1}}
