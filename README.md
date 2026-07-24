# 群雄天下 2.0

一款不需安裝套件的原創三國文字放置 RPG，支援手機與桌面瀏覽器。2.0 採 JSON 資料驅動與 ES6 模組架構，內容可持續擴充。

## 遊玩

以本機靜態伺服器開啟專案根目錄，再瀏覽 `index.html`。使用伺服器是為了讓 JavaScript 模組、PWA 與離線快取正常運作。

自動探索包含遭遇、依速度行動、技能、掉寶、經驗與持續探索循環，可設定補血／回城門檻、背包滿回城、自動出售白裝與自動分解。資料庫包含 12 張地圖、120 位原創武將、320 種技能、520 個成就、48 種怪物、17 名區域／世界頭目與 109 件裝備材料。

## PWA

網站包含 manifest、Service Worker 與 192/512 圖示。以 HTTPS（GitHub Pages）載入一次後，可加入 iPhone 主畫面並在離線時再次開啟。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 保留既有部署流程。Repository Settings → Pages 的 Source 請選擇 **GitHub Actions**；推送至 `master` 或 `main` 後會自動部署。

## 專案結構

- `index.html`、`style.css`：入口與響應式介面
- `src/`：資料載入、狀態、探索戰鬥引擎、介面與入口
- `data/*.json`：怪物、物品、技能、武將、地圖、任務、頭目與成就資料
- `manifest.webmanifest`、`service-worker.js`、`icons/`：PWA 與離線支援
- `.github/workflows/deploy-pages.yml`：GitHub Pages 發布
