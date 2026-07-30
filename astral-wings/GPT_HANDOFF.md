# Astral World：星界冒險｜GPT 交接檔

請將本檔完整貼給下一位 GPT，或連同 `astral-wings/` 資料夾一起上傳。

## 專案識別

- Repository：`andy5099/qunxiong-world`
- 網頁入口：`astral-wings/`
- 線上網址：https://andy5099.github.io/qunxiong-world/astral-wings/
- 最新提交：`00fa046`
- 遊戲名稱：**Astral World：星界冒險**
- 類型：原創、單機、手機直式、Canvas 放置 RPG
- 不可使用任何既有遊戲的名稱、美術、音效、角色或素材。

## 必讀檔案

1. `README.md`
2. `PROGRESS.md`
3. `src/astral-world/data.js`
4. `src/astral-world/core.js`
5. `src/astral-world/game.js`
6. `src/astral-world/renderer.js`
7. `src/astral-world/ui.js`
8. `src/astral-world/save.js`

## 已完成且不可破壞

- Canvas 自動戰鬥、怪物攻擊、死亡後復甦。
- 四個自動技能：星刃斬、流星連擊、星光護盾、星爆終結。
- 五張地圖、普通怪、區域 Boss、關卡推進與解鎖。
- 隨機裝備、八部位穿戴、背包、鎖定、出售與自動裝備／出售。
- 怪物收服、主戰寵物、升星與協同攻擊。
- 每日任務、離線收益、匯入／匯出與版本化 localStorage。
- 手機直式 UI、底部導覽、主線目標、解鎖提示與五種環境動態。
- GitHub Pages 相對路徑與 Service Worker。

## 存檔規則

- 新遊戲 localStorage key：`astralWorldIdleV1`
- 存檔版本：`SAVE_VERSION = 2`
- 舊《星界戰翼》內容保留在 `.reference/before-astral-world/`，不可刪除。
- 不可清除或覆寫非本遊戲的 localStorage key。

## 目前待完成的優先順序

1. 平衡 Lv.1～10 的經驗、Boss 與掉落節奏。
2. 重製五張地圖的普通怪、精英與 Boss 外觀／動作，避免簡單幾何圖形。
3. 加入裝備比較、詞綴、強化與稀有掉落展示。
4. 加入可跳過、可回看的新手導引。
5. 完成 320／375／390／430px 與 Safari 效能驗收。

## 開發限制

- 直接在目前專案修改，不建立獨立 Demo 或 V2 資料夾。
- 保持 HTML、CSS、Vanilla JavaScript、Canvas 2D、localStorage。
- 不加入 React、Vue、後端、登入、付費或廣告。
- 保持 GitHub Pages 可部署；所有路徑使用相對路徑。
- 不要在單一檔案重建第二套戰鬥、存檔或裝備系統。

## 測試方式

```powershell
cd astral-wings
python -m http.server 8000
```

開啟 `http://localhost:8000/`，並執行：

```powershell
node scripts/astral-world-smoke.mjs
```

確認：遊戲可啟動、自動戰鬥持續、Boss 可出現、背包／寵物／設定可進入，Console 無 Error。

## 給 GPT 的執行指令

> 請先閱讀 `astral-wings/GPT_HANDOFF.md`、`README.md` 與 `PROGRESS.md`。保留已完成核心功能與存檔相容性，直接從 `PROGRESS.md` 的「下一個實作項目」開始。每次修改後執行語法檢查、Smoke Test 與本機瀏覽器驗證；確認後更新 `PROGRESS.md`、`README.md` 與 CHANGELOG。
