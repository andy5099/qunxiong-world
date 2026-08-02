# Codex 最終交付任務：整合 Astral World 第一區美術

Repository：
`andy5099/qunxiong-world`

Project：
`astral-wings`

Base Commit：
`727c2b8dc67ad0274d7e2bff933779ba80364b57`

本次已提供完整參考素材：

- `assets/reference/astral-world-final-art-sheet.png`
- `assets/reference/astral-world-full-asset-guide.png`
- `assets/reference/astral-world-master-art-guide.png`
- `assets/reference/astral-world-sprite-guide.png`
- `assets/reference/astral-world-region1-production-guide.png`
- `assets/reference/astral-world-ui-target.png`
- `assets/reference/astral-world-art-bible.png`

# 本次目標

不要再新增任何：
- Manifest
- Placeholder
- Fallback
- 驗證器
- 素材規格文件
- 新資料夾
- 新接口

本次只做一件事：

> 將已提供的美術內容整理成可用的正式遊戲素材，並接入第一區。

# 重要限制

參考圖是美術來源與方向，不可直接整張當遊戲背景，也不可簡單裁切後假裝完成所有動畫。

但可以在確保品質可接受的前提下，從參考圖中整理：
- 背景
- 技能圖示
- UI 面板
- HUD
- 怪物單幀圖
- Boss 單幀圖
- 寵物單幀圖
- 主角單幀圖

如果無法產出真正多幀動畫，請先改為：
- 高品質單幀角色
- 單幀怪物
- 單幀 Boss
- 單幀寵物
- CSS / Canvas 僅負責位置、縮放、淡入淡出與受擊震動

不要再用低品質幾何圖形。

# 優先交付

1. 第一區背景
2. 主角單幀正式立繪
3. 星芽史萊姆正式圖
4. 月耳兔正式圖
5. 星甲蟲正式圖
6. 王冠巨獸正式圖
7. 星芽史萊姆寵物正式圖
8. 四個技能正式圖示
9. 戰鬥 HUD
10. Boss 血條與按鈕框

# 建議正式檔案

```text
assets/game-art/backgrounds/region-01/battle.webp
assets/game-art/characters/astral-blade/idle.webp
assets/game-art/monsters/region-01/star-slime.webp
assets/game-art/monsters/region-01/moon-rabbit.webp
assets/game-art/monsters/region-01/star-beetle.webp
assets/game-art/bosses/region-01/crowned-beast.webp
assets/game-art/pets/region-01/star-slime.webp
assets/game-art/skills/player/star-blade.webp
assets/game-art/skills/player/meteor-combo.webp
assets/game-art/skills/player/star-burst.webp
assets/game-art/skills/player/astral-shield.webp
assets/game-art/ui/battle-hud.webp
assets/game-art/ui/boss-bar-frame.webp
assets/game-art/ui/button-primary.webp
```

# 整合要求

- 正式圖片存在時必須優先使用。
- 第一區背景必須關閉幾何背景層。
- 主角與怪物正式圖存在時必須關閉幾何主體。
- 技能圖示正式圖存在時必須關閉 SVG fallback。
- 390px 手機寬度正常。
- GitHub Pages 可載入。
- Console 無 Error。
- 不改遊戲玩法。

# 驗收

只有下列全部達成才可宣稱完成：

- 第一區背景已顯示正式圖。
- 主角不再是幾何圖形。
- 三隻普通怪物不再是幾何圖形。
- 王冠巨獸不再是幾何圖形。
- 寵物不再是幾何圖形。
- 四技能圖示已替換。
- HUD 與 Boss 血條已替換。
- GitHub Pages 正常。
- Console 無 Error。

# 完成後回報

1. 實際建立的圖片檔。
2. 每張圖片來源與處理方式。
3. 哪些仍為單幀。
4. 哪些已可播放動畫。
5. 修改檔案。
6. GitHub Pages 測試。
7. Console 測試。
8. 尚未完成項目。
9. Commit SHA。

Commit message：
`feat: integrate final region one art assets`
