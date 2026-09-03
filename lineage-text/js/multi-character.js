import{createPlayer,derived}from'./player.js?v=38';
import{migrate}from'./migration.js?v=44';
export const MULTI_KEY='lineageTextMultiSaveV10',LEGACY_KEY='lineageTextSaveV1',MAX_CHARACTERS=7;
const uid=()=>`char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
export const emptyRoster=()=>({saveVersion:10,multiCharacterMigration:true,activeCharacterId:null,characters:Array(MAX_CHARACTERS).fill(null),globalSettings:{}});
export function wrapLegacy(old,now=Date.now()){let roster=emptyRoster();if(old?.player){let state=migrate(old);state.lastOnlineTimestamp??=now;roster.characters[0]={id:uid(),slot:0,createdAt:state.createdAt||now,state}}return roster}
export function normalizeRoster(raw,legacy=null,now=Date.now()){if(!raw?.characters)return wrapLegacy(legacy,now);let roster={...emptyRoster(),...raw};roster.characters=Array.from({length:MAX_CHARACTERS},(_,i)=>{let entry=raw.characters[i];if(!entry)return null;let state=migrate(entry.state||entry.data||entry);state.lastOnlineTimestamp??=entry.lastOnlineAt||now;return{id:entry.id||uid(),slot:i,createdAt:entry.createdAt||state.createdAt||now,state}});roster.saveVersion=10;roster.multiCharacterMigration=true;return roster}
export function addCharacter(roster,name,cls,slot,now=Date.now()){name=(name||'').trim();if(!name||name.length>12||slot<0||slot>=MAX_CHARACTERS||roster.characters[slot]||roster.characters.some(x=>x?.state.player.name===name))return null;let player=createPlayer(name,cls),state=migrate({saveVersion:10,createdAt:now,lastOnlineTimestamp:now,lastOfflineSettlementAt:now,logs:[],player,pendingOffline:null}),d=derived(player);player.hp=d.maxHp;player.mp=d.maxMp;let entry={id:uid(),slot,createdAt:now,state};roster.characters[slot]=entry;return entry}
export function removeCharacter(roster,id){let i=roster.characters.findIndex(x=>x?.id===id);if(i<0)return false;roster.characters[i]=null;if(roster.activeCharacterId===id)roster.activeCharacterId=null;return true}
export const offlineSeconds=(entry,now=Date.now())=>Math.min(86400,Math.max(0,Math.floor((now-(entry?.state?.lastOnlineTimestamp||now))/1000)));
export function loadRoster(){let raw=null,legacy=null;try{raw=JSON.parse(localStorage.getItem(MULTI_KEY));legacy=JSON.parse(localStorage.getItem(LEGACY_KEY))}catch{}let roster=normalizeRoster(raw,legacy);saveRoster(roster);return roster}
export function saveRoster(roster){localStorage.setItem(MULTI_KEY,JSON.stringify(roster))}
export function importRoster(value){if(value?.characters)return normalizeRoster(value);if(value?.player)return wrapLegacy(value);return null}
