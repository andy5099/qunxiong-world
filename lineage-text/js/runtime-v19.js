import{Combat}from'./combat.js?v=38';
import{supply}from'./shop.js?v=48';
import{mapFor}from'./hunting.js?v=38';
import{expReward,goldReward}from'./balance-config.js';
const previousWin=Combat.prototype.win;
Combat.prototype.win=function(){let defeated=this.enemy;if(!defeated)return previousWin.call(this);let baseExp=defeated.exp,baseGold=defeated.gold,isBoss=!!(defeated.boss||defeated.mini);defeated.exp=expReward(baseExp,{boss:isBoss});defeated.gold=goldReward(baseGold,{boss:isBoss})/10;let result=previousWin.call(this);defeated.exp=baseExp;defeated.gold=baseGold;return result};
Combat.prototype.returnTown=function(auto=false){let p=this.s.player;p.inTown=true;p.statsLog.returns++;if(auto){let result=supply(p,mapFor(p.map));p.inTown=false;this.spawn();this.log(result.missing.length?`部分補給完成（${result.missing.join('、')}未補滿），繼續掛機。`:'補給完成，繼續掛機。','good')}this.onChange?.()};
