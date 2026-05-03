# 美術方向參考（Art Direction Reference）

這份文件收錄的是**風格方向參考圖**，不是最終遊戲素材。
最終素材等另一邊素材規劃文件定稿後，另建 `assets/` 資料夾。

---

## 風格定調：寫實低面數 + 等角視角

**核心關鍵字**：
- Realistic low-poly with PBR textures
- Muted natural earthy palette
- Isometric 30° orthographic angle
- Soft diffused daylight
- Grounded atmospheric mood
- Reference games: Coral Island, Dinkum

**要避免的**：
- ❌ 卡通飽和鮮豔色
- ❌ Pixar / chibi 風格
- ❌ 高飽和紅屋頂、亮綠樹
- ❌ 圓潤 Q 版輪廓

---

## 參考圖清單

### 1. `farm_overview_isometric.png`
**全景等角視角寫實農場** — 最終確定的風格基準，之後所有素材都以這張為準。

內含元素：
- 木造農舍（灰色木瓦屋頂 + 石砌煙囪）
- 雞舍 + 雞群（左上）
- 棕色乳牛 + 木柵欄牧場（右側）
- 約 7×7 菜園格子（南瓜、胡蘿蔔、番茄、高麗菜、草莓）
- 小池塘 + 睡蓮 + 木橋（右下）
- 針葉樹環繞邊緣
- 野花點綴（紅/白/藍）
- 土路連接各區

### 2. `farm_tomato_closeup.png`
**番茄田近拍細節** — 貼圖質感、地面紋理、木材細節的品質基準。

重點：
- 土壤有真實紋理、小石頭、成排犁痕
- 風化木柵欄（木紋、苔蘚、鐵釘）
- 蒲公英、三葉草、小野花混生
- 番茄苗竹竿支架
- 柔和自然光、寫實陰影

### 3. `ref_cow_black.png`
**黑色乳牛**（AI 生成，白色乾淨背景）— 可直接當作動物精靈素材使用。

**重要素材規範**（user 強調）：
- ✅ 所有角色/動物/作物/工具素材：**白色或透明背景**
- ❌ 不要帶複雜場景背景（省掉後期去背工序）
- 例外：場景/背景類素材（如 `farm_overview_isometric.png`）保留完整環境

這隻牛之後要做的處理：
- 調整風格使其與場景底圖一致（色調、對比、質感）
- 等角視角適配（若需要側面/斜側視角）
- 可能製作多個方向或動畫幀

---

## 使用方式

1. **開發中**：程式碼裡渲染出來的畫面，需跟這些參考對比檢查風格一致性
2. **生新素材時**：Prompt 要包含「in the style of farm_overview_isometric reference」這種指令
3. **做技術決策時**：遇到「要不要加某視覺效果」的判斷，以這三張的感覺為錨點

---

## 如何存這些圖進來（給 Kevin）

1. 回到這個聊天，右鍵點擊每張圖 → 另存新檔
2. 存到 `C:\Users\kevin\Desktop\Farm game\reference\`
3. 用以下檔名：
   - 全景農場圖 → `farm_overview_isometric.png`
   - 番茄近拍圖 → `farm_tomato_closeup.png`
   - 黑牛參考圖 → `ref_cow_black.png`
4. 存好告訴我一聲，我確認檔案有到位就可以繼續
