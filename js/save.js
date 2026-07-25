const SAVE_KEY='heroesRealmDemoSave_v001'; const BACKUP_KEY='heroesRealmDemoSave_backup_v001';
// LocalStorage 儲存與驗證，壞資料不會中斷遊戲。
export function saveGame(state) { try { const old=localStorage.getItem(SAVE_KEY);if(old)localStorage.setItem(BACKUP_KEY,old);localStorage.setItem(SAVE_KEY,JSON.stringify({version:3,player:state.player})); return {ok:true,message:'存檔完成。'}; } catch (_) { return {ok:false,message:'無法寫入存檔，請確認瀏覽器允許 LocalStorage。'}; } }
export function loadGame() { try { const raw=localStorage.getItem(SAVE_KEY); if(!raw) return null; const data=JSON.parse(raw); if(!data || !data.player || !data.player.name) return null; return data.player; } catch (_) { return {error:'存檔讀取失敗，原始存檔已保留，請勿清除瀏覽器資料。'}; } }
export function hasSave() { return loadGame()!==null; }
