# Astral World：星界冒險

原創、單機、手機直式的 Canvas 放置 RPG。玩家會在星界地圖中自動戰鬥、升級、獲得隨機裝備、挑戰區域 Boss、收服怪物並派出寵物協助戰鬥。

## 可立即遊玩內容

- 自動普攻、四種自動技能、護盾、死亡後三秒復甦。
- 五張可解鎖地圖；每張包含三種普通怪物與一隻區域 Boss。
- 十隻怪物後自動或手動挑戰 Boss；勝利後推進關卡並解鎖下一區域。
- 七階品質隨機裝備、八個裝備欄位、背包排序、鎖定、出售與自動裝備。
- 怪物收服、主戰寵物、寵物升星與協同攻擊。
- 每日任務、離線收益（上限八小時）、手動匯出／匯入與安全重置。
- 手機直式 UI、Canvas 戰鬥動畫、傷害數字、技能光效、掉落提示。

## 操作

遊戲進入後自動開始探索。底部導覽可開啟角色、裝備、寵物、地圖、背包、任務與設定。技能卡可獨立切換自動施放；Boss 可以手動挑戰；設定可控制自動 Boss、自動推進、自動裝備與自動出售品質。

## 專案結構

```text
src/astral-world/
  data.js       地圖、怪物、技能、品質與平衡資料
  core.js       屬性重算、裝備生成、等級與寵物規則
  save.js       版本化 localStorage、離線收益、匯入匯出
  renderer.js   Canvas 2D 戰鬥與特效繪製
  game.js       單一 requestAnimationFrame 戰鬥循環
  ui.js         手機 UI、背包、地圖、任務與設定
  main.js       啟動與頁面生命週期
```

## 本機啟動

請透過 HTTP Server 開啟，避免 ES Modules 被瀏覽器限制：

```powershell
cd AstralWings_CODEX_WORKSPACE_V3
python -m http.server 8000
```

開啟 `http://localhost:8000/`。

## GitHub Pages

這是純靜態專案，將本資料夾內容推送到 GitHub repository 後，在 GitHub Pages 設定中選擇該分支根目錄即可。所有載入路徑均使用相對路徑。首次更新後若瀏覽器仍顯示舊頁面，請重新整理一次，新的 `service-worker.js` 會清除舊快取。

## 存檔

本遊戲資料只寫入 `astralWorldIdleV1`。既有 Astral Wings 的 localStorage key 不會被刪除或覆寫。損壞的 Astral World 存檔會安全回到預設狀態；設定頁提供匯出、匯入與二次確認的重置。

## 已知限制與後續方向

這是可遊玩的第一版核心，尚未包含多人、帳號、交易、付費內容或伺服器功能。後續可在 `data.js` 增加地圖、怪物、技能、裝備詞綴與寵物，不必重寫戰鬥循環。
