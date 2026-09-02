import{CONSUMABLES}from'./data.js?v=38';import{PET_TYPES}from'./systems.js?v=38';
export const ARROWS={木箭:{price:2,damage:1,undead:1},銀箭:{price:5,damage:2,undead:1.5},米索莉箭:{price:12,damage:4,undead:1.25}};
for(let[name,x]of Object.entries(ARROWS))CONSUMABLES[name]={price:x.price,weight:0,arrow:true,damage:x.damage,undead:x.undead};
export const STACK_USE={紅色藥水:'恢復 28 HP',橙色藥水:'恢復 75 HP',白色藥水:'恢復 180 HP',藍色藥水:'提升 MP 回復',魔力藥水:'立即恢復 MP',綠色藥水:'普通攻速 ×1.20，300秒',勇敢藥水:'普通攻速 ×1.25，300秒',回城卷軸:'返回村莊',瞬間移動卷軸:'移動用途',變身卷軸:'選擇經典變身',武器強化卷軸:'強化武器',防具強化卷軸:'強化防具',木箭:'基礎箭矢傷害 +1',銀箭:'基礎傷害 +2；對不死系 ×1.50',米索莉箭:'基礎傷害 +4；對不死系 ×1.25'};
export const PROTECTED_STACK=new Set(['祝福武器強化卷軸','祝福防具強化卷軸']);
export function stackSell(p,name,count){let have=p.consumables[name]||0,x=CONSUMABLES[name];count=Math.max(0,Math.min(have,Math.floor(count)));if(!x||!count||PROTECTED_STACK.has(name))return 0;let gold=Math.floor(x.price*.35)*count;p.consumables[name]-=count;p.gold+=gold;return gold}
export function stackDiscard(p,name,count){let have=p.consumables[name]||0;count=Math.max(0,Math.min(have,Math.floor(count)));if(!count||PROTECTED_STACK.has(name))return false;p.consumables[name]-=count;return true}
export const selectedArrow=p=>p.settings.arrowType||null;
export function consumeArrow(p,count){if(p.equipment.武器?.type!=='弓')return true;let n=selectedArrow(p);if((p.consumables[n]||0)<count)return false;p.consumables[n]-=count;return true}
export function arrowEffect(p,e){if(p.equipment.武器?.type!=='弓')return{bonus:0,mult:1};let a=ARROWS[selectedArrow(p)]||ARROWS.木箭,undead=e.race==='不死'||/骷髏|殭屍|食屍鬼|死亡|木乃伊/.test(e.name);return{bonus:a.damage,mult:undead?a.undead:1}}
export const PET_PRICES={dog:12000,wolf:18000,bear:45000,tiger:90000};
export function adoptPet(p,type){let base=PET_TYPES.find(x=>x.id===type),price=PET_PRICES[type];if(!base||p.gold<price)return false;p.gold-=price;p.pets.push({uid:`pet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,type,name:base.name,level:1,exp:0,hp:base.hp,attack:base.atk,ac:base.ac,hit:base.hit,speed:base.speed,alive:true,evolution:0,evolutionMultiplier:1});return true}
export function dismissPet(p,id){let pet=p.pets.find(x=>x.uid===id);if(!pet||p.activePets.includes(id))return 0;let price=Math.floor((PET_PRICES[pet.type]||1000)*(.35+pet.level*.02)*(1+pet.evolution*.75));p.pets=p.pets.filter(x=>x.uid!==id);p.gold+=price;return price}
