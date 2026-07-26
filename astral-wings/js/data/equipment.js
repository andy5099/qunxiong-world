// 20 件原創永久裝備，依部位提供穩定成長。
export const equipmentTemplates = [
  ['w1','星脈短炮','weapon','普通',2],['w2','晨弧脈衝槍','weapon','優良',4],['w3','深空裂光炮','weapon','稀有',7],['w4','銀河標定炮','weapon','史詩',11],
  ['s1','輔助飛彈艙','secondary','普通',2],['s2','軌跡光束艙','secondary','優良',4],['s3','裂爆無人機艙','secondary','稀有',7],['s4','星環護航艙','secondary','史詩',11],
  ['a1','纖維戰甲','armor','普通',8],['a2','流星護甲','armor','優良',12],['a3','深空重甲','armor','稀有',17],['a4','天幕守衛甲','armor','史詩',24],
  ['e1','折光引擎','engine','普通',3],['e2','彗尾加速器','engine','優良',5],['e3','靈敏躍遷引擎','engine','稀有',8],['e4','星界航跡引擎','engine','史詩',12],
  ['c1','藍晶核心','core','普通',6],['c2','日冕核心','core','優良',9],['c3','潮汐能量核','core','稀有',13],['c4','蒼穹奇點核','core','傳說',18]
].map(([id,name,slot,quality,value])=>({id,name,slot,quality,value,level:0,locked:false}));
export const slotNames={weapon:'主武器',secondary:'副武器',armor:'護甲',engine:'引擎',core:'核心'};

// 原創戰翼協調型態：用已取得模組組合出可逆的戰術傾向。
export const fusionForms = [
  { id: 'nova', name: '新星協調型', need: ['w2', 's2'], effect: '主炮傷害 +12%、光束冷卻縮短', stat: { attack: 0.12, fire: 0.12 } },
  { id: 'aegis', name: '天穹護航型', need: ['a2', 'c2'], effect: '生命與護盾 +15%', stat: { vitality: 0.15 } },
  { id: 'comet', name: '彗尾突進型', need: ['e2', 's3'], effect: '移動與無人機射速提升', stat: { speed: 0.16, drone: 0.2 } }
];
