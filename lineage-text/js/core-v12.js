import{addItem,ensureItemInstances}from'./inventory.js?v=26';
import{gainExp}from'./player.js?v=26';
import{petWin}from'./companions.js?v=26';
import{buy}from'./shop.js?v=26';
import{CONSUMABLES}from'./data.js?v=26';

export function normalizeCharacterState(state){
 const p=state?.player;if(!p)return state;
 p.settings??={};p.settings.target??={};p.activeSkillSettings??={attack:[],heal:null,healThreshold:45};p.activeSkillSettings.attack??=[];
 p.activeSkillSettings.selectedActiveSkill??=p.selectedActiveSkill??p.activeSkillSettings.attack[0]??null;
 p.settings.autoGreen??=p.settings.autoUseGreenPotion??true;p.settings.autoBrave??=p.settings.autoUseBraveryPotion??true;
 p.settings.autoSupplyGreen??=p.settings.autoBuyGreenPotion??true;p.settings.autoSupplyBrave??=p.settings.autoBuyBraveryPotion??true;
 p.settings.autoUseGreenPotion=p.settings.autoGreen;p.settings.autoUseBraveryPotion=p.settings.autoBrave;
 p.settings.autoBuyGreenPotion=p.settings.autoSupplyGreen;p.settings.autoBuyBraveryPotion=p.settings.autoSupplyBrave;
 p.settings.target.綠色藥水??=50;p.settings.target.勇敢藥水??=30;p.buffs??={greenUntil:0,braveUntil:0};
 ensureItemInstances(p);return state;
}

export function setPotionSetting(p,key,value){
 const pairs={autoGreen:'autoUseGreenPotion',autoBrave:'autoUseBraveryPotion',autoSupplyGreen:'autoBuyGreenPotion',autoSupplyBrave:'autoBuyBraveryPotion'};
 p.settings[key]=value;if(pairs[key])p.settings[pairs[key]]=value;
}

export function maintainSpeedPotions(p,now=Date.now()){
 const result={used:[],missing:[]};
 for(const [name,useKey,untilKey] of [['綠色藥水','autoGreen','greenUntil'],['勇敢藥水','autoBrave','braveUntil']]){
  if(!p.settings[useKey]||p.buffs[untilKey]>now)continue;
  if((p.consumables[name]||0)>0){p.consumables[name]--;p.buffs[untilKey]=now+(CONSUMABLES[name].duration||300)*1000;result.used.push(name)}else result.missing.push(name);
 }
 return result;
}

export function buySpeedPotionTargets(p){
 const before=p.gold,bought={};
 for(const [name,key] of [['綠色藥水','autoSupplyGreen'],['勇敢藥水','autoSupplyBrave']])if(p.settings[key]){
  const need=Math.max(0,(p.settings.target[name]||0)-(p.consumables[name]||0));bought[name]=need?(buy(p,name,need)||0):0;
 }
 return{bought,cost:before-p.gold};
}

export function applyOfflineRewards(state,reward){
 const p=state.player,ids=[],before=p.bag.length;if(!reward)return{ok:false,before,after:before,ids};
 gainExp(p,reward.exp||0);petWin(p,reward.petExp||0);p.gold=Math.max(0,p.gold+(reward.net||0));
 p.statsLog.kills+=reward.kills||0;p.statsLog.bosses+=reward.bosses||0;p.statsLog.deaths+=reward.deaths||0;p.statsLog.goldEarned+=reward.gross||0;p.statsLog.supplyCost+=reward.cost||0;p.killsOnMap+=reward.kills||0;
 for(const[n,v]of Object.entries(reward.purchased||{}))p.consumables[n]=(p.consumables[n]||0)+v;
 for(const[n,v]of Object.entries(reward.consumed||{}))p.consumables[n]=Math.max(0,(p.consumables[n]||0)-v);
 for(const[n,v]of Object.entries(reward.materials||{}))p.bossMaterials[n]=(p.bossMaterials[n]||0)+v;
 for(const[n,v]of Object.entries(reward.lootConsumables||{}))p.consumables[n]=(p.consumables[n]||0)+v;
 for(const item of reward.gear||[])ids.push(addItem(p,item));
 for(const sk of reward.books||[]){let n=sk[0],book=p.bag.find(x=>x.kind==='book'&&x.skill===n);if(book)book.count++;else p.bag.push({uid:`book-${n}`,instanceId:`book-${n}`,kind:'book',name:`${p.cls==='法師'?'魔法書':'技能書'}：${n}`,skill:n,cls:p.cls,level:sk[1],tier:'掉落',count:1,price:2500+sk[1]*500});p.skillBooks[n]=(p.skillBooks[n]||0)+1}
 return{ok:true,before,after:p.bag.length,ids};
}
