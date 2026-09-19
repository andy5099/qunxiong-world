import{addItem,ensureItemInstances}from'./inventory.js?v=38';
import{createPlayer,gainExp}from'./player.js?v=38';
import{petWin}from'./companions.js?v=38';
import{buy}from'./shop.js?v=38';
import{CLASSES,CONSUMABLES}from'./data.js?v=53';
import{PET_TYPES}from'./systems.js?v=60';
import{ALL_MAPS}from'./hunting.js?v=62';

const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const array=value=>Array.isArray(value)?value:[];
const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const mergeMissing=(defaults,saved)=>{let out={...defaults,...object(saved)};for(const[k,v]of Object.entries(defaults))if(v&&typeof v==='object'&&!Array.isArray(v))out[k]={...v,...object(saved?.[k])};return out};
const validClass=cls=>Object.prototype.hasOwnProperty.call(CLASSES,cls)?cls:'騎士';

export function prepareLegacyState(input,warnings=[]){
 let state=object(input),rawPlayer=object(state.player),cls=validClass(rawPlayer.cls),base=createPlayer(String(rawPlayer.name||'無名角色').slice(0,12),cls),p=mergeMissing(base,{...rawPlayer,cls});
 p.stats=mergeMissing(base.stats,p.stats);p.equipment=object(p.equipment);p.bag=array(p.bag).filter(x=>x&&typeof x==='object');p.warehouse=array(p.warehouse).filter(x=>x&&typeof x==='object');
 p.consumables=mergeMissing(base.consumables,p.consumables);p.settings=mergeMissing(base.settings,p.settings);p.settings.target=mergeMissing(base.settings.target,p.settings.target);p.settings.thresholds=mergeMissing(base.settings.thresholds,p.settings.thresholds);
 p.bossMaterials=object(p.bossMaterials);p.worldMaterials=object(p.worldMaterials);p.petMaterials=object(p.petMaterials);p.skills=object(p.skills);p.skillBooks=object(p.skillBooks);p.skillCooldowns=object(p.skillCooldowns);p.skillPity=object(p.skillPity);
 p.learnedSkills=array(p.learnedSkills).filter(x=>typeof x==='string');p.activePets=array(p.activePets).filter(x=>typeof x==='string');p.summons=array(p.summons).filter(x=>x&&typeof x==='object');p.transforms=array(p.transforms);p.dolls=array(p.dolls);
 p.pets=array(p.pets).filter(x=>x&&typeof x==='object').map((pet,i)=>{let type=PET_TYPES.some(x=>x.id===pet.type)?pet.type:'dog',basePet=PET_TYPES.find(x=>x.id===type);return{...pet,uid:String(pet.uid||pet.id||`legacy-pet-${i}`),type,name:pet.name||basePet.name,level:Math.max(1,Math.floor(number(pet.level,1))),exp:Math.max(0,number(pet.exp)),hp:Math.max(0,number(pet.hp,basePet.hp)),alive:pet.alive!==false,evolution:Math.max(0,Math.min(2,Math.floor(number(pet.evolution)))),evolutionMultiplier:Math.max(1,number(pet.evolutionMultiplier,1)),attack:number(pet.attack,basePet.atk),ac:number(pet.ac,basePet.ac),hit:number(pet.hit,basePet.hit),speed:number(pet.speed,basePet.speed)}});
 let petIds=new Set(p.pets.map(x=>x.uid));p.activePets=p.activePets.filter(id=>petIds.has(id));p.statsLog=mergeMissing(base.statsLog,p.statsLog);p.statsLog.potions=object(p.statsLog.potions);
 p.buffs=mergeMissing({greenUntil:0,braveUntil:0,blueUntil:0},p.buffs);p.activeSkillSettings=mergeMissing({attack:[],heal:null,healThreshold:45,resource:{}},p.activeSkillSettings);p.activeSkillSettings.attack=array(p.activeSkillSettings.attack);p.activeSkillSettings.resource=object(p.activeSkillSettings.resource);
 p.transformationSettings=mergeMissing({selected:p.transform||0,autoBest:true},p.transformationSettings);p.transformState=mergeMissing({id:null,until:0},p.transformState);p.rebirthCount=Math.max(0,Math.floor(number(p.rebirthCount)));
 if(!ALL_MAPS.some(x=>x.id===Number(p.map))){warnings.push(`invalid map ${String(p.map)} -> 0`);p.map=0}else p.map=Number(p.map);
 for(const[slot,item]of Object.entries(p.equipment))if(!item||typeof item!=='object'){delete p.equipment[slot];warnings.push(`invalid equipment slot ${slot} removed`)}
 return{...state,saveVersion:10,logs:array(state.logs).filter(x=>x&&typeof x==='object'),player:p,pendingOffline:state.pendingOffline&&typeof state.pendingOffline==='object'?state.pendingOffline:null,lastOnlineTimestamp:number(state.lastOnlineTimestamp,Date.now())};
}

export function normalizeCharacterState(state,warnings=[]){
 state=prepareLegacyState(state,warnings);const p=state.player;p.rebirthCount=Math.max(0,Math.floor(Number(p.rebirthCount)||0));
 p.settings??={};p.settings.target??={};p.activeSkillSettings??={attack:[],heal:null,healThreshold:45};p.activeSkillSettings.attack??=[];
 for(const key of['魔力藥水','manaPotion','magicPotion'])delete p.consumables?.[key];for(const key of['autoManaPotion','autoBuyMana','autoUseManaPotion'])delete p.settings[key];for(const key of['魔力藥水','manaPotion','magicPotion'])delete p.settings.target[key];
 p.activeSkillSettings.selectedActiveSkill??=p.selectedActiveSkill??p.activeSkillSettings.attack[0]??null;
 p.activeSkillSettings.resource??={};p.activeSkillSettings.soulMpBelow??=30;p.activeSkillSettings.soulHpAbove??=70;
 p.buffs??={greenUntil:0,braveUntil:0,blueUntil:0};p.buffs.blueUntil??=0;
 p.settings.autoGreen??=p.settings.autoUseGreenPotion??true;p.settings.autoBrave??=p.settings.autoUseBraveryPotion??true;
 p.settings.autoSupplyGreen??=p.settings.autoBuyGreenPotion??true;p.settings.autoSupplyBrave??=p.settings.autoBuyBraveryPotion??true;
 p.settings.autoUseGreenPotion=p.settings.autoGreen;p.settings.autoUseBraveryPotion=p.settings.autoBrave;
 p.settings.autoBuyGreenPotion=p.settings.autoSupplyGreen;p.settings.autoBuyBraveryPotion=p.settings.autoSupplyBrave;
 p.settings.target.綠色藥水??=50;p.settings.target.勇敢藥水??=30;
 p.petMaterials??={'寵物進化石':0,'高級寵物進化石':0};for(const item of[...p.bag,...Object.values(p.equipment||{}).filter(Boolean)]){item.statBonuses??={};for(const k of['str','dex','con','int','wis','cha'])if(item[k]&&!item.statBonuses[k])item.statBonuses[k]=item[k]}
 p.consumables['防爆武器強化卷軸']??=0;p.consumables['防爆防具強化卷軸']??=0;
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
 for(const[n,v]of Object.entries(reward.petEvolutionMaterials||{}))p.petMaterials[n]=(p.petMaterials[n]||0)+v;
 for(const item of reward.gear||[])ids.push(addItem(p,item));
 for(const sk of reward.books||[]){let n=sk[0],book=p.bag.find(x=>x.kind==='book'&&x.skill===n);if(book)book.count++;else p.bag.push({uid:`book-${n}`,instanceId:`book-${n}`,kind:'book',name:`${p.cls==='法師'?'魔法書':'技能書'}：${n}`,skill:n,cls:p.cls,level:sk[1],tier:'掉落',count:1,price:2500+sk[1]*500});p.skillBooks[n]=(p.skillBooks[n]||0)+1}
 return{ok:true,before,after:p.bag.length,ids};
}
