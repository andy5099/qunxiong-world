import{Combat}from'./combat.js?v=61';
import{dragonUtilityDrops}from'./dragons-v26.js?v=61';
import{weaponMagicProc}from'./equipment-v29.js?v=61';

const previousWin=Combat.prototype.win;
Combat.prototype.win=function(){if(this.enemy?.dragon){let drops=dragonUtilityDrops(this.s.player);for(const name of drops)this.log(`四龍稀有掉落：【${name}】×1。`,'boss')}return previousWin.call(this)};

const previousTick=Combat.prototype.tick;
Combat.prototype.tick=function(dt){let enemy=this.enemy,before=enemy?.hp??null,logs=this.s.logs.length;previousTick.call(this,dt);let fresh=this.s.logs.slice(0,Math.max(0,this.s.logs.length-logs));if(enemy&&this.enemy===enemy&&before!==null&&enemy.hp<before&&fresh.some(x=>/^你造成 \d+ 傷害。$/.test(x.t))){let proc=weaponMagicProc(this.s.player,enemy);if(proc){enemy.hp-=proc.damage;this.log(`【${proc.name}】追加 ${proc.damage} 魔法傷害。`,'rare');if(enemy.hp<=0)this.win()}}};
