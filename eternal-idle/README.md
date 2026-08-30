# 永恆掛機傳說

純 HTML、CSS、JavaScript 製作的離線掛機 RPG，無後端與建置步驟。存檔使用 `localStorage`，離線收益最多累積 24 小時。

V2「打寶深化版」新增 Item Level、Equipment Score、七階品質、職業與特殊詞綴、12 套裝、48 件 Boss 專屬裝、Boss 圖鑑與首殺、分解素材、鍛造熟練度、詞綴重鑄、永恆之塔、收藏圖鑑、Build 分析與 V2 離線收益。V1 存檔會自動遷移至 `saveVersion: 2`。

## 執行

在 repository 根目錄啟動任一靜態 HTTP Server，開啟：

`http://localhost:8877/eternal-idle/`

GitHub Pages 部署 repository 根目錄後亦可由 `/eternal-idle/` 進入。

## 測試

`node eternal-idle/tests/smoke.mjs`
