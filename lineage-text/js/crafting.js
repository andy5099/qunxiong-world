import{WORLD_BOSSES,CLASSES}from'./data.js?v=27';import{BOSS_CATALOG,BOSS_SETS}from'./systems.js?v=27';import{addItem}from'./inventory.js?v=27';
export function recipes(){return[...BOSS_CATALOG.map(b=>({id:b.id,name:b.item.name,item:b.item,requirements:{[b.material]:b.need},gold:320000+b.need*40000})),...BOSS_SETS.flatMap(s=>s.pieces.map((piece,i)=>({id:`${s.id}p${i}`,name:piece.name,item:piece,requirements:{[s.material]:3+i},gold:180000+i*60000}))),...WORLD_BOSSES.map((x,i)=>({id:`world${i}`,name:x.weapon.name,item:x.weapon,requirements:{[x.material]:8},gold:1600000+i*300000}))]}
export function canCraft(p,r){return p.gold>=r.gold&&Object.entries(r.requirements).every(([k,v])=>(p.bossMaterials[k]||p.worldMaterials[k]||0)>=v)}
export function recipeForClass(p,r){return r.item.slot!=='武器'||(r.item.classes?r.item.classes.includes(p.cls):CLASSES[p.cls].weapon.includes(r.item.type))}
export function craft(p,id){let r=recipes().find(x=>x.id===id);if(!r||!canCraft(p,r))return false;for(let[k,v]of Object.entries(r.requirements)){let bag=k in p.worldMaterials?p.worldMaterials:p.bossMaterials;bag[k]-=v}p.gold-=r.gold;return addItem(p,r.item,true)}


