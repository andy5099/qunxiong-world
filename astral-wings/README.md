# 星界戰翼（Astral Wings）

原創單機直向星際射擊網頁遊戲。以 HTML5 Canvas、Vanilla JavaScript 與 LocalStorage 製作，不需要帳號、伺服器或外部套件。

## 功能

- 六個順序解鎖的主線星域與六隻原創三階段 Boss。
- 固定波次、精英、補給、火力 Lv1～Lv5、必殺技與暫時 Buff。
- 戰機等級、星級、裝備、強化、分解、合成、合體、覺醒與進化。
- 無盡航線、Boss 挑戰、每日任務、成就與星域圖鑑。
- 原創 AI 機體視覺圖：`assets/images/astral-ai-craft-roster.png`。

## 操作

- 手機：按住並拖曳遊戲區任意位置。
- 電腦：滑鼠拖曳、方向鍵或 WASD。
- 空白鍵：星能爆發；Esc：暫停。

## 本機啟動

```powershell
cd astral-wings
python -m http.server 8000
```

開啟 `http://localhost:8000`。

## GitHub Pages

所有路徑均為相對路徑。部署 repository 根目錄後，使用：

`https://<帳號>.github.io/<repository>/astral-wings/`

## 存檔

使用 `astralWingsSaveV1`。讀取舊版存檔時會補上關卡解鎖與通關紀錄欄位，且保留既有金幣、最高分、戰機等級、星級與裝備。
