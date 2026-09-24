# 夢境世界 V0.1.1

多世界手機文字 RPG。全部程式、資料、工具與測試都位於 `dream-world/`；沒有變更其他遊戲。

## 遊玩

- 【世界】→【＋ 建立新世界】：五步完成世界類型、設定、外掛、成年角色、確認建立。
- 可選修仙、奇幻、現代都市、末日、古代、科幻、自訂世界。建立後立即提供可玩的第一幕與三選項。
- 每個世界獨立保存玩家、外掛、數值、角色身份與關係、短長期記憶、背包、事件旗標及劇情位置。最多 12 個世界，每個世界最多 20 位自創成年角色。
- 可繼續／切換／刪除世界；刪除有第二次確認，至少保留一個世界。重置只影響目前世界。
- 外掛面板可選能力與目標，回到三選項確認使用。一般有效行動 +5 EXP，能力 +7 EXP；15／40／75／120 EXP 依序解鎖 Lv.2–5。
- 所有世界都能搭配太虛、安全屋、十倍返還、族群繁榮。自訂外掛保存名稱、描述、核心能力、成長方式、資源及觸發條件，並選取一套可執行模板；自由文字不會變成任意執行的程式，也未串接 AI。

## 已完成系統

| 系統 | 本版行為 |
|---|---|
| 多世界 | 7 類世界、五步建立、三選項探索／防衛／協商／日常，切換與獨立進度 |
| 世界規則 | 自訂 2–8 項數值，第一項為成長、第二項為可投入資源；人口／領地／外交等預設會綁定世界系統 |
| 太虛系統 | 開局仙緣之眼；Lv.2 共夢、Lv.3 共鳴、Lv.4 仙元煉化；能量、體力、冷卻與任務 |
| 仙緣之眼 | Lv.1 基本身份／關係／契合，Lv.2 喜好心情，Lv.3 瓶頸提示，Lv.4 且有信任時揭露隱藏情報 |
| 仙緣共鳴 | 成年、相識、信任與個性判定；兩方獲得成長，依能力層次／契合／信任計算，消耗能量及體力，產生仙元 |
| 其他外掛 | 安全屋建設、招募／人口與領地、十倍資源返還，均有實際世界效果與成長解鎖 |
| 成年角色 | 跨世界核心人格、當地身份；好感／信任／親密獨立，對話等級 0–4 |
| 關係互動 | 三位角色不同的曖昧、調情、邀約與親近後對話；私人邀約可被拒絕，朋友界線不會被數值覆蓋 |
| 自創角色 | 可在目前世界相處／邀約；建立新世界時也可選入，關係與記憶重新開始 |
| 保存 | 全世界自動／手動保存、JSON 匯出匯入、4 MB 上限、覆蓋確認、格式驗證與文字備份入口 |

新建立世界使用本地可重玩的事件模板與動態狀態文字，不是任意 AI 長篇生成。本版沒有新增大量固定主線，太虛第一卷仍保留。高親密互動以非露骨的成年恋愛對話呈現。

## 資料與引擎

- `src/archive-engine.js`：世界集合、目前世界、建立／切換／刪除、可共用角色名冊。
- `src/world-factory.js`、`data/worlds/presets.js`：世界設定驗證、各類預設、生成可玩模組。成長和資源以 World Module 的 growthStat／resourceStat 對應，核心不要求「修為」。
- `src/gimmick-engine.js`、`data/gimmicks/templates.js`：能力模板、分級、EXP、資源、任務、冷卻、已知機制結算。
- `src/character-engine.js`、`relationship-engine.js`：跨世界人格、當地身份、獨立關係與 intimacyDialogueLevel。
- `data/intimacy/dialogue.js`：分角色、分等級台詞及意願門檻；`events.js` 是通用相處／私人邀約；`moon.js` 是原有月下事件。
- `src/intimacy-engine.js`：成年、關係、信任、親密、旗標與私人界線判定；沒有內嵌事件台詞。機器可判定的界線為角色 flags.platonic／refusePrivate，搭配人物資料中的溝通界線與個性門檻。
- `src/story-engine.js`、`choice-engine.js`：三選項、外掛選項替換、共通結算、記憶與事件更新；自訂行動確認後回到原故事。
- `src/ai-provider.js`：保留供應器替換介面，context 含世界、玩家、外掛、背包、關係與有界記憶。未接 API。
- `src/media-engine.js`：沿用 image／video／none 占位與播放後結算。未接任何生成 API。
- `src/world-ui.js`：世界管理、五步建立與外掛面板；`src/ui.js` 是閱讀／角色／存檔頁；`main.js` 負責操作協調。

## 存檔 migration

仍使用 `qunxiongDreamWorldSaveV1`，不讀写其他遊戲的 key。格式升為：

```js
{
  version: 2,
  activeWorldId: 'taixu',
  worlds: [ /* 完整、彼此獨立的 World State */ ],
  savedAt: '...'
}
```

World State 保留原命名，避免無必要的轉換：worldId、worldType、definition（世界規則／數值定義）、player、gimmick、stats、characters（含 relationships）、customCharacters、memory、inventory、worldState、flags、sceneId（currentScene）、memory.recent（eventHistory）。不另外維護容易失去同步的別名。

讀取或匯入 V0.1 單世界存檔時，包裝為 worlds[0]，原 sceneId、turn、stats、characters、memories、flags 不清除；補上新欄位與太虛系統，按既有回合數給予初始 EXP。首次本機自動升級會先備份原 JSON 到 `qunxiongDreamWorldSaveV1MigrationBackupV1`。備份／保存遇到配額問題時保留已讀取的旅程於記憶體，提示匯出，不假裝寫入成功。

匯入先完整驗證所有世界，再讓使用者確認覆蓋。拒絕重複 worldId、缺失的 activeWorldId、非法場景／能力資料／資源、原型鍵值和過量資料。界面對使用者文字做 escaping；自訂描述不作為程式執行。

## 本機開發

```sh
node dream-world/tools/serve.js 4181
node --test dream-world/tests/*.test.js
```

網址：`http://127.0.0.1:4181/dream-world/`。無套件安裝與大型 framework。

`tests/playable-save.json` 是原始 V0.1 migration fixture，請保留；`tests/create-fixture.js` 另產生 `generated-v011-save.json`，不覆蓋舊 fixture。

Service worker 的 GET 處理與 cache 清理只限 Dream World，完整快取所有本地模組。新版快取完成後啟用；已開啟的舊頁請重新整理載入新模組。Manifest scope 仍是本遊戲目錄。

## 驗證與範圍

詳見 `TESTING.md`。目前以桌面 Chromium 的 375／390 viewport 驗證，未聲稱 iPhone Safari 真機或安裝 PWA 已驗收。圖片／影片實際內容、AI API、完整的策略戰爭模擬與自由文字生成主線不在本次範圍。

GitHub Pages： https://andy5099.github.io/qunxiong-world/dream-world/
