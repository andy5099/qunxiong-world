import assert from 'node:assert/strict';
import {MAPS,makeEnemy} from '../js/maps.js';
import {newPlayer,recalc,addExp,expNeed} from '../js/player.js';
import {rollItem,SLOTS,power,enhanceChance} from '../js/items.js';
import {calculateOffline,claimOffline} from '../js/offline.js';
assert.equal(MAPS.length,12);assert.ok(MAPS.every(m=>m.monsters.length===4));
for(const cls of ['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士']){const p=newPlayer('測試',cls);assert.equal(p.level,1);assert.ok(recalc(p).power>0)}
let p=newPlayer('測試','騎士');assert.ok(addExp(p,expNeed(1)*2)>=1);let item=rollItem(30,0,3);assert.ok(SLOTS.includes(item.slot));assert.ok(power(item)>0);assert.equal(enhanceChance(0),1);assert.ok(makeEnemy(MAPS[0],true).boss);
let state={lastSaveTime:Date.now()-3600_000,player:p};p.map=0;let off=calculateOffline(state,Date.now());assert.ok(off&&off.kills>0);let before=p.totalKills;claimOffline(state,off);assert.ok(p.totalKills>before);assert.equal(state.pendingOffline,null);
console.log('永恆掛機傳說 smoke tests passed');
