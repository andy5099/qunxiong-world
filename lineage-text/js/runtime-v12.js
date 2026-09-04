import{Combat}from'./combat.js?v=38';
import{normalizeCharacterState,maintainSpeedPotions}from'./core-v12.js?v=38';
import{autoTransform}from'./transformations.js?v=38';
import{derived}from'./player.js?v=38';

const originalStart=Combat.prototype.start;
Combat.prototype.start=function(){normalizeCharacterState(this.s);let p=this.s.player;originalStart.call(this);let used=maintainSpeedPotions(p);used.used.forEach(n=>this.log(`自動使用${n}。`,'good'));p.__derivedSpeed=derived(p).speed;autoTransform(p);delete p.__derivedSpeed};

const originalTick=Combat.prototype.tick;
Combat.prototype.tick=function(dt){let p=this.s.player;normalizeCharacterState(this.s);if(!p.inTown){let used=maintainSpeedPotions(p);used.used.forEach(n=>this.log(`自動使用${n}。`,'good'));p.__derivedSpeed=derived(p).speed;autoTransform(p);delete p.__derivedSpeed}return originalTick.call(this,dt)};

Combat.prototype.autoBuff=function(p){let used=maintainSpeedPotions(p);used.used.forEach(n=>this.log(`自動使用${n}。`,'good'))};
