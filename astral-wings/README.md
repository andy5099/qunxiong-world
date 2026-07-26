# 星界戰翼

原創單機直向 Canvas 飛行射擊遊戲。操作晨星突擊者穿越「破碎軌道」，閃避彈幕、收集補給並擊敗三階段 Boss「鐵幕吞噬者」。

## 操作

- 手機／滑鼠：按住遊戲區拖曳戰機
- 鍵盤：方向鍵或 WASD
- 空白鍵：星能爆發（能量 100%）
- Esc：暫停

## 已完成功能

自動雙重射擊、三種普通敵機、精英敵機、三階段 Boss、敵方彈幕、護盾、無敵時間、必殺技、補給、分數連擊、暫停、勝敗結算、戰機升級與獨立 LocalStorage 存檔。

## 啟動

```bash
cd astral-wings
python -m http.server 8000
```

開啟 `http://localhost:8000`。部署 GitHub Pages 時請將 `astral-wings/` 設為發佈根目錄；所有資源採相對路徑。

玩家數值在 `js/config.js` 與 `js/entities/player.js`，敵機及 Boss 資料分別在 `js/data/`；波次在 `js/data/stages.js`。
