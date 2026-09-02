import assert from'node:assert/strict';
import{createPlayer}from'../js/player.js';
import{addItem,equip,unequip,countInstanceId,EQUIPMENT_SLOTS}from'../js/inventory.js';
import{ITEMS}from'../js/data.js';

let checks=0,ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.equal(a,b,m)};
const p=createPlayer('裝備交易測試','騎士'),items=ITEMS.filter(x=>['武器','盔甲','戒指1','頭盔','鞋子'].includes(x.slot)&&(!x.classes||x.classes.includes('騎士'))),bySlot=slot=>items.find(x=>x.slot===slot);
ok(items.every(x=>EQUIPMENT_SLOTS.has(x.slot)),'裝備 slot key 必須合法');

let weapon=bySlot('武器'),id1=addItem(p,weapon),total=p.bag.length;ok(equip(p,id1),'CASE A 裝備失敗');eq(countInstanceId(p,id1),1,'CASE A instanceId 必須唯一');eq(p.bag.length,total-1,'CASE A 背包應移除新武器');eq(p.equipment.武器.instanceId,id1,'CASE A 武器欄應持有新武器');
let id2=addItem(p,{...weapon,name:weapon.name+' B'});ok(equip(p,id2),'CASE B 交換失敗');eq(p.equipment.武器.instanceId,id2,'CASE B 新武器未進欄位');eq(countInstanceId(p,id1),1,'CASE B 舊武器遺失');eq(countInstanceId(p,id2),1,'CASE B 新武器遺失');ok(p.bag.some(x=>x.instanceId===id1),'CASE B 舊武器未回背包');

let ids=[id1,id2];for(const slot of['盔甲','戒指1','頭盔','鞋子']){let item=bySlot(slot);if(!item)continue;let id=addItem(p,item);ids.push(id);let before=p.bag.length+Object.keys(p.equipment).length;ok(equip(p,id),`CASE C ${slot} 裝備失敗`);eq(p.bag.length+Object.keys(p.equipment).length,before,`CASE C ${slot} 總數改變`);eq(countInstanceId(p,id),1,`CASE C ${slot} instanceId 不唯一`)}
for(let i=0;i<20;i++){ok(unequip(p,'武器'),'CASE D 卸下失敗');eq(countInstanceId(p,id2),1,'CASE D 卸下後遺失');ok(equip(p,id2),'CASE D 裝備失敗');eq(countInstanceId(p,id2),1,'CASE D 裝備後遺失')}
let serialized=JSON.parse(JSON.stringify(p));for(const id of ids)eq(countInstanceId(serialized,id),1,'序列化後 instanceId 必須唯一');
let roster={activeCharacterId:'A',characters:[{id:'A',state:{player:p}},{id:'B',state:{player:createPlayer('角色B','法師')}}]};roster.activeCharacterId='B';roster.activeCharacterId='A';for(const id of ids)eq(countInstanceId(roster.characters[0].state.player,id),1,'CASE E 切換角色後遺失');
let reload=JSON.parse(JSON.stringify(roster));for(const id of ids)eq(countInstanceId(reload.characters[0].state.player,id),1,'CASE F reload 後遺失');
console.log(JSON.stringify({suite:'V15 equip transaction',checks,caseA:true,caseB:true,caseC:true,caseD:true,caseE:true,caseF:true}));
