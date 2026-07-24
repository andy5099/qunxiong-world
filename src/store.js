const SAVE_KEY='qunxiong-world-v3',OLD_KEY='qunxiong-world-v2',BACKUP_KEY='qunxiong-world-save-backup';
let loadError='',sequence=0;
const uid=()=>`eq-${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2,9)}`;
const blankProgress=()=>({field:{kills:0,bossDefeated:false},'black-forest':{kills:0,bossDefeated:false},'yellow-camp':{kills:0,bossDefeated:false},'ancient-well':{kills:0,bossDefeated:false},'hulao-outskirts':{kills:0,bossDefeated:false}});
export function newState(){
  return {
    version:3,screen:'hunting',player:{name:'無名獵人',level:1,exp:0,maxHp:180,hp:180,maxMp:50,mp:50,attack:28,defense:10,speed:12,gold:200,gems:0,hunterRank:'青銅獵人'},
    mapId:'field',mapProgress:blankProgress(),inventory:{gear:[],stacks:{potion:10,'capture-normal':6,'capture-advanced':1,'capture-legendary':0}},equipment:{},bossPartners:[],activeBoss:null,
    exploration:{running:false,phase:'idle',count:0,kills:0,bosses:0,streak:0,enemy:null,captureReady:false,autoHeal:true,healBelow:45,returnBelow:20,bagLimit:60,autoSellQuality:'普通',autoDismantleQuality:'',stopOnBoss:false,autoChallengeBoss:true,autoCapture:true,captureNewOnly:false,captureDuplicates:true,captureFailAction:'continue',captureItem:'capture-normal',logMode:'compact'},
    latestRare:null,heroes:[{id:'hero-1',level:1,breakthrough:0,rebirth:0,skillLevel:1}],artifacts:{},activeArtifact:null,dungeon:{activeId:null,completions:{}},settings:{speed:1,vibrate:true},log:['狩獵核心 v3 已啟動。']
  };
}
function migrateGear(rawInventory,rawEquipment){
  const gear=[],equipment={};
  const add=(templateId,slot=null)=>{const instance={instanceId:uid(),templateId,name:'舊版裝備',slot,quality:'普通',level:1,baseStats:{},affixes:[],locked:false,obtainedAt:Date.now()};gear.push(instance);if(slot)equipment[slot]=instance.instanceId;};
  if(Array.isArray(rawInventory))rawInventory.forEach(entry=>{if(entry?.id?.startsWith('gear-'))for(let i=0;i<(entry.quantity||1);i++)add(entry.id);});
  Object.entries(rawEquipment||{}).forEach(([slot,id])=>{if(id)add(id,slot);});
  return {gear,equipment};
}
function migrateBosses(raw){
  const source=raw.bossPartners||raw.bossSouls||[];
  return source.map(soul=>({id:soul.id,name:soul.name||soul.id,rarity:soul.rarity||'普通',role:soul.role||'均衡',level:soul.level||1,exp:soul.exp||0,stars:soul.stars||soul.rank||1,hp:soul.hp||300,attack:soul.attack||8,defense:soul.defense||4,speed:soul.speed||10,activeSkill:soul.activeSkill||'戰魂突擊',passiveSkill:soul.passiveSkill||'玩家攻擊提升 3%',seals:soul.seals||0,captures:soul.captures||1,deployed:false}));
}
export function normalize(raw){
  const base=newState(),state={...base,...raw,version:3};
  state.player={...base.player,...raw?.player,hunterRank:raw?.player?.hunterRank||base.player.hunterRank};
  state.exploration={...base.exploration,...raw?.exploration,running:false,enemy:null,phase:'idle',captureReady:false};
  state.settings={...base.settings,...raw?.settings};state.mapProgress={...blankProgress(),...(raw?.mapProgress||{})};
  if(raw?.inventory?.gear){state.inventory={gear:raw.inventory.gear.map(item=>({locked:false,affixes:[],obtainedAt:Date.now(),instanceId:uid(),...item})),stacks:{...base.inventory.stacks,...raw.inventory.stacks}};}
  else{const migrated=migrateGear(raw?.inventory,raw?.equipment);state.inventory={gear:migrated.gear,stacks:{...base.inventory.stacks}};state.equipment=migrated.equipment;}
  state.bossPartners=migrateBosses(raw);state.activeBoss=raw?.activeBoss||raw?.activeSoul||null;state.bossPartners.forEach(partner=>partner.deployed=partner.id===state.activeBoss);
  state.heroes=(raw?.heroes||base.heroes).map(hero=>typeof hero==='string'?{id:hero,level:1,breakthrough:0,rebirth:0,skillLevel:1}:hero);
  state.artifacts=raw?.artifacts||{};state.dungeon={...base.dungeon,...raw?.dungeon,completions:raw?.dungeon?.completions||{}};
  return state;
}
export function save(state){localStorage.setItem(SAVE_KEY,JSON.stringify({...state,exploration:{...state.exploration,running:false,enemy:null,phase:'idle',captureReady:false}}));}
export function load(){
  const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_KEY);if(!raw)return null;
  try{localStorage.setItem(BACKUP_KEY,raw);return normalize(JSON.parse(raw));}
  catch(error){loadError='存檔讀取失敗，原始資料已保留在備份中。';try{localStorage.setItem(`${BACKUP_KEY}-corrupt`,raw);}catch{}return null;}
}
export const getLoadError=()=>loadError;
export function exportSave(state){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='qunxiong-world-v3-save.json';a.click();URL.revokeObjectURL(url);}
export async function importSave(file){return normalize(JSON.parse(await file.text()));}
