import assert from'node:assert/strict';
import{createPlayer}from'../js/player.js';
import{normalizeCharacterState}from'../js/core-v12.js';

let checks=0,eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},ids=p=>Object.values(p.equipment||{}).filter(Boolean).map(x=>x.instanceId).sort();
const item=(name,slot,id)=>({name,slot,instanceId:id,uid:id,enhance:0}),state=name=>({player:createPlayer(name,'騎士'),logs:[],lastOnlineTimestamp:Date.now()}),roster={activeCharacterId:null,characters:[{id:'A',state:state('A')},{id:'B',state:state('B')},{id:'C',state:state('C')}]};
roster.characters[0].state.player.equipment={武器:item('A武器','武器','a-w'),盔甲:item('A盔甲','盔甲','a-a'),戒指1:item('A戒指','戒指1','a-r')};roster.characters[1].state.player.equipment={武器:item('B武器','武器','b-w')};
let storage=JSON.stringify(roster),enter=id=>{let loaded=JSON.parse(storage),entry=loaded.characters.find(x=>x.id===id);entry.state=normalizeCharacterState(entry.state);loaded.activeCharacterId=id;return{loaded,entry}},leave=session=>{storage=JSON.stringify(session.loaded);session.loaded.activeCharacterId=null;storage=JSON.stringify(session.loaded)},expectedA=['a-a','a-r','a-w'],expectedB=['b-w'];
let s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE A enter A');leave(s);s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE A return A');
s=enter('A');leave(s);s=enter('B');eq(ids(s.entry.state.player),expectedB,'CASE B B equipment');leave(s);s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE B A equipment');
for(const id of['A','B','C','A']){s=enter(id);leave(s)}s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE C A-B-C-A');
for(let i=0;i<10;i++){s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE D A before B');leave(s);s=enter('B');eq(ids(s.entry.state.player),expectedB,'CASE D B');leave(s)}s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE D final A');leave(s);
storage=JSON.stringify(JSON.parse(storage));s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE E reload');
for(let i=0;i<5;i++){s=enter('B');eq(ids(s.entry.state.player),expectedB,'CASE F B isolation');leave(s);s=enter('A');eq(ids(s.entry.state.player),expectedA,'CASE F A isolation');leave(s)}
console.log(JSON.stringify({suite:'V16 character switch equipment',checks,caseA:true,caseB:true,caseC:true,caseD:true,caseE:true,caseF:true}));
