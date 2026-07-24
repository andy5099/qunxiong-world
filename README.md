# 群雄天下 Demo v0.0.1

不需要安裝套件或啟動伺服器。直接以現代瀏覽器雙擊開啟 `index.html` 即可遊玩。

## 發布至 GitHub Pages

專案已包含 GitHub Pages 自動發布工作流程。將整個專案推送到 GitHub 儲存庫後：

1. 在儲存庫開啟 **Settings → Pages**。
2. 在 **Build and deployment** 的 **Source** 選擇 **GitHub Actions**。
3. 推送 `master` 或 `main` 分支，或在 **Actions** 手動執行「Deploy 群雄天下 to GitHub Pages」。
4. 工作流程完成後，可在該次執行結果或 Pages 設定頁取得遊戲網址。

此專案是純靜態網站，發布後會以根目錄的 `index.html` 作為遊戲入口。

## 遊玩內容

- 建立角色、探索森林、自動／手動回合制戰鬥與自動升級
- 世界地圖分為小怪地圖「蒼林」、菁英地圖「斷崖嶺」、BOSS 地圖「黑風寨」
- 戰勝敵人後可降服為武將；可自由編組、替換最多三位隨行武將協同作戰
- 武將忠誠與每月隨機事件，忠誠歸零時武將會離去
- 村莊商店：木刀、布衣、精鐵劍、皮甲、藥草
- 背包使用與武器、護甲裝備管理
- 瀏覽器 LocalStorage 完整存檔／讀檔

## 專案架構

- `js/game.js`：GameState 與探索流程
- `js/battle.js`：回合制戰鬥與結算
- `js/player.js`、`js/enemy.js`、`js/shop.js`、`js/tavern.js`：各領域的遊戲規則
- `js/ui.js`、`js/main.js`：畫面渲染與互動入口
- `data/`：怪物、道具、武將及地點資料

存檔僅儲存在目前瀏覽器與裝置；清除該網站的瀏覽資料可能會一併清除進度。
