# 夢境世界 V0.1

獨立手機文字 RPG，第一個 World Module 為《太虛仙緣》。不依賴其他遊戲的程式或素材。

## 遊玩與開發

從儲存庫根目錄執行：

```sh
node dream-world/tools/serve.js
node --test dream-world/tests/*.test.js
```

預覽：`http://127.0.0.1:4173/dream-world/`。使用 HTTP 靜態伺服器，不能直接以 `file://` 開啟 ES Modules。

GitHub Pages 預定位置：https://andy5099.github.io/qunxiong-world/dream-world/

沿用儲存庫既有 Pages workflow；推送至部署分支後才會發布。此目錄沒有新增部署設定，也不修改入口或其他遊戲。

## V0.1 範圍

- 第一卷包含 17 個場景。三種初遇路線、試劍坪事件、尊重拒絕的夢境邀請、共修或獨自探索、煉氣二層突破、蘇媚璃登場及顧傾城召見伏筆。
- 通關後可繼續日常互動、共修、聽雨閣交流；月下事件可成為戀人、慢慢來或保留朋友關係。朋友界線不會被後續數值自動覆蓋。
- 每幕恰好三個可用選項；桌面可按 1／2／3，手機使用大型按鈕。
- 三位成年角色的 Core / World Persona、三條獨立關係數值、角色狀態、資訊解鎖、互動及親密事件記憶。
- 自訂行動是本地意圖規劃：確認後回到原本三選項。不會假裝理解所有自由輸入，也不會憑空完成輸入中宣稱的事件。
- 造物臺可建立至多 20 位成年角色並保存於目前世界；專屬劇情尚未實作。
- 自動保存、手動保存、JSON 匯出／匯入／格式驗證／覆蓋確認、獨立重置。下載受限時可使用匯出對話框的完整 JSON 文字。
- 深色直式閱讀、加大字體（目前頁面工作階段）、safe-area 底部導航、減少動態偏好。

## 五層架構

| 層 | 檔案 | 職責 |
|---|---|---|
| Core | `src/state.js`、`world-engine.js`、`choice-engine.js` | 依世界定義初始化／限制數值，驗證選項條件，純函式結算 |
| World Module | `data/worlds/taixu.js` | 題材、玩家身份、地點、數值、規則、場景入口、世界語氣 |
| Character | `data/characters/cast.js`、`character-engine.js`、`relationship-engine.js` | 跨世界人格及各世界身份，關係與解鎖資料 |
| Story / Event | `data/events/taixu.js`、`story-engine.js`、`intimacy-engine.js` | 條件式分支、文字、選項、效果、記憶、成年及關係門檻 |
| Media | `src/media-engine.js`、事件的 `media` | 圖／影播放與文字降級；關閉或播放結束才結算選擇 |

`ui.js` 負責資料呈現，`main.js` 負責操作協調，兩者不定義角色人格或故事結果。

新增世界：提供必要 World Module 欄位，透過 `registerWorld()` 註冊並給 `StoryEngine`；加入初始 registry／世界切換介面即可。核心不檢查煉氣、修為或特定角色名字。測試使用獨立的都市金錢數值驗證這點。V0.1 尚未提供世界切換 UI 或多存檔槽，state 已包含 worldId、slotId。

新增角色：提供 Core 與 personas（worldId、identity、occupation、abilities、clothing、background、worldMemories），將 ID 加入 World Module 的 characters，故事事件用 ID 指向該角色。成年判定為 `adult: true` 且年齡至少 18。

新增事件：提供 id、text（字串或依 state 產生的函式）、choices；每個選項包含 requirements、next、result、effects、memoryEffects、media。候選選項依條件過濾後取前三個，必須提供足夠 fallback。親密事件另有 characters、requirements、relationshipRequirement、affectionRequirement、trustRequirement、intimacyRequirement、worldRequirement；進入時與播放前均需符合條件。一次性事件以旗標記錄。

## AI Provider 與記憶

`StoryEngine(world, provider)` 可替換或混用 `AIProvider.generateScene(context)`。本地供應器不只讀固定 JSON，也會依旗標、關係、數值篩選選項與產生文字。

供應器回應契約：sceneText、choices[3]、stateEffects、memoryUpdates、possibleMediaEvent。V0.1 效果放在選項中，由玩家確認後結算；不會自動執行模型輸出。接遠端模型前，需再做 effects allowlist／完整輸出 schema 驗證與後端代理；目前沒有 API 金鑰或外部請求。

context 包含世界法則、玩家、已相遇角色卡／身份／關係、最近六次劇情、短期及重要記憶、關係／世界摘要與旗標。短期 8 筆、長期 40 筆、最近事件 12 筆、每角色 24 筆；不無限累積聊天紀錄。保存的記憶在選擇時更新，UI 揭露弱點／秘密受信任或 unlock 控制。

## 存檔與隔離

- 唯一 localStorage key：`qunxiongDreamWorldSaveV1`。
- 匯入上限 500 KB；驗證版本、世界、場景、角色、成年、數值、旗標、記憶結構；剔除非 schema 欄位。輸入文字以 HTML escaping 呈現。
- 壞存檔不自動覆蓋：首次開啟會提供原始備份及明確重置選項。
- Manifest scope／start_url 都限於此目錄。
- Service worker 的 scope 為 `/dream-world/`；僅處理該 scope 的 GET，僅清理 `dream-world-` 開頭 cache。版本更新改 CACHE 名稱；舊頁面關閉後啟用新版本。
- 媒體路徑僅允許此遊戲同源 `assets/` 之下，不抓取任意外部內容。沒有 media 時立即回到文字流程。V0.1 沒有實際事件圖／影片素材。
- 所有新增檔案、工具、測試都在此目錄。沒有改動 `/lineage-text/` 或其他既有遊戲。

## 後續範圍

AI API、多世界生成與切換、多存檔槽、自創角色劇情、宗主後續章節、實際圖片／影片內容、進一步境界成長尚未完成。V0.1 主線提升至煉氣二層，通關後修為可持續累積。未聲稱 iOS 真機／Safari 或安裝型 PWA 已驗證。

## 測試

見 `TESTING.md`。`tests/create-fixture.js` 可重建 `tests/playable-save.json`，用於在匯入介面測試第一卷完成與月下事件。
