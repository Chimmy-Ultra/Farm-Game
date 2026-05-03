# 商品清單統一報告 Commodity List Reconciliation

> 產出日期：2026-04-24
> 目的：將三份設計文件（`environmental-systems.md` / `asset-prompts.md` / `economic-model.md`）的商品清單對齊到使用者 2026-04-24 核可的 29 項 SSOT，並記錄偏差、修正與待決定候選。
> SSOT 檔案：`src/data/commodities.ts`

---

## 1. 核可的 29 項 SSOT 清單

| # | id | 中文 | 英文 | 分類 | 交易所 / Symbol |
|---|----|-----|-----|-----|----------------|
| 1 | `corn` | 玉米 | Corn | grain | CBOT / ZC |
| 2 | `wheat_hrw` | 硬紅冬麥 | Hard Red Winter Wheat | grain | KCBT / KW |
| 3 | `wheat_srw` | 軟紅冬麥 | Soft Red Winter Wheat | grain | CBOT / ZW |
| 4 | `wheat_hrs` | 硬紅春麥 | Hard Red Spring Wheat | grain | MGEX / MW |
| 5 | `wheat_durum` | 杜蘭麥 | Durum Wheat | grain | MGEX / DW |
| 6 | `rice` | 稻米 | Rough Rice | grain | CBOT / ZR |
| 7 | `oats` | 燕麥 | Oats | grain | CBOT / ZO |
| 8 | `soybean` | 大豆 | Soybean | oilseed | CBOT / ZS |
| 9 | `canola` | 菜籽 | Canola | oilseed | ICE Canada / RS |
| 10 | `palm_oil` | 棕櫚油 | Palm Oil | oilseed | Bursa MDEX / FCPO |
| 11 | `coffee_arabica` | 阿拉比卡咖啡 | Arabica Coffee | soft | ICE US / KC |
| 12 | `coffee_robusta` | 羅布斯塔咖啡 | Robusta Coffee | soft | ICE London / RC |
| 13 | `cocoa` | 可可 | Cocoa | soft | ICE US / CC |
| 14 | `sugar` | 糖（甘蔗） | Sugar (Cane) | soft | ICE US / SB |
| 15 | `orange_juice` | 柳橙 | Orange Juice | soft | ICE US / OJ |
| 16 | `feeder_cattle` | 飼料牛 | Feeder Cattle | livestock | CME / GF |
| 17 | `live_cattle` | 肉牛 | Live Cattle | livestock | CME / LE |
| 18 | `lean_hogs` | 瘦肉豬 | Lean Hogs | livestock | CME / HE |
| 19 | `milk_class_iii` | Class III 牛奶 | Class III Milk | dairy | CME / DC |
| 20 | `butter` | 奶油 | Butter | dairy | CME / CB |
| 21 | `cheese` | 起司 | Cheese | dairy | CME / CSC |
| 22 | `nfdm` | 脫脂奶粉 | Nonfat Dry Milk | dairy | CME / GNF |
| 23 | `cotton` | 棉花 | Cotton | industrial | ICE US / CT |
| 24 | `rubber` | 橡膠 | Rubber | industrial | TOCOM / SHFE |
| 25 | `lumber` | 木材 | Lumber | industrial | CME / LBR |
| 26 | `azuki_bean` | 紅豆 | Azuki Bean | asian | TOCOM |
| 27 | `apple` | 蘋果 | Apple | asian | Zhengzhou / AP |
| 28 | `egg` | 雞蛋 | Egg (from Laying Hen) | asian | Dalian / JD |
| 29 | `peanut` | 花生 | Peanut | asian | Dalian / PK |

**分類小計**：穀物 7 + 油籽 3 + 軟商品 5 + 畜產 3 + 乳製品 4 + 工業 3 + 亞洲特色 4 = **29**

> 使用者備註：「28 是筆誤」——核可清單實際含 29 項；原因是飼料牛 → 肉牛為兩個獨立合約各佔一項，而蛋雞與雞蛋合計為一項（蛋雞是產出來源，雞蛋是期貨合約標的）。

---

## 2. 各文件修正對照

### 2.1 `docs/environmental-systems.md`

| 項目 | 原本 | 狀態 | 修正 |
|------|------|------|------|
| 多出：菸草 Tobacco | 3.4 播種窗口、4.4.3 衝擊矩陣 | ❌ 移除 | 已刪除兩處 |
| 多出：茶 Tea | 3.5 多年生表、4.4.3 衝擊矩陣 | ❌ 移除 | 已刪除 |
| 多出：葵花籽 Sunflower | 3.4 播種窗口、4.4.2 衝擊矩陣 | ❌ 移除 | 已刪除 |
| 多出：蠶絲 Silk | 3.6 合約月、4.4.6 亞洲矩陣 | ❌ 移除 | 已刪除 |
| 多出：大麥 Barley | 3.4 播種窗口 | ❌ 移除 | 已刪除 |
| 多出：馬鈴薯 Potato | 3.4 | ❌ 移除 | 已刪除 |
| 多出：番茄 Tomato | 3.4 | ❌ 移除 | 已刪除 |
| 多出：葡萄 Grape | 3.5 | ❌ 移除 | 已刪除 |
| 多出：稻米 Japonica 另列 | 4.4.6 亞洲矩陣 | ❌ 移除 | 合併至 `rice` |
| 缺少：杜蘭麥 `wheat_durum` | 4.4.1 穀物矩陣 | ⚠️ 補上 | 新增列與數值 |
| 缺少：紅豆 `azuki_bean` | 4.4.6 亞洲矩陣 | ⚠️ 補上 | 新增列與數值 |
| 缺少：蘋果 `apple` | 4.4.6 亞洲矩陣 | ⚠️ 補上 | 新增列與數值 |
| 缺少：雞蛋 `egg` | 4.4.6 亞洲矩陣 | ⚠️ 補上 | 新增列與備註（蛋雞來源） |
| 缺少：花生 `peanut` | 4.4.6 亞洲矩陣（原在 4.4.2 油籽） | ⚠️ 搬移 | 已移至亞洲分類 |
| 缺少：脫脂奶粉 `nfdm` | 4.4.4 乳製品矩陣 | ⚠️ 補上 | 新增列與數值 |
| 欄位名：`coffee_arab` → `coffee_arabica` | 4.7 區域、4.6 彩蛋 | ⚠️ 改名 | 已替換 |
| 欄位名：`coffee_rob` → `coffee_robusta` | 4.7 區域 | ⚠️ 改名 | 已替換 |
| 欄位名：`wheat_chi` → `wheat_srw`, `wheat_kc` → `wheat_hrw`, `wheat_mne` → `wheat_hrs` | 3.6、4.6 彩蛋 | ⚠️ 改名 | 已替換 |
| 欄位名：`oj` → `orange_juice`, `sugar_11` → `sugar` | 4.7、4.6 | ⚠️ 改名 | 已替換 |
| 欄位名：`cattle_live` → `live_cattle`, `cattle_feed` → `feeder_cattle`, `hogs_lean` → `lean_hogs` | 3.6 | ⚠️ 改名 | 已替換 |
| 欄位名：`milk_classIII` → `milk_class_iii` | 3.6 | ⚠️ 改名 | 已替換 |
| 區域 `id_cocoa` 不存在於 Region enum | 4.7 | ❌ 移除 | 可可 secondary 只留 `br_south` |
| 提及「28 商品」 | 多處 | ⚠️ 更新 | 改為 29 商品並註明 SSOT |
| 提及「剩餘 20 商品」 | 附註 | ⚠️ 更新 | 改為 21 商品 |

已新增文件頂部 SSOT 聲明：
> 本文件商品清單以 `src/data/commodities.ts` 為準，如有不一致以該檔為主。共 29 項核可商品。

### 2.2 `docs/asset-prompts.md`

| 項目 | 狀態 | 備註 |
|------|------|------|
| 25 個主品項（1-25） | ✅ 已覆蓋全部 29 SSOT | 飼料牛/肉牛合併於 #16 的 4 階段 / 乳製品以乳牛 #18 + 加工衍生品章節的牛奶/奶油/起司/脫脂奶粉 |
| 穀物 1-7 | ✅ 齊 | Corn, HRW, SRW, HRS, Durum, Rice, Oats |
| 油籽 8-10 | ✅ 齊 | Soybean, Canola, Palm Oil |
| 軟商品 11-15 | ✅ 齊 | Arabica, Robusta, Cocoa, Sugarcane, Orange |
| 畜產 16-17 | ✅ 齊 | #16 飼料牛→肉牛 的 4 階段同時涵蓋 feeder_cattle 與 live_cattle；#17 瘦肉豬 |
| 乳製品 18 + 加工品 | ✅ 齊 | 乳牛本身分 4 階段；加工章節含 Milk / Butter / Cheese / NFDM 單狀態 prompt |
| 工業 19-21 | ✅ 齊 | Cotton, Rubber, Lumber |
| 亞洲 22-25 | ✅ 齊 | Azuki, Apple, Laying Hen (產雞蛋用), Peanut |
| 已刪內容 | — | 無；本文件原本就不含菸草/茶/葵花籽/蠶絲 prompt |

已新增文件頂部 SSOT 聲明 + 覆蓋對照說明，**未改動任何 prompt 內容**（素材已齊）。

**未來決策提示**：若想要「雞蛋 Egg」的加工品 prompt（如盒裝蛋），可另外在加工衍生品章節補上。但遊戲裡雞蛋通常已是產品本身，不需進一步加工視覺。

### 2.3 `docs/economic-model.md`

| 項目 | 原本 | 狀態 | 修正 |
|------|------|------|------|
| 合約表總項數 | 28（但內容偏離 SSOT） | ⚠️ 大改 | 更新為 29 項，與 SSOT id 一致 |
| 多出：`SOYBEAN_OIL` 大豆油 | 5.2 表 | ❌ 移除 | 不在 SSOT（列入加工衍生品，不是獨立合約） |
| 多出：`SOYBEAN_MEAL` 大豆粕 | 5.2 表、4.6 彩蛋 priceShock | ❌ 移除 | 同上 |
| 多出：`SUNFLOWER` 葵花籽 | 5.2 表 | ❌ 移除 | 不在 SSOT |
| 多出：`CHICKEN` 雞肉 | 5.2 表 | ❌ 移除 | SSOT 用 `egg`（蛋雞線），不含肉雞 |
| 多出：`WHEY` 乳清 | 5.2 表 | ❌ 移除 | SSOT 改用 `nfdm` |
| 多出：`CRUDE_OIL` 原油 | 5.2 表 | ❌ 移除 | 不在 SSOT（非農產品） |
| 多出：`NATURAL_GAS` 天然氣 | 5.2 表 | ❌ 移除 | 同上 |
| 多出：`UREA` 尿素 | 5.2 表 | ❌ 移除 | 同上 |
| 多出：`POTASH` 鉀肥 | 5.2 表 | ❌ 移除 | 同上 |
| 多出：`GOLD` 黃金 | 5.2 表 | ❌ 移除 | 同上 |
| 多出：`SILVER` 白銀 | 5.2 表 | ❌ 移除 | 同上 |
| 缺少：`wheat_hrs` 硬紅春麥 | 5.2 表 | ⚠️ 補上 | MGEX MW |
| 缺少：`wheat_durum` 杜蘭麥 | 5.2 表 | ⚠️ 補上 | MGEX DW（低流動性，保證金估算值） |
| 缺少：`palm_oil` 棕櫚油 | 5.2 表 | ⚠️ 補上 | Bursa MDEX FCPO |
| 缺少：`coffee_robusta` 羅布斯塔咖啡 | 5.2 表 | ⚠️ 補上 | ICE London RC |
| 缺少：`feeder_cattle` 飼料牛 | 5.2 表（只有 live_cattle 和錯誤 "肥牛"） | ⚠️ 補上 / 修正 | CME GF；原文件把 feeder 寫成「肥牛」，已改回「飼料牛」 |
| 缺少：`nfdm` 脫脂奶粉 | 5.2 表 | ⚠️ 補上 | CME GNF |
| 缺少：`rubber` 橡膠 | 5.2 表 | ⚠️ 補上 | TOCOM/SHFE（JPY 換算保證金為估值） |
| 缺少：`lumber` 木材 | 5.2 表 | ⚠️ 補上 | CME LBR |
| 缺少：`azuki_bean` 紅豆 | 5.2 表 | ⚠️ 補上 | TOCOM |
| 缺少：`apple` 蘋果 | 5.2 表 | ⚠️ 補上 | 鄭州 AP |
| 缺少：`egg` 雞蛋 | 5.2 表 | ⚠️ 補上 | 大連 JD |
| 缺少：`peanut` 花生 | 5.2 表 | ⚠️ 補上 | 大連 PK |
| CommodityId 大小寫 | 全部大寫（CORN） | ⚠️ 改為 snake_case | 改為 `corn`，與 SSOT `CommodityId` 型別一致 |
| 提及「28 商品」/ 「CONTRACT_SPECS[28]」 | §1.5、附錄 B | ⚠️ 更新 | 改為 29 |

已新增文件頂部 SSOT 聲明。已更新 5.1 分類節（原 7 分類偏離 SSOT，含能源/貴金屬）至 SSOT 7 分類。已更新 5.3 參考價表。

**留下的 TODO 標記**：
- 亞洲合約（rubber / azuki_bean / apple / egg / peanut）的保證金與 tickValue 是估算值，正式實作時需以交易所官方規格（TOCOM / ZCE / DCE）覆核。
- 杜蘭麥（wheat_durum）期貨流動性極低，現實世界更多以現貨交易；遊戲中保留合約但可考慮設「冷門合約」屬性（成交量 × 0.3）。

---

## 3. 需使用者決定的候選（暫不加入，紀錄備查）

以下商品在上一版 docs 出現但已從 SSOT 移除。它們在現實中確實存在真實期貨或場外市場，未來若想擴充遊戲可從這裡挑：

| 候選 | 真實期貨嗎？ | 移除原因 | 加回的利弊 |
|------|-----------|---------|-----------|
| 茶 Tea | ❌ 無標準期貨（僅斯里蘭卡 / 肯亞拍賣） | 不在核可清單 | 利：亞洲文化；弊：無真實期貨可參照，數值全需自訂 |
| 菸草 Tobacco | ⚠️ 有場外遠期，無標準期貨 | 使用者明確排除（社會責任考量） | 利：真實農業經濟作物；弊：健康議題，遊戲調性不合 |
| 葵花籽 Sunflower | ❌ 無主流美國期貨（有 Budapest Stock Exchange 葵花油合約） | 不在核可清單 | 利：油籽多樣性；弊：與 canola / soybean 功能重複 |
| 蠶絲 Silk | ❌ 無標準期貨 | 不在核可清單 | 利：中/日特色；弊：純自訂數值，教學價值低 |
| 大豆油 Soybean Oil | ✅ CBOT ZL 真實期貨 | 改用加工衍生品概念（不開獨立合約） | 可考慮重新加入作為「加工衍生期貨」DLC |
| 大豆粕 Soybean Meal | ✅ CBOT ZM 真實期貨 | 同上 | 同上 |
| 雞肉 Chicken | ❌ 無主流期貨（舊 CME Broilers 已下架） | 蛋雞路線足夠 | 不建議加回 |
| 乳清 Whey | ✅ CME DY | 改用 NFDM 代表粉狀乳製品 | 可重複乳製品矩陣，不建議加回 |
| 原油 / 天然氣 / 尿素 / 鉀肥 | ✅ NYMEX / CME | 非農產品（屬於投入品） | 可作為「成本端對沖」DLC：農民實際上真的會對沖柴油與肥料 |
| 黃金 / 白銀 | ✅ COMEX | 金融避險工具 | 可作為「投資組合多角化」DLC |

**建議給使用者的決策流程**：上述任何一項要加回 SSOT 時，需同時更新：
1. `src/data/commodities.ts` 的 `COMMODITY_IDS` 與 `COMMODITIES`
2. `docs/environmental-systems.md` 的 4.4 衝擊矩陣
3. `docs/asset-prompts.md` 的 prompt 章節
4. `docs/economic-model.md` 的 5.2/5.3 表

---

## 4. 未解決 / 留待實作期確認的問題

1. **蛋雞與雞蛋的資料結構對應**：遊戲內玩家「養蛋雞」會產出「雞蛋」商品；建議在 `src/data/animals.ts`（未來新檔）定義 `LayingHen` 實體，`produces: 'egg'` 欄位指回 SSOT。本次不動到這層。
2. **橡膠定價單位**：TOCOM 用 JPY/kg、SHFE 用 CNY/ton。SSOT 目前以 USD/kg 表示，遊戲內若要顯示真實交易所 UI 需做單位轉換層。已在 SSOT 註釋說明。
3. **杜蘭麥期貨流動性**：真實世界成交量很低，玩家若想交易可能會面臨 "illiquid" 情境；建議之後為 `wheat_durum` 加 `liquidityTier: 'low'` 欄位，對 spread/slippage 另有懲罰。
4. **甘蔗 vs 糖 `sugar`**：SSOT 的 `sugar` 是 ICE SB（原糖期貨），素材是甘蔗 Sugarcane（作物）。概念上一致：種甘蔗→煉糖→對應 SB 合約。已在文件內標示。
5. **Lumber 合約單位**：2022 CME 小改規模從 110,000 bd-ft → 27,500 bd-ft（micro contract）。SSOT 採用新制 27,500。
6. **Apple / Egg / Peanut 的歐美玩家文化隔閡**：鄭州蘋果、大連雞蛋、大連花生對西方玩家陌生。未來 UI 可加「亞洲期貨市場介紹」教學。

---

## 5. 檔案連動狀態（更新後）

| 檔案 | 清單一致？ | SSOT 聲明？ |
|------|---------|-----------|
| `src/data/commodities.ts` | ✅ 29 項（此即 SSOT） | — |
| `docs/environmental-systems.md` | ✅ 對齊 29 | ✅ 已加頂部聲明 |
| `docs/asset-prompts.md` | ✅ 對齊 29 | ✅ 已加頂部聲明 |
| `docs/economic-model.md` | ✅ 對齊 29 | ✅ 已加頂部聲明 |
| `docs/commodity-list-reconciliation.md`（本檔） | ✅ 記錄差異 | — |

— 文件結束 —
