# 夢境世界 V0.2.1

手機文字 RPG：自由輸入 → 角色接話 → 世界與角色記住 → 繼續對話。保留多世界、五步建立世界、角色卡、造物臺、外掛、成年戀愛、存檔、匯入匯出及離線模板模式。所有程式與工具限於 `dream-world/`。

## 開始 AI 劇情

1. 開啟【設定 → AI 劇情】。新世界預設推薦 AI；舊存檔保留離線模式與原進度。
2. Provider 可選 OpenRouter，自動帶入 `https://openrouter.ai/api/v1` 與 `cognitivecomputations/dolphin-mistral-24b-venice-edition`；也保留 OpenAI／相容 API／私人 Proxy。自行在頁面輸入金鑰後按【測試連線】，不要把金鑰交給他人。
3. 切回【劇情】，開場就能直接輸入想說的話或行動。每輪回覆下方都有輸入框；0–3 個快捷行動只作輔助，沒有快捷行動也可繼續對話。亦可請角色先簡短開場。
4. 【↻ 重寫這一幕】從該幕生成前的檢查點重新生成，取代該幕所有效果，不重複發放 EXP／道具／好感。
5. 無金鑰或不想連線時，選【離線／模板劇情】。已保存 AI 場景可離線閱讀；繼續生成需要連線。

OpenAI 使用 `/v1/chat/completions`、JSON mode、temperature 與最多 6,000 output tokens。依官方文件核對：[模型](https://developers.openai.com/api/docs/models/gpt-4.1-mini)、[JSON mode](https://developers.openai.com/api/docs/guides/structured-outputs)。需要自己的 API 帳戶權限與額度。

| Provider | 設定 | 驗證範圍 |
|---|---|---|
| OpenAI | 固定 `https://api.openai.com/v1`，預設 `gpt-4.1-mini`，自己的 API Key | 正式 HTTP 呼叫已實作；本次無私人金鑰，未做真實付費模型推論 |
| OpenRouter | 固定 `https://openrouter.ai/api/v1`，預設指定 Dolphin 模型，需自己的 Key／額度 | 已核對官方公開模型端點的 response_format 支援；只完成模擬 transport 測試，未做真實推論 |
| OpenAI 相容 API | 自填 HTTPS Base URL／模型／Key，需支援 Chat Completions JSON mode、temperature、CORS | 本機 HTTP 模擬端點通過自動測試與瀏覽器完整操作；第三方服務需自行測試 |
| 自己的 Backend / Proxy | 相同協定；前端持有私人 Proxy Token | 附 `tools/ai-proxy.js`；未替使用者部署公開後端 |

測試連線驗證 Provider 可回傳 JSON；每幕另外做完整 schema、世界 ID、數值、人物與界線驗證。失敗提供【重新生成】【切換離線模式】，不提交待處理回合。45 秒逾時中止請求。缺少金鑰、402 或 429 明確顯示 AI 暫不可用；不自動切離線，不把模板冒充 AI。輸入草稿在本次分頁保留，成功回應後清空（草稿不持久保存）。額度不足、權限錯誤、截斷、malformed JSON、無效效果都保留原存檔。

## 金鑰與私人 Proxy

API Key、Proxy Token、連線設定只存在目前分頁的 JS 私有記憶體，不存 localStorage、sessionStorage、存檔、匯出檔、Service Worker 或 repository。重新整理需重填，可手動清除。切換 Provider／Base URL 清除前一端點的金鑰。前端記憶體不是伺服器保密庫，不能抵擋惡意瀏覽器擴充套件；僅在自己的可信裝置與端點使用。

生成會把相關遊戲資料送往自己選擇的 Provider，可能產生費用。GitHub Pages 不提供 AI 額度，也沒有共用金鑰。請勿把真實金鑰放進聊天、Git commit 或公開程式。

可選私人 Proxy：Node 22+，透過執行環境的秘密管理／環境變數提供以下值，執行 `node dream-world/tools/ai-proxy.js`。不需建立 `.env` 或金鑰檔。

| 環境變數 | 用途 |
|---|---|
| `DREAM_AI_KEY` | 後端供應器金鑰，必填 |
| `DREAM_PROXY_TOKEN` | 隨機私人 Token，至少 24 字元，必填 |
| `DREAM_AI_MODEL` | 預設 `gpt-4.1-mini`，後端固定模型 |
| `DREAM_AI_BASE_URL` | 預設 `https://api.openai.com/v1/`，僅 HTTPS |
| `DREAM_ALLOWED_ORIGINS` | 逗號分隔 Origin，預設 Pages Origin 與本機 4190 |
| `DREAM_PROXY_PORT` | 預設 4191，只綁 `127.0.0.1` |

本機前端 Base URL 填 `http://127.0.0.1:4191/v1`，金鑰欄填 Proxy Token。遠端使用自己管理的 HTTPS 反向代理連到 loopback，保持 Token 驗證與精確 Origin 白名單，勿直接公開此服務。範例供私人單人使用，有單請求限制、body 上限、逾時、禁止轉址，不記錄請求／金鑰。多人服務另需帳號認證、配額及監控。Pages 連到本機 HTTP 可能受瀏覽器政策限制，遠端使用 HTTPS Proxy。

## 引擎與交易

- `ai-adapters.js`：可替換 `AIProvider.generateScene({system,context})`，正式 HTTP transport、記憶體憑證與測試連線。Story Director 不含廠商 API URL／金鑰／HTTP 規則。
- `story-director.js`：clone 狀態 → Choice Engine 暫存行動／本地外掛效果 → context → Provider → schema 與語意限制 → 新狀態。UI 驗證完整存檔格式與大小後才提交。
- `ai-schema.js`：必填欄位、0–3 個不重複 label／intent、有界文字／數值、成年人物、ID allowlist；拒絕任意效果程式與未知欄位。
- AI 選項可带 `abilityAction:{ability,target}`，由本地 Gimmick Engine 檢查等級／能量／冷卻及意願，再請 AI 描寫後續；`gimmickEvents` 不直接提供任意能力或重複獎勵。
- `intimacyChecks` 由既有 Intimacy Engine 判斷。曖昧、邀約、共鳴有不同門檻；拒絕／朋友界線不能被 AI 清除。成年自願戀愛仍以非露骨形式呈現，並遵守所選模型政策；不強制固定淡出或制式委婉台詞。本次未實作解除非露骨限制。文字語意與選項趣味仍取決於模型品質，程式不能證明所有自然語言完全合規。
- `ai-save.js`：子格式 `ai.version:1`，檢查點僅一層，避免遞迴保存整個歷史。
- `story-engine.js` 保留離線模板、自訂行動、外掛面板與相處事件。Media Engine 保留；AI media 目前只接受 null，未加入影像生成。

## 記憶與世界連續性

每世界獨立保存場景、最近 12 幕完整文字、世界時間、AI 人物、地點、物品／勢力／秘密／事件／能力、任務與伏筆。AI NPC 有 Character Card，可在角色頁查看、相處並保存共同記憶。

超過 12 幕，自動抽取舊幕的回合／類型／地點／人物／行動與前 240 字摘要，保留最近 12 份舊幕摘要。不靠模型重寫歷史。重要事實另存永久 ledger，不因摘要被刪除；人物／物品／能力／任務另有永久表。升級時將舊版長期記憶複製到 ledger；後續離線重要事件也會寫入。

每次提供 WORLD、PLAYER、相關最多 6 人（完整人格、身份、關係、意願）、最近 12 幕、相關最多 40 個重要事實、摘要、未完成任務與伏筆、PACING、TONE。另附人物與世界內容的精簡名冊。近期參與或行動提到的人物優先；承諾、敵人、戀愛、伏筆優先。完整歷史與檢查點不傳給 AI；有界檢索不表示每次將所有永久記憶放入 prompt。

容量：最多 12 世界；每世界 20 位手動角色、100 AI NPC、200 地點、500 世界內容、200 任務、200 伏筆、1,000 重要事實。整份存檔 4 MB。達上限拒絕新回合並提示備份，不悄悄刪除重要記憶。普通舊幕逐字原文會摘要化；重要承諾與結果由永久資料保存。模型若未填入結構欄位，程式不能辨識所有隱含的重要事實。

## 存檔與原功能

仍只使用 `qunxiongDreamWorldSaveV1`，外層 `version:2` 與 worlds 集合相容 V0.1.1。缺少 AI 欄位的舊存檔補資料並保持 offline；原回合、sceneId、數值、角色關係、記憶與世界保留。V0.1 原始 JSON 升級前另作專用 migration backup。匯入完整驗證後再確認取代；不讀寫其他遊戲 key。

AI 模式保留 sceneId 作離線返回位置，但 AI 下一幕不查事件樹。切離線可繼續原模板路線；既有 AI 人物與永久資料保留。離線行動後清除過期 AI 畫面，下次切回重新續寫。切世界、重置、匯入及造物臺會清除不再適用的待生成請求或重寫檢查點。

七種世界、五步建立、四種外掛、Lv.1–5、EXP／能量／冷卻／共鳴／仙元／安全屋／十倍返還／族群繁榮、角色對話等級與原 UI 均保留。世界可個別刪除或重置，匯出涵蓋全部世界。

## 本機開發

```sh
node dream-world/tools/serve.js 4190
node --test dream-world/tests/*.test.js
```

網址 `http://127.0.0.1:4190/dream-world/`，無新增框架或依賴。詳見 `TESTING.md`。

UI 模擬：另跑 `node dream-world/tests/mock-provider.js`，選相容 API，Base URL `http://127.0.0.1:4192/v1`，Model `local-ui-test`，任意測試 Token。回應明確標示本機模擬，不是 AI 推論，不會自動啟用。Model `test-dialogue` 可測無快捷行動連續對話，`test-malformed`／`test-error` 可測錯誤。不要填真實金鑰。

Service Worker 只快取本遊戲靜態檔；POST AI 請求不快取、不重播。更新後重新整理使用新版。原始 `tests/playable-save.json` 保持不動。

GitHub Pages：https://andy5099.github.io/qunxiong-world/dream-world/

## 自由對話與實測限制

提示規則優先回應玩家當下說的話，依人物性格、關係和共同記憶接話；不要求 300–700 字，不重複開場。已移除連續聊天必須插入新事件的拒絕條件，PACING 只是參考。敘事文字供閱讀，人物／記憶／數值仍經原有結構驗證與交易保存。既有三選項存檔仍可讀取，離線玩法保持原樣。

本次真實推論測試模型：**無**。沒有使用私人金鑰或付費額度，OpenRouter 指定模型只核對公開目錄及請求格式；对話品質和成人內容表現均未實測。[OpenRouter 官方快速開始](https://openrouter.ai/docs/quickstart)；[指定模型公開端點](https://openrouter.ai/api/v1/models/cognitivecomputations/dolphin-mistral-24b-venice-edition/endpoints)。不要把本機模擬回應視為模型表現。

上線的靜態前端仍需個人帳戶可用金鑰與額度。未部署具登入、用量限額及伺服器端金鑰管理的後端，**不提供完全免設定、打開即用 AI**。私人 Proxy 範例保留，這些生產後端功能仍需另行部署。
