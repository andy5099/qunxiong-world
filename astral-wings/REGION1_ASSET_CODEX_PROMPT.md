# Codex：整合 Astral World 第一區正式素材包

Repository：`andy5099/qunxiong-world`
Project：`astral-wings`
Base Commit：`e6cf15176f56bae7ffeaeec1e2090bffbdbe716d`

本素材包已提供可直接使用的獨立 WebP：

- 第一區 1920×1080 背景
- 星刃使 idle / move / attack / skill / hurt / death 動作列
- 星芽史萊姆、月耳兔、星甲蟲各五種動作列
- 王冠巨獸 idle / attack / rage / hurt / death
- 寵物星芽史萊姆 summon / idle / attack / return / celebrate
- 四個 256×256 技能圖示
- Battle HUD、Boss 血條、按鈕、狀態條、背包格與功能圖示組

完整路徑與實際尺寸位於：
`ASSET_MANIFEST.json`

## 本次唯一目標

將這批圖片實際接入第一區，取代目前舊的單幀裁切素材與幾何 fallback。

## 要求

1. 不再建立概念圖、規格文件或 placeholder。
2. 直接使用本包內的 WebP。
3. 動作列包含多個姿勢，請依實際圖片寬度自動偵測或設定切格。
4. 若某一列的格距不完全一致，先使用 object-position / source rectangle 精準取格，不得把整列一次顯示在戰場。
5. 背景使用 `backgrounds/region-01/battle.webp`，cover + center。
6. 四技能圖示直接替換目前 SVG 或舊圖。
7. Battle HUD、Boss bar 與按鈕素材接入現有 DOM。
8. 保持現有戰鬥、存檔、寵物與隊伍系統不變。
9. 手機 390px 不溢出。
10. Service Worker 更新快取。
11. 執行所有測試並 Push。

## 驗收

- 主角各動作能切換，不顯示整張動作列。
- 三隻怪物各動作能切換。
- Boss 狂暴、受傷與死亡可區分。
- 寵物召喚、攻擊、返回可區分。
- 背景、技能圖示、HUD 與 Boss 血條均使用本包素材。
- 不再看到舊幾何主體。
- Console 無 Error。
- GitHub Pages 正常。

Commit message：
`feat: integrate complete region one asset library`

完成後回報 Commit SHA 與尚未驗證項目。
