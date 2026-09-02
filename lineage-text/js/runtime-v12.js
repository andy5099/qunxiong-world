import{Combat}from'./combat.js?v=38';
import{normalizeCharacterState,maintainSpeedPotions,buySpeedPotionTargets}from'./core-v12.js?v=38';
import{autoTransform}from'./transformations.js?v=38';
import{derived}from'./player.js?v=38';

const originalStart=Combat.prototype.start;
Combat.prototype.start=function(){normalizeCharacterState(this.s);let p=this.s.player;if(p.settings.autoSupply){let r=buySpeedPotionTargets(p);if(r.cost)this.log(`自動補給綠水／勇水，花費 ${r.cost} 金幣。`,'good')}originalStart.call(this);let used=maintainSpeedPotions(p);used.used.forEach(n=>this.log(`自動使用${n}。`,'good'));p.__derivedSpeed=derived(p).speed;autoTransform(p);delete p.__derivedSpeed};

const originalTick=Combat.prototype.tick;
Combat.prototype.tick=function(dt){let p=this.s.player;normalizeCharacterState(this.s);if(!p.inTown){let used=maintainSpeedPotions(p);used.used.forEach(n=>this.log(`自動使用${n}。`,'good'));if(used.missing.length&&p.settings.autoSupply&&(p.settings.autoSupplyGreen||p.settings.autoSupplyBrave))return this.returnTown(true,used.missing[0]);p.__derivedSpeed=derived(p).speed;let transformed=autoTransform(p);delete p.__derivedSpeed;if(!transformed&&p.debug?.transformTrace?.rejectReason==='變身卷軸不足'&&p.settings.autoSupply&&p.settings.autoSupplyTransform)return this.returnTown(true,'變身卷軸')}return originalTick.call(this,dt)};

Combat.prototype.autoBuff=function(p){let used=maintainSpeedPotions(p);used.used.forEach(n=>this.log(`自動使用${n}。`,'good'))};
