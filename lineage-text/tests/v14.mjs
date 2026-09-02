import assert from'node:assert/strict';
import{createPlayer,derived}from'../js/player.js';
import{migrate}from'../js/migration.js';
import{normalizeCharacterState,applyOfflineRewards}from'../js/core-v12.js';
import{skillsFor,skillSourceDetails}from'../js/skills.js';
import{calculateOffline}from'../js/offline.js';
import{SUMMON_TYPES}from'../js/systems.js';
import{CLASSIC_STAT_GEAR,CHARM_SET}from'../js/content-v13.js';
import{addItem,equip}from'../js/inventory.js';
import{summonStatus,summon}from'../js/companions.js';

let checks=0,ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.equal(a,b,m)};
const make=(cls,name=cls)=>normalizeCharacterState(migrate({saveVersion:10,lastOnlineTimestamp:Date.now(),logs:[],pendingOffline:null,player:createPlayer(name,cls)}));
for(const cls of['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士'])for(const sk of skillsFor(make(cls).player)){let sources=skillSourceDetails(sk);ok(sources.length>0,`${cls} ${sk[0]}沒有正式來源`);ok(sources.some(x=>x.mapId!==undefined&&(x.monster||x.boss)),`${cls} ${sk[0]}來源不可用`)}
let elfSkills=skillsFor(make('妖精').player);for(const lv of[8,16,24,32,40,48])ok(elfSkills.some(s=>s[1]===lv&&!s[7]),`妖精一般魔法缺 Lv${lv}`);ok(elfSkills.some(s=>s[0]==='三重矢'));for(const e of['火','水','風','地'])ok(elfSkills.some(s=>s[7]===e),`妖精缺${e}元素技能`);

const seeded=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
let offline={};for(const cls of['妖精','法師']){offline[cls]={};for(const hours of[1,4,8,17]){let s=make(cls);let p=s.player;p.level=30;p.map=7;p.inTown=false;p.gold=1e9;for(const k of Object.keys(p.consumables))p.consumables[k]=1e6;p.settings.autoTransform=false;s.lastOnlineTimestamp=Date.now()-hours*3600000;let r=calculateOffline(s,Date.now(),seeded(hours+(cls==='妖精'?10:20)));ok(r.skillBookTrace.eligibleKills>0,`${cls} ${hours}h eligible=0`);if(hours===17)ok(r.skillBookTrace.books.length>0,`${cls} 17h 0本`);offline[cls][hours]={kills:r.kills,eligible:r.skillBookTrace.eligibleKills,rolls:r.skillBookTrace.rolls,success:r.skillBookTrace.success,books:[...new Set(r.skillBookTrace.books)]};applyOfflineRewards(s,{...r,gear:r.gear.slice(0,3)});ok(r.books.every(sk=>p.bag.some(x=>x.kind==='book'&&x.skill===sk[0])),`${cls} 離線書未持久狀態`)}}

let mage=make('法師','CHA驗收').player;mage.level=72;mage.learnedSkills=['召喚術','高階召喚術'];for(const item of CLASSIC_STAT_GEAR.filter(x=>CHARM_SET.pieceIds.includes(x.id)||['cha-amulet','summon-ring'].includes(x.id))){addItem(mage,item);ok(equip(mage,mage.bag.at(-1).uid),`無法裝備 ${item.name}`)}eq(derived(mage).stats.cha,28,'終局 CHA 應可達 28');for(const rank of['普通','中階','高階','頂階']){let unit=SUMMON_TYPES.filter(x=>x.rank===rank).at(-1),status=summonStatus(mage,unit.id);ok(status.ok,`${unit.name} 不可達：${status.reasons}`);ok(summon(mage,unit.id),`${unit.name} 召喚失敗`)}ok(SUMMON_TYPES.every(x=>summonStatus(mage,x.id).currentCha>=x.requiredCha),'存在不可達 CHA 召喚');ok(!SUMMON_TYPES.some(x=>/安塔瑞斯|法利昂|林德拜爾|巴拉卡斯/.test(x.name)),'不應有四大龍召喚');

console.log(JSON.stringify({suite:'V14 sixth-round',checks,offline,finalCha:derived(mage).stats.cha,summons:SUMMON_TYPES.map(x=>({name:x.name,rank:x.rank,level:x.level,cha:x.requiredCha,ring:!!x.ring}))}));
