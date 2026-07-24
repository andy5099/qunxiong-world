const SAVE_KEY='heroesRealmDemoSave_v001';
// LocalStorage 儲存與驗證，壞資料不會中斷遊戲。
export function saveGame(state) { try { localStorage.setItem(SAVE_KEY,JSON.stringify({version:'0.0.1',player:state.player})); return {ok:true,message:'存檔完成。'}; } catch (_) { return {ok:false,message:'無法寫入存檔，請確認瀏覽器允許 LocalStorage。'}; } }
export function loadGame() { try { const raw=localStorage.getItem(SAVE_KEY); if(!raw) return null; const data=JSON.parse(raw); if(!data || !data.player || !data.player.name) return null; return data.player; } catch (_) { return null; } }
export function hasSave() { return loadGame()!==null; }
