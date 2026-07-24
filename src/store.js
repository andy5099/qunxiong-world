const SAVE_KEY='qunxiong-world-v2';
export function newState(){
  return {
    version:2,screen:'home',player:{name:'無名義士',level:1,exp:0,maxHp:180,hp:180,maxMp:50,mp:50,attack:26,defense:10,speed:12,gold:200,gems:0,rank:'士兵'},
    mapId:'region-1',weather:'晴天',inventory:[{id:'potion',quantity:3}],equipment:{},heroes:[],formation:'fish',
    exploration:{running:false,phase:'idle',count:0,kills:0,bosses:0,enemy:null,autoHeal:true,healBelow:45,returnBelow:20,bagLimit:60,autoSellWhite:true,autoDismantle:false},
    log:['歡迎來到群雄天下 2.0。'],quests:{},achievements:{},daily:{date:'',progress:{}},cities:{},artifacts:{},settings:{speed:1}
  };
}
export function normalize(raw){
  const base=newState(),state={...base,...raw};
  state.player={...base.player,...raw?.player};state.exploration={...base.exploration,...raw?.exploration,running:false,enemy:null,phase:'idle'};
  state.settings={...base.settings,...raw?.settings};state.inventory=Array.isArray(raw?.inventory)?raw.inventory:base.inventory;
  return state;
}
export const save=state=>localStorage.setItem(SAVE_KEY,JSON.stringify({...state,exploration:{...state.exploration,running:false,enemy:null,phase:'idle'}}));
export const load=()=>{try{const raw=localStorage.getItem(SAVE_KEY);return raw?normalize(JSON.parse(raw)):null;}catch{return null;}};
export const hasSave=()=>Boolean(localStorage.getItem(SAVE_KEY));
export function exportSave(state){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='qunxiong-world-save.json';a.click();URL.revokeObjectURL(url);
}
export async function importSave(file){return normalize(JSON.parse(await file.text()));}
