// 刷寶核心資料：五張地圖、可收服 Boss、裝備模板與收服符。
export const MAPS=[
 {id:'plains',name:'村外平原',level:'Lv.1～4',normal:['草原狼','流民','野豬'],elite:'平原獵首',boss:'plainChief',hidden:'wildBoarKing',drop:'粗鐵武器',need:0,threshold:12},
 {id:'blackwind',name:'黑風森林',level:'Lv.5～10',normal:['黑風狼','山賊','毒蛇'],elite:'黑風頭目',boss:'blackwindChief',hidden:'tigerKing',drop:'黑風套裝',need:1,threshold:20},
 {id:'yellowcamp',name:'黃巾營地',level:'Lv.10～16',normal:['黃巾兵','黃巾弓手','流寇'],elite:'黃巾力士',boss:'yellowGeneral',hidden:'taipingMage',drop:'黃巾戰裝',need:2,threshold:28},
 {id:'wellcave',name:'古井洞窟',level:'Lv.16～23',normal:['洞穴蝠','毒蛛','石怪'],elite:'洞窟祭司',boss:'dragonKing',hidden:'caveDemon',drop:'毒龍遺物',need:3,threshold:36},
 {id:'hulao',name:'虎牢關外圍',level:'Lv.23～30',normal:['西涼兵','鐵騎','弩手'],elite:'飛熊軍統領',boss:'hulaoWarlord',hidden:'warGodEcho',drop:'虎牢戰魂',need:4,threshold:45}
];
export const BOSSES={
 plainChief:{id:'plainChief',name:'平原盜首',rarity:'普通',role:'坦克',hp:180,attack:18,defense:8,skills:['重斬','嘲諷','反擊'],passive:'玩家防禦 +4%',soul:1},
 wildBoarKing:{id:'wildBoarKing',name:'狂牙豬王',rarity:'精英',role:'爆發輸出',hp:230,attack:25,defense:7,skills:['衝撞','獠牙連擊','狂吼'],passive:'金幣掉落 +8%',soul:2},
 blackwindChief:{id:'blackwindChief',name:'黑風寨主',rarity:'普通',role:'坦克',hp:330,attack:28,defense:14,skills:['霸王斬','嘲諷','反擊'],passive:'玩家防禦 +8%',soul:1},
 tigerKing:{id:'tigerKing',name:'魔化虎王',rarity:'稀有',role:'爆發輸出',hp:420,attack:38,defense:12,skills:['烈焰撕咬','火焰吐息','猛獸咆哮'],passive:'爆擊率 +5%',soul:3},
 yellowGeneral:{id:'yellowGeneral',name:'黃巾渠帥',rarity:'精英',role:'持續傷害',hp:520,attack:42,defense:19,skills:['符咒','毒火','爆發'],passive:'Boss 傷害 +6%',soul:2},
 taipingMage:{id:'taipingMage',name:'太平妖師',rarity:'稀有',role:'持續傷害',hp:600,attack:49,defense:18,skills:['妖雷','咒火','回魂'],passive:'經驗 +8%',soul:3},
 dragonKing:{id:'dragonKing',name:'毒龍王',rarity:'稀有',role:'持續傷害',hp:720,attack:55,defense:24,skills:['劇毒撕咬','毒霧','劇毒爆發'],passive:'Boss 傷害 +10%',soul:3},
 caveDemon:{id:'caveDemon',name:'古井魔君',rarity:'傳說',role:'坦克',hp:840,attack:62,defense:32,skills:['魔爪','護體','反震'],passive:'最大生命 +12%',soul:5},
 hulaoWarlord:{id:'hulaoWarlord',name:'虎牢戰將',rarity:'傳說',role:'爆發輸出',hp:980,attack:72,defense:36,skills:['破軍','戰吼','連斬'],passive:'攻擊 +10%',soul:5},
 warGodEcho:{id:'warGodEcho',name:'戰神殘影',rarity:'傳說',role:'爆發輸出',hp:1150,attack:84,defense:42,skills:['無雙','震地','戰意'],passive:'爆擊傷害 +15%',soul:5}
};
export const CAPTURE_ITEMS={captureNormal:{name:'普通收服符',bonus:10,price:40},captureAdvanced:{name:'高級收服符',bonus:25,price:120},captureLegend:{name:'傳說收服符',bonus:45,price:360}};
export const EQUIPMENT_TEMPLATES=Array.from({length:30},(_,i)=>({id:`gear${i+1}`,name:['黑風戰刀','平原護腕','黃巾長槍','古井法袍','虎牢戰甲'][i%5]+`·${i+1}`,slot:i%2?'armor':'weapon',level:1+Math.floor(i/5)*5,attack:4+i*2,defense:2+i,price:20+i*12}));
export const QUALITY=[['普通',0,.55],['優良',1,.25],['稀有',2,.13],['史詩',3,.055],['傳說',4,.012],['神器',4,.003]];
export const AFFIXES=['攻擊 +','防禦 +','最大生命 +','速度 +','爆擊率 +','吸血 +','經驗加成 +','金幣加成 +','裝備掉落 +','Boss 傷害 +','精英傷害 +','收服成功率 +','Boss 夥伴傷害 +','自動回血 +','爆擊傷害 +','技能傷害 +','火屬性傷害 +','毒傷害 +','普通怪傷害 +','Boss 金幣 +','生命回復 +'];
