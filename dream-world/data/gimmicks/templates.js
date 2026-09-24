export const gimmickTemplates = {
  taixu: {
    id:'taixu', name:'太虛系統', description:'看見仙緣、開啟共夢，把真實的默契化為成長。能力不會替任何人答應邀請。',
    growth:'完成有效事件獲得 EXP；取得同伴信任可完成一次性任務。', resourceName:'太虛靈力', trigger:'在探索或日常場景使用外掛選項。',
    abilities:[{id:'eye',name:'仙緣之眼',level:1,cost:6,cooldown:2},{id:'dream',name:'太虛夢境',level:2,cost:10,cooldown:3},{id:'resonance',name:'仙緣共鳴',level:3,cost:14,cooldown:3},{id:'refine',name:'仙元吸收／煉化',level:4,cost:4,cooldown:2}],
    passiveEffects:['事件成長','高信任任務獎勵'], worldEffects:['共鳴增加雙方成長','仙元儲存與煉化'], relationshipEffects:['邀請依信任、關係、界線與個性判定'], eventEffects:['等級提升解鎖新的三選項分支']
  },
  shelter: {
    id:'shelter',name:'無限安全屋',description:'在任何世界開闢自己的安全區。恢復、擴建與庇護都會改變基地狀態。',growth:'完成世界事件累積 EXP，逐級擴建。',resourceName:'庇護能量',trigger:'消耗能量，在可探索的場景展開安全屋。',
    abilities:[{id:'shelter',name:'展開安全屋',level:1,cost:8,cooldown:2},{id:'expand',name:'擴建庇護區',level:2,cost:14,cooldown:3},{id:'beacon',name:'庇護信標',level:3,cost:18,cooldown:4}],passiveEffects:['日常恢復能量'],worldEffects:['基地等級與庇護人數成長'],relationshipEffects:[],eventEffects:['解鎖避難與物資回收']
  },
  return: {
    id:'return',name:'十倍返還',description:'投入自己的資源，取得十倍回報。有限冷卻與返還能量，讓每次投入都需要安排。',growth:'完成事件與使用能力累積 EXP。',resourceName:'返還能量',trigger:'持有至少 2 點世界資源，且能力不在冷卻。',
    abilities:[{id:'return',name:'十倍返還',level:1,cost:12,cooldown:3},{id:'invest',name:'成長返還',level:2,cost:16,cooldown:3},{id:'windfall',name:'機緣回收',level:3,cost:20,cooldown:4}],passiveEffects:['事件成長'],worldEffects:['資源投入 2、回收 20，淨增 18'],relationshipEffects:[],eventEffects:['額外機緣與成長']
  },
  prosperity: {
    id:'prosperity',name:'族群繁榮系統',description:'聚集同伴、建立據點，以族群繁榮回饋自身的力量。',growth:'完成事件獲得 EXP，人口與領地帶來額外成長。',resourceName:'繁榮點',trigger:'在日常探索中招募或擴張。',
    abilities:[{id:'recruit',name:'族群招募',level:1,cost:8,cooldown:2},{id:'territory',name:'拓展領地',level:2,cost:14,cooldown:3},{id:'bloodline',name:'血脈回響',level:3,cost:18,cooldown:4}],passiveEffects:['人口回饋成長'],worldEffects:['人口','領地','外交'],relationshipEffects:[],eventEffects:['族群成長事件']
  }
};
export const levelThresholds = [0,15,40,75,120];
export function gimmickLevel(exp) { return levelThresholds.filter(n=>exp>=n).length; }
