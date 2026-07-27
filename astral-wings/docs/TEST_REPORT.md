# 測試報告

## 第 0 輪：修改前基線

- 已以本機 HTTP Server 進入第一關；Canvas、HUD、敵機、掉落與自動射擊均可見。
- 發現一次由火力慢動作造成的 `const dt` 重設錯誤，已在 `js/game.js` 更正為 `let dt` 並實測戰鬥恢復更新。
- 待補：before／after 視覺檔、三種武器、Boss 炮台破壞、指定手機尺寸。

## 第 1 輪：功能審查

待執行：FormationManager、三種武器拆分、Boss 狀態／部位。

## 第 2 輪：視覺審查

待執行：比較畫面、戰機輪廓、火力層級、Boss 預警與 HUD。

## 第 3 輪：實際遊玩審查

待執行：第一關三次、三種武器、手機尺寸與 GitHub Pages。
