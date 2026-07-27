# 星界戰翼重製審核

審核日期：2026-07-27。此文件以現有程式碼與實際 Canvas 關卡啟動結果為準，不以功能名稱推定完成度。

## 實際問題與對應位置

1. **戰機外觀仍過度依賴共用圖集。** `js/renderer.js` 的 `drawAiCraft()` 以 `p.sprite` 裁切同一張圖集；`js/data/ships.js` 中部分機體共用 sprite 索引。需要將晨星、燼焰、紫曜三架機體改為獨立的 Canvas 分層輪廓。
2. **主武器邏輯過度集中。** `js/game.js` 的 `firePlayer()` 以 `state.primary` 分支，但仍共用 `emitPlayerShot()` 與同一批散射角公式；集中、散射、磁軌需拆出獨立射擊配置與命中效果。
3. **火力效果尚未完全武器化。** `firePlayer()` 的 `count/spread` 先套用共同邏輯；`renderer.js` 的炮口光會隨火力增加，但各武器的 Lv1～Lv5 沒有完整獨立配置。
4. **編隊僅有起始座標，尚未維持隊形。** `game.js` 的 `formationX()` 為敵人提供進場 x 座標；`updateEnemies()` 之後仍由敵人各自 pattern 移動。需要 FormationManager 保存隊形錨點、維持時間、同步開火與撤退條件。
5. **擊破目前為即時移除。** `resolveDefeats()` 會在 HP <= 0 時呼叫 `defeat()` 並直接過濾敵人；`spawnParticle()` 有粒子，但尚無殘骸／多段死亡狀態。
6. **第一關 Boss 尚無部位。** `entities/boss.js` 的 `makeBoss()` 只有主體 HP；`game.js` 的 `runBossPattern()` 是可讀循環，卻沒有左右炮台獨立生命與摧毀後停火。
7. **Boss 預警與喘息已有基礎。** `runBossPattern()` 的 `telegraph/rest` 已限制單一主招；`renderer.js` 使用 `laserWarn` 繪製預警。仍需補進場、部位受損與死亡狀態機。
8. **首頁仍偏網頁列表。** `js/uiEnhancements.js` 的 `homeDashboard()` 已有戰機預覽，但首頁仍以多個文字按鈕構成，沒有戰力／裝備槽環繞展示與完整待機畫面。
9. **裝備已有部分實戰連接。** `game.js` 使用 `primary/secondary/wingman`；主武器、副武器與僚機均實際發彈。護甲、核心與高品質特殊效果目前多以數值為主，需要補獨立效果掛鉤。
10. **手機輸入採 Pointer Events。** `js/input.js` 的拖曳控制已接入；仍需在指定尺寸與旋轉情境進行人工測試。

## 本輪驗收範圍

- 三架主要戰機採原創分層 Canvas 輪廓。
- 三種主武器拆分射擊設定與命中效果。
- FormationManager 維持編隊，而非僅分配出生座標。
- 第一關 Boss 改為有炮台、狀態與死亡處理的可讀戰鬥。
- 以 before/after 截圖與三輪測試紀錄決定是否可交付。
