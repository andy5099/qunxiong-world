import{calculateOffline as previousCalculateOffline,claimOffline}from'./offline.js?v=45';
import{expReward,goldReward}from'./balance-config.js';
export function calculateOffline(state,now=Date.now(),rng=Math.random){let report=previousCalculateOffline(state,now,rng);if(!report)return report;report.exp=expReward(report.exp,{offline:true});report.gross=goldReward(report.gross/10,{offline:true});report.net=report.gross-report.cost;delete report.consumed?.['魔力藥水'];delete report.purchased?.['魔力藥水'];return report}
export{claimOffline};
