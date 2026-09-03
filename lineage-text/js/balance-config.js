export const BALANCE_CONFIG={expRate:1,goldRate:3,bossExpRate:1,bossGoldRate:1.3,offlineExpRate:1,offlineGoldRate:1,petExpRate:1,equipmentDropRate:1,skillBookDropRate:1,bossMaterialDropRate:1};
export const expReward=(base,{boss=false,offline=false}={})=>Math.floor(base*BALANCE_CONFIG.expRate*(boss?BALANCE_CONFIG.bossExpRate:1)*(offline?BALANCE_CONFIG.offlineExpRate:1));
export const goldReward=(base,{boss=false,offline=false}={})=>Math.floor(base*10*BALANCE_CONFIG.goldRate*(boss?BALANCE_CONFIG.bossGoldRate:1)*(offline?BALANCE_CONFIG.offlineGoldRate:1));
export const petExpReward=base=>Math.floor(base*BALANCE_CONFIG.petExpRate);
