# 群雄天下

一款不需安裝套件的原創三國文字 RPG。保留角色建立、地圖探索、回合戰鬥、武將招募與編組、背包、裝備、商店、存檔等系統，支援手機與桌面瀏覽器。

## 遊玩

以本機靜態伺服器開啟專案根目錄，再瀏覽 `index.html`。使用伺服器是為了讓 JavaScript 模組、PWA 與離線快取正常運作。

戰鬥可手動操作，也可選擇普通攻擊、破陣擊或疾風突作為自動策略。氣力不足時會自動改用普通攻擊；勝負、玩家死亡、按下停止、頁面背景化或切換畫面都會停止自動戰鬥。

## PWA

網站包含 manifest、Service Worker 與 192/512 圖示。以 HTTPS（GitHub Pages）載入一次後，可加入 iPhone 主畫面並在離線時再次開啟。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 保留既有部署流程。Repository Settings → Pages 的 Source 請選擇 **GitHub Actions**；推送至 `master` 或 `main` 後會自動部署。

## 專案結構

- `index.html`、`style.css`：入口與響應式介面
- `js/`：遊戲、戰鬥、玩家、介面、商店、酒館與存檔邏輯
- `data/`：原創敵人、道具、武將與地圖資料
- `manifest.webmanifest`、`service-worker.js`、`icons/`：PWA 與離線支援
- `.github/workflows/deploy-pages.yml`：GitHub Pages 發布
