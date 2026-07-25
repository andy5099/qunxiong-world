// LocalStorage 儲存：保留舊資料，讀取異常時建立備份而非清空。
const KEY='qunxiong-world-v2',BACKUP='qunxiong-world-backup-v2';
export function newState(){return {version:3,screen:'home',player:{name:'無名獵人',level:1,exp:0,maxHp:100,hp:100,maxMp:50,mp:50,attack:10,defense:5,speed:12,gold:100,gems:0},inventory:[{id:'potion',quantity:3}],exploration:{running:false,enemy:null,phase:'idle'},log:['踏入群雄天下，開始狩獵。'],bossSouls:[]};}
export function normalize(raw){const base=newState(),state={...base,...raw,player:{...base.player,...raw?.player},exploration:{...base.exploration,...raw?.exploration,running:false,enemy:null,phase:'idle'},inventory:Array.isArray(raw?.inventory)?raw.inventory:base.inventory,log:Array.isArray(raw?.log)?raw.log:base.log};return state;}
export function save(state){try{const old=localStorage.getItem(KEY);if(old)localStorage.setItem(BACKUP,old);localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
export function load(){try{const raw=localStorage.getItem(KEY);return raw?normalize(JSON.parse(raw)):null;}catch{try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(BACKUP,raw);}catch{}return null;}}
export const hasSave=()=>Boolean(localStorage.getItem(KEY));
export function exportSave(state){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='qunxiong-world-save.json';a.click();URL.revokeObjectURL(url);}
export async function importSave(file){return normalize(JSON.parse(await file.text()));}
