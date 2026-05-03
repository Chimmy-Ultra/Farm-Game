# 環境系統規劃：土壤 / 季節 / 天氣

> **商品清單 SSOT 聲明**：本文件商品清單以 `src/data/commodities.ts` 為準，如有不一致以該檔為主。共 29 項核可商品。
>
> 本文件定義《Farm Futures》（暫稱）農場遊戲中三個核心環境系統的資料結構、遊戲規則、視覺呈現與期貨連動。
>
> **技術棧**：TypeScript + Vite + React + R3F (React Three Fiber) + Three.js + Zustand + Zod
> **渲染風格**：2.5D 等距（Isometric）寫實風
> **存檔**：localStorage（無後端）
> **文件版本**：v1.1
> **最後更新**：2026-04-24

---

## 目錄

1. [概述：三系統的關係與分離原則](#1-概述三系統的關係與分離原則)
2. [系統 1：土壤 Soil System](#2-系統-1土壤-soil-system)
3. [系統 2：季節 Season System](#3-系統-2季節-season-system)
4. [系統 3：天氣 Weather System](#4-系統-3天氣-weather-system)
5. [資料結構總表（TypeScript + Zod）](#5-資料結構總表typescript--zod)
6. [期貨價格連動機制](#6-期貨價格連動機制)
7. [附錄：真實世界參照表](#7-附錄真實世界參照表)

---

## 1. 概述：三系統的關係與分離原則

### 1.1 為何拆成三個獨立系統

在傳統農場遊戲裡，「作物 tile」通常同時背負了土壤類型、濕度、天氣、季節等所有狀態。這會讓素材爆炸（同一株玉米要 × 4 季 × 10 天氣 × 6 土壤 = 240 變體），也讓期貨模擬無法獨立建模。

本專案把這三者拆成 **場景層（Scene Layer）**，作為獨立的世界狀態：

```
┌──────────────────────────────────────────────┐
│  素材層 (Asset Layer)                         │
│  單一品種玉米 / 咖啡 / 棕櫚 — 乾淨的 GLB     │
└──────────────────────────────────────────────┘
                       ▲
                       │ 即時合成
                       │
┌──────────────────────────────────────────────┐
│  場景層 (Scene Layer)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │ 土壤    │ │ 季節    │ │ 天氣    │         │
│  │ Soil    │ │ Season  │ │ Weather │         │
│  └─────────┘ └─────────┘ └─────────┘         │
└──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  期貨市場 (Futures Market)                    │
│  供需模型 / 合約月份 / 價格發現                │
└──────────────────────────────────────────────┘
```

**好處：**

- **素材乾淨**：一株玉米只是一株玉米，不用預烘 N 種變體
- **視覺即時合成**：土壤貼圖 + 季節光照 + 天氣特效在 Runtime 疊加
- **數值可獨立調整**：不用動美術資產就能調整天氣敏感度
- **期貨連動清晰**：三系統各自對產量/價格貢獻獨立倍率

### 1.2 三系統的作用域

| 系統 | 空間範圍 | 時間尺度 | 玩家可改變 |
|------|---------|---------|-----------|
| 土壤 | 每個 tile | 數週～數年 | 是（施肥、輪作、休耕） |
| 季節 | 整個世界 | 固定週期 | 否（純時間推進） |
| 天氣 | 區域性（產地 / 玩家農場） | 數小時～數週 | 部分（避災設施） |

### 1.3 三者相互關係

- **季節 → 天氣**：季節決定天氣的 *機率分布*（冬天下雪、夏天熱浪）
- **季節 → 土壤**：休耕季節土壤自然回復
- **天氣 → 土壤**：雨改變濕度、乾旱降低濕度、霜凍影響微生物活性
- **土壤 + 天氣 → 作物**：產量由 base × soilFactor × weatherFactor × seasonFactor 計算
- **任一層 → 期貨**：全球產地發生事件 → 該商品合約跳動

### 1.4 時間壓縮總覽

```
1 現實秒   = 1 遊戲分鐘
1 現實分鐘 = 1 遊戲小時
1 現實日   = 1 遊戲週
1 現實週   = 1 遊戲季（~12.96 天）
52 現實週  = 1 遊戲年
52 現實分鐘 = 1 遊戲年（快轉模式）
```

每個遊戲季節 = 30 天（為了數值整齊），一年 = 120 天，但換算到現實約 1 季 = 13 天 / 1 年 = 52 天。

---

## 2. 系統 1：土壤 Soil System

### 2.1 設計目標

- 讓「地理差異」變成策略選擇（為什麼巴西種咖啡、越南種稻？）
- 讓長期經營有深度（連作傷地、輪作養地、休耕回復）
- 對 R3F 只暴露 *shader 參數*，不用換模型

### 2.2 土壤類型表

| 代碼 | 名稱 | 排水 | N-P-K 基準 | pH | 適合作物 | 地理典型 |
|------|------|------|-----------|-----|---------|---------|
| `loam` | 壤土 | 0.55 | 50 / 40 / 45 | 6.5 | 萬用：玉米、小麥、大豆、蔬菜 | 美國中西部玉米帶、法國 Beauce |
| `sandy` | 砂土 | 0.85 | 20 / 15 / 20 | 6.0 | 花生、地瓜、西瓜、根莖類 | 美國喬治亞州、中國東北部 |
| `clay` | 黏土 | 0.20 | 45 / 30 / 55 | 6.8 | 稻米、蓮藕、小麥（排水改良後） | 亞洲稻作帶、泰國中部 |
| `volcanic` | 火山灰 | 0.60 | 60 / 80 / 70 | 5.3 | 咖啡、可可、茶、香蕉 | 巴西 Cerrado、印尼爪哇、哥倫比亞 |
| `humus` | 腐殖土 | 0.50 | 90 / 70 / 85 | 6.7 | 短期高產：蔬菜、草莓、菸草 | 烏克蘭黑土帶、美國愛荷華 |
| `saline` | 鹽土 | 0.35 | 15 / 10 / 25 | 8.2 | 僅耐鹽品種：藜麥、海甘藍、棉花（部分） | 印度西北、澳洲內陸 |
| `peat` | 泥炭土 | 0.15 | 70 / 20 / 30 | 4.5 | 藍莓、蔓越莓、部分草本 | 加拿大、北歐、印尼泥炭森林 |

> `fertility` 不是獨立欄位，而是由 N-P-K 和 pH 加權推導（見 6.1）。

### 2.3 土壤資料結構（摘要）

完整 Zod schema 見第 5 節。每個 tile 持有：

```typescript
interface SoilTile {
  id: string;
  coord: { x: number; y: number };
  type: SoilType;
  ph: number;               // 4.0 ~ 9.0
  npk: { n: number; p: number; k: number }; // 各 0 ~ 100
  moisture: number;         // 0 ~ 1
  drainage: number;         // 0 ~ 1 (由 type 決定基準，可微調)
  organicMatter: number;    // 0 ~ 1 (腐殖質含量，影響長期肥力)
  salinity: number;         // 0 ~ 1 (鹽分)
  compaction: number;       // 0 ~ 1 (壓實度，太高會阻礙根系)
  lastCropId?: CommodityId;
  consecutiveSeasonsSameCrop: number;  // 連作季數
  fallowSeasons: number;    // 已休耕季數
}
```

### 2.4 遊戲規則

#### 2.4.1 種植消耗

每季種植 1 作物，消耗 N-P-K：

| 作物類別 | N 消耗 | P 消耗 | K 消耗 |
|---------|-------|-------|-------|
| 重氮作物（玉米、小麥） | 15 | 5 | 8 |
| 豆科（大豆、花生） | **+8**（固氮） | 6 | 10 |
| 油籽（菜籽、葵花） | 12 | 8 | 10 |
| 根莖（甘薯、馬鈴薯） | 10 | 12 | 15 |
| 多年生（咖啡、可可） | 6 | 4 | 8 / 年 |

#### 2.4.2 連作傷害

`consecutiveSeasonsSameCrop >= 3` 時：
- 產量懲罰：-5% × (n - 2)
- 病蟲害機率 +15% / 額外季
- 土壤 `organicMatter` 加速下降

#### 2.4.3 休耕恢復

`state = fallow`：
- N 每季 +5（豆科覆蓋作物可 +12）
- `organicMatter` 每季 +0.05
- `compaction` 每季 -0.03
- pH 向 6.5 漂移（自然緩衝）

#### 2.4.4 施肥

三種肥料，分別補 N / P / K。**過度施肥**：
- 鹽分累積（`salinity` +0.02 / 次）
- 水體污染（未來 mechanic：影響下游 tile 的魚獲 / 地下水）

#### 2.4.5 土壤檢測（付費）

玩家付 $200 即可看到完整的 SoilTile 欄位，否則只看到粗略的「好/普通/差」評級。

#### 2.4.6 改良

| 行動 | 效果 | 成本 |
|------|------|------|
| 石灰 Liming | pH +0.3 | $80 |
| 硫磺 Sulfur | pH -0.3 | $80 |
| 堆肥 Compost | organicMatter +0.1, N+10 | $120 |
| 耕鬆 Tilling | compaction -0.2 | $60 |
| 排水溝 Drainage | drainage +0.15（永久） | $800（一次性） |
| 鹽分改良 Gypsum | salinity -0.15 | $200 |

### 2.5 視覺呈現（R3F）

每個 tile 一個 `<Instance>` in `<Instances>` group，共用同一個 `MeshStandardMaterial`，但依土壤類型切換 texture：

```typescript
// 偽代碼
const SOIL_TEXTURES: Record<SoilType, SoilTextureSet> = {
  loam:     { albedo: '/tex/soil_loam_albedo.ktx2',    normal: '...', roughness: '...' },
  sandy:    { albedo: '/tex/soil_sandy_albedo.ktx2',   normal: '...', roughness: '...' },
  clay:     { albedo: '/tex/soil_clay_albedo.ktx2',    normal: '...', roughness: '...' },
  volcanic: { albedo: '/tex/soil_volcanic_albedo.ktx2',normal: '...', roughness: '...' },
  humus:    { albedo: '/tex/soil_humus_albedo.ktx2',   normal: '...', roughness: '...' },
  saline:   { albedo: '/tex/soil_saline_albedo.ktx2',  normal: '...', roughness: '...' },
  peat:     { albedo: '/tex/soil_peat_albedo.ktx2',    normal: '...', roughness: '...' },
};
```

**動態 shader uniforms**：
- `uMoisture`（0~1）：濕度越高，albedo 混入深色 `#3a2a18`，roughness -0.15
- `uSalinity`：表面疊加白色鹽霜 noise
- `uCompaction`：normal map 強度 ×(1 - compaction)，讓高度更平
- `uFertility`：低肥力時略降飽和度

所有參數透過 `onBeforeCompile` 注入，避免為每個 tile 建立獨立材質。

### 2.6 期貨連動

土壤的 `fertility` 直接決定單 tile 產量上限，但 **不影響全球價格**（玩家只是全球市場的 price-taker，自己的 10 畝田產量對世界微不足道）。唯一例外：

- **區域性土壤事件**（rare）：例如「某產地發生土壤鹽化危機」的新聞事件，視為天氣系統的一種，會直接觸發價格反應。
- **長期地力下降**：屬於玩家的 personal economy 損失，不影響市場。

---

## 3. 系統 2：季節 Season System

### 3.1 設計目標

- 與期貨合約的交割月份對齊，讓玩家理解「為什麼 12 月玉米合約在秋收時最活躍」
- 區分 *一年生* vs *多年生* 的節奏差異
- 冬麥 / 春麥兩種播種週期並存

### 3.2 時間模型

```typescript
interface SeasonState {
  year: number;                              // 遊戲內年份（起始 1）
  season: 'spring' | 'summer' | 'fall' | 'winter';
  dayInSeason: number;                       // 1 ~ 30
  dayInYear: number;                         // 1 ~ 120
  hour: number;                              // 0 ~ 23
  ensoPhase: 'elNino' | 'laNina' | 'neutral';
  ensoIntensity: number;                     // 0 ~ 1
  ensoRemainingDays: number;                 // 當前 ENSO 相位剩餘天數
}
```

### 3.3 季節影響總表

| 季節 | 日光小時 | 均溫偏移 | 天氣抽樣權重 | 主要活動 |
|------|---------|---------|-------------|---------|
| Spring (1-30) | 12h | +0°C | Rain×1.4, Frost×0.3（末期）, Storm×0.8 | 春播、水果開花 |
| Summer (31-60) | 14h | +8°C | Heatwave×1.5, Drought×1.3, Storm×1.2, Hail×1.1 | 生長、冬麥收成 |
| Fall (61-90) | 11h | +2°C | Storm×1.3, Rain×1.1, Frost×0.5（末期） | 主收成、秋播冬麥 |
| Winter (91-120) | 9h | -6°C | Snow×1.8, Frost×1.5, Storm×0.9 | 休眠、規劃、期貨交易 |

### 3.4 一年生作物播種/收成窗口（北半球視角）

| 作物 | 播種 | 收成 | 生長天數 | 期貨合約月 |
|------|------|------|---------|-----------|
| 玉米 Corn | Spring D1-D20 | Fall D25-D30 | ~100 | H/K/N/U/**Z** |
| 大豆 Soybean | Spring D15-Summer D5 | Fall D10-D25 | ~100 | F/H/K/N/Q/U/**X** |
| 冬小麥 HRW/SRW | Fall D20-D30 | Summer D5-D20 | 跨冬 ~230 | H/K/**N**/U/Z |
| 春小麥 HRS | Spring D1-D10 | Fall D1-D15 | ~110 | H/K/**N**/U/Z |
| 杜蘭麥 Durum | Spring D5-D15 | Fall D5-D20 | ~110 | H/K/**N**/U/Z |
| 稻米 Rice | Spring D20-Summer D10 | Fall D10-D30 | ~130 | F/H/K/**N**/U/X |
| 燕麥 Oats | Spring D1-D10 | Summer D25-Fall D5 | ~90 | H/K/**N**/U/Z |
| 油菜 Canola | Spring D5-D20 | Fall D1-D20 | ~110 | F/H/K/N/X |
| 棉花 Cotton | Spring D25-Summer D10 | Fall D15-Winter D5 | ~150 | H/K/**N**/V/Z |
| 花生 Peanut | Spring D20-Summer D5 | Fall D5-D20 | ~140 | F/H/K/N/V |
| 紅豆 Azuki | Spring D10-D20 | Fall D1-D15 | ~100 | G/J/M/Q/V/Z |

**南半球產地（巴西、阿根廷、澳洲）**：season + 2 offset（等於我們的 season 對調）。

### 3.5 多年生作物的季節表現

| 作物 | 種植後首收 | 花期 | 結果期 | 採收期 | 生命週期 |
|------|-----------|------|-------|-------|---------|
| 咖啡 Arabica | 3 年 | Spring 末 | Summer 全 | Fall D1-Winter D10 | 25-30 年 |
| 咖啡 Robusta | 2 年 | Spring/Fall 二次 | 二次 | 二次 | 25-30 年 |
| 可可 Cocoa | 3 年 | 全年斷續 | 全年 | 主收 Fall+Spring | 25 年 |
| 柳橙 Orange | 3 年 | Spring D10-D25 | Summer | Winter D1-Spring D10 | 30 年 |
| 蘋果 Apple | 4 年 | Spring D1-D20 | Summer | Fall D10-D30 | 25 年 |
| 甘蔗 Sugarcane | 1 年 | — | — | Fall-Winter 主收 | 宿根 3-5 年 |
| 橡膠 Rubber | 6 年 | — | — | 全年每日，雨季停割 | 25-30 年 |
| 棕櫚油 Oil Palm | 4 年 | 全年 | 全年 | 全年（每 10 天一輪） | 25 年 |
| 木材 Timber | 10 年起 | — | — | 可即時採伐 | 3-50 年（視樹種） |

> **蛋雞 Laying Hen** 不屬多年生作物但週期類似：20 週進入產蛋期後持續約 72 週，週期長於一年生作物。產出對應期貨商品為雞蛋 Egg (JD)。

### 3.6 期貨合約月份標準對應表（CBOT / ICE / CME）

遊戲採用真實交易月份代碼，讓玩家接觸真實期貨文化。

```typescript
// 合約月份標準對應表（SSOT：src/data/commodities.ts）
const CONTRACT_MONTHS: Record<CommodityId, MonthCode[]> = {
  // 穀物 Grains
  corn:           ['H','K','N','U','Z'],        // CBOT ZC — Mar/May/Jul/Sep/Dec
  wheat_hrw:      ['H','K','N','U','Z'],        // KCBT KW
  wheat_srw:      ['H','K','N','U','Z'],        // CBOT ZW
  wheat_hrs:      ['H','K','N','U','Z'],        // MGEX MW
  wheat_durum:    ['H','K','N','U','Z'],        // MGEX DW (低流動性)
  rice:           ['F','H','K','N','U','X'],    // CBOT ZR
  oats:           ['H','K','N','U','Z'],        // CBOT ZO
  // 油籽 Oilseeds
  soybean:        ['F','H','K','N','Q','U','X'],// CBOT ZS
  canola:         ['F','H','K','N','X'],         // ICE Canada RS
  palm_oil:       ['F','G','H','J','K','M','N','Q','U','V','X','Z'], // Bursa FCPO 每月
  // 軟商品 Softs
  coffee_arabica: ['H','K','N','U','Z'],        // ICE US KC
  coffee_robusta: ['F','H','K','N','U','X'],    // ICE London RC
  cocoa:          ['H','K','N','U','Z'],        // ICE US CC
  sugar:          ['H','K','N','V'],            // ICE US SB (Sugar #11)
  orange_juice:   ['F','H','K','N','U','X'],    // ICE US OJ
  // 畜產 Livestock
  feeder_cattle:  ['F','H','J','K','Q','U','V','X'], // CME GF
  live_cattle:    ['G','J','M','Q','V','Z'],    // CME LE
  lean_hogs:      ['G','J','K','M','N','Q','V','Z'], // CME HE
  // 乳製品 Dairy
  milk_class_iii: ['F','G','H','J','K','M','N','Q','U','V','X','Z'], // CME DC 每月
  butter:         ['F','G','H','J','K','M','N','Q','U','V','X','Z'], // CME CB 每月
  cheese:         ['F','G','H','J','K','M','N','Q','U','V','X','Z'], // CME CSC 每月
  nfdm:           ['F','G','H','J','K','M','N','Q','U','V','X','Z'], // CME GNF 每月
  // 工業 Industrial
  cotton:         ['H','K','N','V','Z'],        // ICE US CT
  rubber:         ['F','G','H','J','K','M','N','Q','U','V','X','Z'], // TOCOM/SHFE 每月
  lumber:         ['F','H','K','N','U','X'],    // CME LBR
  // 亞洲特色 Asian
  azuki_bean:     ['G','J','M','Q','V','Z'],    // TOCOM
  apple:          ['F','H','K','N','V','Z'],    // Zhengzhou AP
  egg:            ['F','H','K','N','U','X'],    // Dalian JD
  peanut:         ['F','H','K','N','V'],        // Dalian PK
};

type MonthCode = 'F'|'G'|'H'|'J'|'K'|'M'|'N'|'Q'|'U'|'V'|'X'|'Z';
//                Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
```

### 3.7 視覺呈現（R3F）

- **日月循環**：`<directionalLight>` position 依 `hour` 以橢圓軌道移動；色溫由 2400K（日出）→ 5800K（正午）→ 2200K（日落）
- **季節光照預設**：每季一組 envMap / ambient color
  - Spring: 粉藍天空、淡綠 ambient `#b8d4a0`
  - Summer: 高亮度藍天 `#87ceeb`、強 sun intensity 1.2
  - Fall: 橙色 ambient `#d4a574`、低角度 sun
  - Winter: 冷白天空 `#c8d4dc`、低 intensity 0.7
- **地面季節 overlay**：tile shader 接收 `uSeasonColor` uniform，以 blend mode 疊加一層（冬天偏白、秋天偏橙）
- **作物 LoD**：多年生樹每季切換 GLB frame（花→果→落葉），而不是動畫 interpolation（省效能）

### 3.8 期貨連動

- **合約月份接近交割**：當遊戲進入某合約交割月，該合約價格波動度 +30%（真實世界的 "expiry volatility"）
- **主收季價格**：北半球玉米 / 大豆的秋收季（Fall），市場關注度最高，「USDA WASDE-like」報告每 10 天生成一次
- **季節基差 Seasonal Basis**：遊戲內每個商品有一條 *seasonal curve*（12 期），現價相對年均有固定節奏（收成季壓價、淡季拉價）

---

## 4. 系統 3：天氣 Weather System

### 4.1 設計目標

- 天氣是本遊戲最刺激、最「農產品期貨」的系統，必須有戲劇張力
- 區分 *玩家農場天氣*（影響自己產量）與 *全球產地天氣*（影響合約價格）
- 真實 ENSO 週期讓長期作物（咖啡、棕櫚油）有 2-7 年戲劇弧

### 4.2 天氣事件類型

```typescript
type WeatherType =
  | 'clear'         // 晴
  | 'cloudy'        // 雲
  | 'rain'          // 雨
  | 'heavy_rain'    // 大雨
  | 'drought'       // 乾旱（多日 clear + 高溫累積觸發）
  | 'heatwave'      // 熱浪
  | 'frost'         // 霜害
  | 'storm'         // 暴風雨
  | 'hail'          // 冰雹
  | 'snow'          // 雪
  | 'hurricane'     // 颶風 / 颱風（區域特有）
  | 'flood'         // 洪水（大雨 + 排水差觸發）
  | 'wildfire'      // 野火（乾旱 + 熱浪 + 乾燥區觸發）
  | 'dust_storm';   // 沙塵暴（乾旱 + 砂土 / 鹽土 觸發）
```

14 種，核心 10 種 + 4 種組合觸發。

### 4.3 天氣 Severity

每個事件有 `severity ∈ [0, 1]`：
- 0.0-0.3：輕微（新聞一則、產量微影響）
- 0.3-0.6：中度（明顯減產、期貨跳 3-10%）
- 0.6-0.85：嚴重（災害新聞、期貨跳 10-25%）
- 0.85-1.0：歷史級（彩蛋事件、期貨跳 25%+）

### 4.4 天氣衝擊矩陣（29 商品 × 主要災害）

**說明：** yield = 該產地實體產量影響（負值為減產），price = 該商品全球合約價格影響（正值為漲價）。所有百分比以 severity=0.7 為基準，實際影響 = base × (severity / 0.7)。商品清單與 `src/data/commodities.ts` 一致，共 29 項。

#### 4.4.1 穀物類 Grains

| 商品 | 乾旱 Drought | 霜害 Frost | 熱浪 Heatwave | 大雨 Heavy Rain | 冰雹 Hail | 暴風 Storm |
|------|-------------|-----------|--------------|----------------|----------|-----------|
| 玉米 Corn | yield -30% / price +25% | yield -10% / price +5% | yield -22% / price +18% | yield -5% / price +3% | yield -15% / price +8% | yield -8% / price +4% |
| SRW 小麥 | yield -22% / price +18% | yield -15% / price +10% | yield -18% / price +12% | yield -12% / price +6% | yield -18% / price +10% | yield -6% / price +3% |
| HRW 小麥 | yield -28% / price +22% | yield -20% / price +14% | yield -20% / price +15% | yield -8% / price +4% | yield -20% / price +12% | yield -6% / price +3% |
| HRS 春麥 | yield -25% / price +18% | yield -8% / price +5% | yield -20% / price +14% | yield -6% / price +3% | yield -15% / price +8% | yield -5% / price +2% |
| 杜蘭麥 Durum | yield -26% / price +20% | yield -10% / price +6% | yield -22% / price +16% | yield -10% / price +5% | yield -18% / price +10% | yield -5% / price +2% |
| 稻米 Rice | yield -35% / price +28% | yield -25% / price +18% | yield -15% / price +8% | yield +5% / price -2% | yield -10% / price +4% | yield -12% / price +6% |
| 燕麥 Oats | yield -20% / price +12% | yield -8% / price +4% | yield -18% / price +10% | yield -6% / price +2% | yield -20% / price +10% | yield -5% / price +2% |

#### 4.4.2 油籽類 Oilseeds

| 商品 | 乾旱 | 霜害 | 熱浪 | 大雨 | 冰雹 | 暴風 |
|------|------|------|------|------|------|------|
| 大豆 Soybean | yield -28% / price +22% | yield -18% / price +12% | yield -20% / price +15% | yield -8% / price +4% | yield -15% / price +7% | yield -10% / price +5% |
| 菜籽 Canola | yield -22% / price +16% | yield -12% / price +8% | yield -25% / price +18% | yield -6% / price +3% | yield -18% / price +10% | yield -8% / price +4% |
| 棕櫚油 Palm Oil | yield -15% / price +12% | yield 0% / price 0% | yield -8% / price +5% | yield +3% / price -1% | yield 0% / price 0% | yield -15% / price +10% |

#### 4.4.3 軟商品 Softs

| 商品 | 乾旱 | 霜害 | 熱浪 | 大雨 | 冰雹 | 暴風 | 颶風 |
|------|------|------|------|------|------|------|------|
| 咖啡 Arabica | yield -25% / price +20% | yield -50% / price +40% | yield -15% / price +10% | yield -10% / price +5% | yield -15% / price +8% | yield -18% / price +12% | yield -20% / price +15% |
| 咖啡 Robusta | yield -20% / price +15% | yield -25% / price +18% | yield -12% / price +8% | yield -5% / price +2% | yield -10% / price +5% | yield -15% / price +10% | yield -25% / price +18% |
| 可可 Cocoa | yield -30% / price +25% | yield -10% / price +5% | yield -18% / price +12% | yield -8% / price +4% | yield -12% / price +6% | yield -15% / price +10% | yield -20% / price +15% |
| 糖 Sugar (SB) | yield -20% / price +14% | yield -15% / price +10% | yield -10% / price +6% | yield +2% / price -1% | yield -15% / price +8% | yield -12% / price +7% | yield -18% / price +12% |
| 柳橙 OJ | yield -20% / price +15% | yield **-60% / price +50%** | yield -10% / price +8% | yield -15% / price +8% | yield -35% / price +22% | yield -25% / price +18% | yield **-30% / price +25%** |

#### 4.4.4 畜產 / 乳製品 Livestock & Dairy

| 商品 | 乾旱 | 霜害 | 熱浪 | 大雨 / 洪水 | 暴風 |
|------|------|------|------|------|------|
| 肉牛 Live Cattle | yield -12% / price +8%（飼料漲） | yield -5% / price +2% | yield -15% / price +12%（熱死） | yield -8% / price +4% | yield -5% / price +2% |
| 飼料牛 Feeder Cattle | yield -15% / price +10% | yield -4% / price +2% | yield -12% / price +8% | yield -6% / price +3% | yield -4% / price +2% |
| 瘦肉豬 Lean Hogs | yield -5% / price +3% | yield -3% / price +1% | yield -10% / price +7% | yield -8% / price +4% | yield -5% / price +2% |
| Class III 牛奶 | yield -10% / price +6% | yield -3% / price +1% | yield -18% / price +12%（產奶下降） | yield -5% / price +2% | yield -4% / price +2% |
| 奶油 Butter | yield -8% / price +5% | yield -2% / price +1% | yield -15% / price +10% | yield -4% / price +2% | yield -3% / price +1% |
| 起司 Cheese | yield -8% / price +5% | yield -2% / price +1% | yield -15% / price +10% | yield -4% / price +2% | yield -3% / price +1% |
| 脫脂奶粉 NFDM | yield -10% / price +6% | yield -3% / price +1% | yield -18% / price +12%（原料奶下降傳導） | yield -4% / price +2% | yield -3% / price +1% |

> 畜產的產量影響主要透過 **飼料成本上升**（玉米、豆粕漲）傳導，第二層才是直接熱死 / 凍死。

#### 4.4.5 工業作物 Industrial

| 商品 | 乾旱 | 野火 | 暴風 | 大雨 | 霜害 | 冰雹 | 熱浪 |
|------|------|------|------|------|------|------|------|
| 棉花 Cotton | yield -30% / price +22% | — | yield -15% / price +10% | yield -18% / price +12% | yield -15% / price +8% | yield -25% / price +14% | yield -15% / price +10% |
| 橡膠 Rubber | yield -12% / price +8% | yield -25% / price +18% | yield -15% / price +10% | yield -20% / price +12%（停割） | yield 0% / price 0% | — | yield -8% / price +5% |
| 木材 Lumber | yield -5% / price +3% | yield **-40% / price +30%** | yield -20% / price +12%（倒伏） | yield -8% / price +4% | yield -3% / price +1% | — | — |

#### 4.4.6 亞洲特色 Asian Regional

| 商品 | 乾旱 | 霜害 | 熱浪 | 大雨 | 冰雹 | 颱風 |
|------|------|------|------|------|------|------|
| 紅豆 Azuki Bean | yield -20% / price +12% | yield -15% / price +8% | yield -15% / price +8% | yield -8% / price +3% | yield -15% / price +7% | yield -15% / price +8% |
| 蘋果 Apple | yield -18% / price +10% | yield **-40% / price +28%**（花期霜） | yield -12% / price +6% | yield -15% / price +8% | yield **-45% / price +30%**（打果） | yield -25% / price +15% |
| 雞蛋 Egg（產自蛋雞） | yield -8% / price +5%（飼料漲傳導） | yield -5% / price +2% | yield -18% / price +14%（熱緊迫停產） | yield -6% / price +3% | — | yield -10% / price +5% |
| 花生 Peanut | yield -30% / price +18% | yield -15% / price +8% | yield -15% / price +8% | yield -8% / price +3% | yield -15% / price +7% | yield -18% / price +10% |

> **蛋雞備註**：產出來源為 Laying Hen（蛋雞），雞蛋期貨 (JD) 的價格受飼料成本（玉米、大豆粕）與熱緊迫雙重影響。

#### 4.4.7 程式碼形式

```typescript
export const WEATHER_SENSITIVITY: Record<
  CommodityId,
  Partial<Record<WeatherType, { yieldImpact: number; priceImpact: number }>>
> = {
  corn: {
    drought:    { yieldImpact: -0.30, priceImpact: +0.25 },
    heatwave:   { yieldImpact: -0.22, priceImpact: +0.18 },
    frost:      { yieldImpact: -0.10, priceImpact: +0.05 },
    heavy_rain: { yieldImpact: -0.05, priceImpact: +0.03 },
    hail:       { yieldImpact: -0.15, priceImpact: +0.08 },
    storm:      { yieldImpact: -0.08, priceImpact: +0.04 },
    flood:      { yieldImpact: -0.25, priceImpact: +0.20 },
  },
  coffee_arabica: {
    drought:    { yieldImpact: -0.25, priceImpact: +0.20 },
    frost:      { yieldImpact: -0.50, priceImpact: +0.40 },  // 巴西霜害經典
    heatwave:   { yieldImpact: -0.15, priceImpact: +0.10 },
    heavy_rain: { yieldImpact: -0.10, priceImpact: +0.05 },
    hurricane:  { yieldImpact: -0.20, priceImpact: +0.15 },
  },
  orange_juice: {
    frost:      { yieldImpact: -0.60, priceImpact: +0.50 },  // 佛州霜害
    hurricane:  { yieldImpact: -0.30, priceImpact: +0.25 },
    drought:    { yieldImpact: -0.20, priceImpact: +0.15 },
    hail:       { yieldImpact: -0.35, priceImpact: +0.22 },
  },
  // ... 延展至全部 29 商品（參見 src/data/commodities.ts 的 COMMODITY_IDS）
};
```

完整 const 建議放在 `src/data/weatherSensitivity.ts`，以 Zod runtime 驗證。商品 ID 必須與 `src/data/commodities.ts` 的 `CommodityId` 型別保持一致。

### 4.5 ENSO（聖嬰 / 反聖嬰）週期

```typescript
interface EnsoCycle {
  phase: 'elNino' | 'laNina' | 'neutral';
  intensity: number;   // 0 ~ 1
  startDay: number;    // 絕對日（dayInYear * year）
  durationDays: number;// 180 ~ 540（半年到 1.5 年）
}
```

**週期規則：**
- 每個 ENSO 相位持續 180-540 遊戲日
- 相位結束後必經過 neutral（90-180 日）才進下一 phase
- 整體每 2-7 年一個完整「elNino → neutral → laNina → neutral」大弧

**區域影響（強度 × 基準偏移）：**

| 區域 | El Niño 影響 | La Niña 影響 |
|------|-------------|-------------|
| 美國中西部 | 冬季溫和（冬麥受益） | 冬季嚴寒，夏季乾旱 +25% 機率 |
| 美國加州 / 佛州 | 冬雨多，減乾旱 / 多颶風 | 乾旱 +30% 機率 |
| 巴西中南（咖啡、糖、大豆） | 乾旱 +40% 機率 | 濕潤（產量 +5~10%） |
| 阿根廷 Pampas | 乾旱 +35% 機率 | 濕潤 |
| 東南亞（棕櫚、橡膠、咖啡 Robusta） | **乾旱 +50% 機率**（經典影響） | 多雨（短期有利、長期洪水） |
| 印度 | 季風弱（乾旱 +20%） | 季風強（有利） |
| 澳洲 | 乾旱 +40%、野火 +30% | 洪水 +30% |
| 西非（可可） | 溫和，輕微減產 | 中性 |

**玩家 UI：**
- 新聞面板頂部恆定顯示 ENSO 狀態條（藍←La Niña / 灰=Neutral / 紅→El Niño）
- 強度以漸層色顯示
- 點擊展開「各產地風險熱圖」

### 4.6 歷史彩蛋事件

```typescript
interface HistoricalEaster {
  id: string;
  triggerCondition: string;  // 描述觸發邏輯（ENSO 相位 + 機率）
  newsHeadline: string;
  weatherEvent: Partial<WeatherEvent>;
  priceShock: { commodity: CommodityId; impact: number }[];
  baseProbability: number;   // 每年基礎機率
}

const HISTORICAL_EVENTS: HistoricalEaster[] = [
  {
    id: 'us_drought_1988',
    triggerCondition: 'laNina + summer + US midwest dry streak > 15 days',
    newsHeadline: '[重大] 美國中西部遭遇世代級乾旱，玉米產區大面積枯萎',
    weatherEvent: { type: 'drought', severity: 0.95, regions: ['us_midwest'] },
    priceShock: [
      { commodity: 'corn', impact: +0.45 },
      { commodity: 'soybean', impact: +0.30 },
      { commodity: 'wheat_srw', impact: +0.25 },
    ],
    baseProbability: 0.008,  // ~1/125 年
  },
  {
    id: 'us_drought_2012',
    triggerCondition: 'summer + US midwest dry + heatwave',
    newsHeadline: '[重大] 2012 級別乾旱重演！密蘇里河水位低於歷史紀錄',
    weatherEvent: { type: 'drought', severity: 0.90, regions: ['us_midwest'] },
    priceShock: [
      { commodity: 'corn', impact: +0.50 },
      { commodity: 'soybean', impact: +0.35 },
    ],
    baseProbability: 0.012,
  },
  {
    id: 'brazil_frost_1977',
    triggerCondition: 'winter + brazil sul + frost',
    newsHeadline: '[重大] 巴西南部咖啡產區遭受嚴霜，1977 年噩夢重演',
    weatherEvent: { type: 'frost', severity: 0.95, regions: ['br_south'] },
    priceShock: [
      { commodity: 'coffee_arabica', impact: +0.80 },  // 歷史上咖啡曾漲到 3 倍
    ],
    baseProbability: 0.005,
  },
  {
    id: 'brazil_frost_1989',
    triggerCondition: 'winter + brazil sul + frost',
    newsHeadline: '[重大] 巴西黑色 7 月：霜害摧毀咖啡 30% 產能',
    weatherEvent: { type: 'frost', severity: 0.90, regions: ['br_south'] },
    priceShock: [
      { commodity: 'coffee_arabica', impact: +0.60 },
    ],
    baseProbability: 0.006,
  },
  {
    id: 'soybean_rust_2004',
    triggerCondition: 'elNino + brazil + humid streak',
    newsHeadline: '[重大] 南美大豆銹病爆發，產量預估下修 15%',
    weatherEvent: { type: 'heavy_rain', severity: 0.70, regions: ['br_central', 'ar_pampas'] },
    priceShock: [
      { commodity: 'soybean', impact: +0.25 },
    ],
    baseProbability: 0.01,
  },
  {
    id: 'florida_frost_1989',
    triggerCondition: 'winter + florida + frost',
    newsHeadline: '[重大] 佛州 1989 級寒流！柳橙園 60% 結冰',
    weatherEvent: { type: 'frost', severity: 0.92, regions: ['us_florida'] },
    priceShock: [
      { commodity: 'orange_juice', impact: +0.75 },
    ],
    baseProbability: 0.004,
  },
  {
    id: 'thailand_flood_2011',
    triggerCondition: 'laNina + fall + thailand + heavy_rain',
    newsHeadline: '[重大] 泰國大洪水，橡膠 / 稻米產區受重創',
    weatherEvent: { type: 'flood', severity: 0.85, regions: ['th_central'] },
    priceShock: [
      { commodity: 'rubber', impact: +0.30 },
      { commodity: 'rice', impact: +0.20 },
    ],
    baseProbability: 0.008,
  },
  {
    id: 'russia_heatwave_2010',
    triggerCondition: 'summer + russia + heatwave',
    newsHeadline: '[重大] 俄羅斯黑海小麥帶遭遇歷史熱浪，莫斯科宣布出口禁令',
    weatherEvent: { type: 'heatwave', severity: 0.95, regions: ['ru_blacksea'] },
    priceShock: [
      { commodity: 'wheat_hrw', impact: +0.40 },
      { commodity: 'wheat_srw', impact: +0.38 },
      { commodity: 'wheat_hrs', impact: +0.35 },
    ],
    baseProbability: 0.005,
  },
];
```

機率觸發邏輯：每遊戲季末擲骰，`actualProb = baseProbability × ensoMultiplier × seasonMultiplier`。

### 4.7 全球產地地圖（Region Binding）

```typescript
type ProductionRegion =
  // 北美
  | 'us_midwest'       // 玉米、大豆
  | 'us_plains'        // 小麥（HRW、HRS）
  | 'us_south'         // 棉花、花生
  | 'us_florida'       // 柳橙、糖
  | 'us_dairy_wi_ca'   // 乳製品
  | 'us_ranch_west'    // 畜產
  | 'ca_prairies'      // 菜籽、春麥
  // 南美
  | 'br_south'         // 咖啡 Arabica、菸草
  | 'br_central'       // 大豆、玉米（Cerrado）
  | 'br_northeast'     // 糖、棉花
  | 'ar_pampas'        // 大豆、小麥、玉米
  // 歐洲
  | 'eu_france'        // 小麥、葵花
  | 'eu_blacksea'      // 小麥
  | 'ru_blacksea'      // 小麥
  // 亞洲
  | 'cn_northeast'     // 大豆、玉米
  | 'cn_central'       // 稻米、棉花、蘋果、雞蛋、花生
  | 'in_punjab'        // 小麥、棉花、花生
  | 'in_south'         // 糖、咖啡 Robusta
  | 'th_central'       // 稻米、糖、橡膠
  | 'vn_central'       // 咖啡 Robusta、橡膠、稻米
  | 'my_id_palm'       // 棕櫚油、橡膠
  | 'jp_main'          // 稻米、紅豆
  // 非洲
  | 'af_west_cocoa'    // 可可（象牙海岸、迦納）
  | 'af_east_coffee'   // 咖啡 Arabica（衣索比亞、肯亞）
  // 大洋洲
  | 'au_wheat'         // 小麥
  | 'au_beef';         // 畜產

const COMMODITY_REGION_MAP: Record<CommodityId, {
  primary: ProductionRegion[];     // 主產地（價格影響大）
  secondary: ProductionRegion[];   // 次產地（價格影響小）
}> = {
  // 以 SSOT (src/data/commodities.ts) 的 primaryRegion / secondaryRegions 為準
  corn: {
    primary: ['us_midwest', 'br_central'],
    secondary: ['ar_pampas', 'cn_northeast', 'ca_prairies'],
  },
  coffee_arabica: {
    primary: ['br_south', 'af_east_coffee'],
    secondary: ['vn_central'],
  },
  coffee_robusta: {
    primary: ['vn_central', 'in_south'],
    secondary: ['br_south'],
  },
  cocoa: {
    primary: ['af_west_cocoa'],
    secondary: ['br_south'],
  },
  palm_oil: {
    primary: ['my_id_palm'],
    secondary: [],
  },
  rubber: {
    primary: ['th_central', 'my_id_palm', 'vn_central'],
    secondary: [],
  },
  orange_juice: {
    primary: ['us_florida', 'br_south'],
    secondary: [],
  },
  cotton: {
    primary: ['us_south', 'in_punjab', 'cn_central'],
    secondary: [],
  },
  azuki_bean: {
    primary: ['jp_main'],
    secondary: ['cn_northeast'],
  },
  apple: {
    primary: ['cn_central'],
    secondary: [],
  },
  egg: {
    primary: ['cn_central'],
    secondary: ['cn_northeast'],
  },
  peanut: {
    primary: ['cn_central'],
    secondary: ['us_south', 'in_punjab'],
  },
  // ... 其他商品（總計 29 項，完整對照見 SSOT）
};
```

**關鍵機制：** 玩家農場通常不在 `primary` 產地區 —— 玩家是「中西部旁邊的小農」或「佛州外的溫室」。玩家自己的天氣只影響自己的 tile；全球天氣才影響期貨。這讓玩家有兩條遊玩路徑：

1. **農場路徑**：種好自己的地，管天氣、賣現貨
2. **期貨路徑**：研究全球天氣預報，買賣合約套利

### 4.8 玩家互動 UI

| 功能 | 時間範圍 | 準確度 | 費用 |
|------|---------|-------|------|
| 短期預報 Short Forecast | 未來 3-7 天（玩家農場） | 85-95% | 免費 |
| 區域預報 Regional Forecast | 未來 3-7 天（任一產地） | 75-85% | $50 / 產地 / 查詢 |
| 季節展望 Seasonal Outlook | 未來 30-60 天 | 50-65% | $200 / 查詢 |
| ENSO 指標 ENSO Indicator | 持續顯示 | 方向準確，強度估計誤差 | 免費 |
| 衛星農情 Satellite Crop Health | 任一產地 NDVI | 95%+ | $500 / 產地 / 月 |

**緊急應對：**

| 災害 | 防護設施 | 成本 | 減災效果 |
|------|---------|------|---------|
| 霜害 | 風扇 Wind Machine | $4000 / 單位 | frost 影響 -40% |
| 霜害 | 燃油加熱器 | $1500 + 油錢 | frost -30% |
| 乾旱 | 滴灌系統 | $6000 / 畝 | drought -50% |
| 熱浪 | 遮陰網 | $800 / 畝 | heatwave -25% |
| 冰雹 | 防雹網 | $2500 / 畝 | hail -70% |
| 大雨 / 洪水 | 排水溝 | $800（永久） | flood -40%, heavy_rain -30% |
| 暴風 | 防風林（需 2 年長成） | $300 + 時間 | storm -25% |
| 畜產熱浪 | 畜舍空調 | $2000 / 畜舍 | heat death -60% |

### 4.9 視覺呈現（R3F）

#### 4.9.1 雨

```typescript
// GPU 粒子（InstancedMesh + shader）
<instancedMesh args={[sphereGeom, rainMat, 8000]} />
// 頂點 shader: position.y -= time * fallSpeed; modulo height
// 碎片 shader: alpha 隨 severity 調整；地面用 env probe 產生水漬 reflection
```

- 地面 tile 的 roughness uniform 下降（變濕變亮）
- `puddle` decal：severity > 0.5 時地面出現水窪 normal map

#### 4.9.2 雪

```typescript
// 粒子（幾千到上萬）+ 地面積雪 normal blend
<SnowParticles count={5000} fallSpeed={0.8} wind={ensoPhase === 'laNina' ? 1.5 : 0.5} />
// tile shader: mix(albedo, snowAlbedo, smoothstep(0, 1, accumulation))
```

#### 4.9.3 乾旱

- 作物 shader 的 `uDryness` uniform 上升
  - albedo → 混入 `#c9a75a`（枯黃）
  - leaf droop：vertex shader pivot rotation（葉片下垂）
- 土壤 shader 加入 crack normal map（龜裂紋）

#### 4.9.4 霜害

```glsl
// tile + crop shader 疊加 frost overlay
vec3 frost = texture2D(frostNoise, uv * 5.0).rgb;
finalColor = mix(finalColor, vec3(0.9, 0.95, 1.0), frost * uFrostIntensity);
```

#### 4.9.5 暴風 / 颶風

- 後處理：vignette + camera shake（`useFrame` 內微位移）
- 作物 shader：vertex displacement 以 sin(time * windSpeed + x * freq)
- 音效：`PositionalAudio` 風聲

#### 4.9.6 冰雹

- 粒子：白色冰球（大於雨的粒子尺寸）
- 落地閃爍：地面 decal `hail_hit_mark` 短暫存在
- 音效：持續噠噠聲

#### 4.9.7 熱浪

- 後處理 bloom +30%
- Heat haze shader：畫面底部半螢幕 UV 擾動
- 色溫 +500K

#### 4.9.8 野火

- 遠景產地：sky overlay 加入橙色霾
- 如果玩家在附近：煙柱粒子 + 動態點光源

### 4.10 天氣狀態管理（Zustand store）

```typescript
interface WeatherStore {
  currentWeather: Record<ProductionRegion, WeatherEvent>;  // 每個產地當前天氣
  playerFarmWeather: WeatherEvent;                         // 玩家農場
  forecast: { day: number; prediction: WeatherEvent; accuracy: number }[];
  activeEnso: EnsoCycle;
  historyLog: WeatherEvent[];

  advanceDay: () => void;
  rollWeather: (region: ProductionRegion) => WeatherEvent;
  triggerHistoricalEvent: (eventId: string) => void;
}
```

每日 `advanceDay` 邏輯：
1. 更新 ENSO 剩餘天數、必要時切換相位
2. 為每個 region 依 `season × enso × previousWeather` 抽樣下一天天氣
3. 擲骰檢查歷史事件觸發
4. 對所有影響區域 × 商品計算 yieldImpact / priceImpact
5. 推送到 `FuturesMarketStore`（第 6 節）

---

## 5. 資料結構總表（TypeScript + Zod）

**檔案建議：** `src/schemas/environmental.ts`

```typescript
import { z } from 'zod';

// ============================================
// 土壤 Soil
// ============================================

export const SoilTypeSchema = z.enum([
  'loam', 'sandy', 'clay', 'volcanic', 'humus', 'saline', 'peat',
]);
export type SoilType = z.infer<typeof SoilTypeSchema>;

export const SoilTileSchema = z.object({
  id: z.string().uuid(),
  coord: z.object({ x: z.number().int(), y: z.number().int() }),
  type: SoilTypeSchema,
  ph: z.number().min(4.0).max(9.0),
  npk: z.object({
    n: z.number().min(0).max(100),
    p: z.number().min(0).max(100),
    k: z.number().min(0).max(100),
  }),
  moisture: z.number().min(0).max(1),
  drainage: z.number().min(0).max(1),
  organicMatter: z.number().min(0).max(1),
  salinity: z.number().min(0).max(1),
  compaction: z.number().min(0).max(1),
  lastCropId: z.string().optional(),
  consecutiveSeasonsSameCrop: z.number().int().min(0),
  fallowSeasons: z.number().int().min(0),
  state: z.enum(['empty', 'planted', 'growing', 'mature', 'fallow', 'damaged']),
});
export type SoilTile = z.infer<typeof SoilTileSchema>;

// ============================================
// 季節 Season
// ============================================

export const SeasonSchema = z.enum(['spring', 'summer', 'fall', 'winter']);
export type Season = z.infer<typeof SeasonSchema>;

export const EnsoPhaseSchema = z.enum(['elNino', 'laNina', 'neutral']);
export type EnsoPhase = z.infer<typeof EnsoPhaseSchema>;

export const SeasonStateSchema = z.object({
  year: z.number().int().min(1),
  season: SeasonSchema,
  dayInSeason: z.number().int().min(1).max(30),
  dayInYear: z.number().int().min(1).max(120),
  hour: z.number().min(0).max(23.99),
  ensoPhase: EnsoPhaseSchema,
  ensoIntensity: z.number().min(0).max(1),
  ensoRemainingDays: z.number().int().min(0),
});
export type SeasonState = z.infer<typeof SeasonStateSchema>;

export const MonthCodeSchema = z.enum([
  'F','G','H','J','K','M','N','Q','U','V','X','Z',
]);
export type MonthCode = z.infer<typeof MonthCodeSchema>;

// ============================================
// 天氣 Weather
// ============================================

export const WeatherTypeSchema = z.enum([
  'clear', 'cloudy', 'rain', 'heavy_rain', 'drought',
  'heatwave', 'frost', 'storm', 'hail', 'snow',
  'hurricane', 'flood', 'wildfire', 'dust_storm',
]);
export type WeatherType = z.infer<typeof WeatherTypeSchema>;

export const ProductionRegionSchema = z.enum([
  // 北美
  'us_midwest', 'us_plains', 'us_south', 'us_florida',
  'us_dairy_wi_ca', 'us_ranch_west', 'ca_prairies',
  // 南美
  'br_south', 'br_central', 'br_northeast', 'ar_pampas',
  // 歐洲
  'eu_france', 'eu_blacksea', 'ru_blacksea',
  // 亞洲
  'cn_northeast', 'cn_central', 'in_punjab', 'in_south',
  'th_central', 'vn_central', 'my_id_palm', 'jp_main',
  // 非洲
  'af_west_cocoa', 'af_east_coffee',
  // 大洋洲
  'au_wheat', 'au_beef',
  // 玩家
  'player_farm',
]);
export type ProductionRegion = z.infer<typeof ProductionRegionSchema>;

export const WeatherEventSchema = z.object({
  id: z.string().uuid(),
  type: WeatherTypeSchema,
  severity: z.number().min(0).max(1),
  regions: z.array(ProductionRegionSchema),
  startDay: z.number().int().min(0),      // 絕對遊戲日（year * 120 + dayInYear）
  durationDays: z.number().int().min(1),
  isHistoricalEaster: z.boolean().default(false),
  historicalEventId: z.string().optional(),
});
export type WeatherEvent = z.infer<typeof WeatherEventSchema>;

export const WeatherImpactSchema = z.object({
  yieldImpact: z.number().min(-1).max(1),
  priceImpact: z.number().min(-1).max(2),
});
export type WeatherImpact = z.infer<typeof WeatherImpactSchema>;

export const EnsoCycleSchema = z.object({
  phase: EnsoPhaseSchema,
  intensity: z.number().min(0).max(1),
  startDay: z.number().int().min(0),
  durationDays: z.number().int().min(1),
});
export type EnsoCycle = z.infer<typeof EnsoCycleSchema>;

// ============================================
// 天氣敏感度矩陣
// ============================================

// 注意：CommodityId 型別應在 commodity.ts 定義，這裡假設匯入
export type CommodityId = string; // placeholder；實作時 import

export const WEATHER_SENSITIVITY: Record<
  CommodityId,
  Partial<Record<WeatherType, WeatherImpact>>
> = {
  // 見 4.4 節完整表；此處為結構範例
};

// ============================================
// 合約月份
// ============================================

export const CONTRACT_MONTHS: Record<CommodityId, MonthCode[]> = {
  // 見 3.6 節完整表
};

// ============================================
// 產地對應
// ============================================

export const COMMODITY_REGION_MAP: Record<
  CommodityId,
  { primary: ProductionRegion[]; secondary: ProductionRegion[] }
> = {
  // 見 4.7 節完整表
};

// ============================================
// 歷史彩蛋事件
// ============================================

export const HistoricalEasterSchema = z.object({
  id: z.string(),
  triggerCondition: z.string(),
  newsHeadline: z.string(),
  weatherEvent: WeatherEventSchema.partial(),
  priceShock: z.array(z.object({
    commodity: z.string(),
    impact: z.number(),
  })),
  baseProbability: z.number().min(0).max(1),
});
export type HistoricalEaster = z.infer<typeof HistoricalEasterSchema>;
```

### 5.1 土壤派生值（fertility）

```typescript
export function computeFertility(tile: SoilTile): number {
  const { npk, ph, organicMatter, salinity, compaction } = tile;

  // NPK 平均（0~1 scale）
  const npkScore = (npk.n + npk.p + npk.k) / 300;

  // pH 偏離 6.5 的懲罰
  const phPenalty = 1 - Math.min(Math.abs(ph - 6.5) / 3, 1) * 0.5;

  // 綜合
  const raw = npkScore * 0.5 + organicMatter * 0.3 + (1 - salinity) * 0.1 + (1 - compaction) * 0.1;
  return Math.max(0, Math.min(1, raw * phPenalty));
}
```

### 5.2 作物產量最終公式（摘要 / 詳見 economic-model.md）

```typescript
function calculateYield(params: {
  baseYield: number;
  tile: SoilTile;
  crop: CommodityId;
  season: SeasonState;
  weatherHistory: WeatherEvent[];
}): number {
  const soilFactor = computeSoilFactor(params.tile, params.crop);       // 0.3 ~ 1.3
  const seasonFactor = computeSeasonFactor(params.season, params.crop); // 0.5 ~ 1.15
  const weatherFactor = computeWeatherFactor(params.weatherHistory, params.crop); // 0.2 ~ 1.1
  return params.baseYield * soilFactor * seasonFactor * weatherFactor;
}
```

---

## 6. 期貨價格連動機制

> **重要**：實際價格計算公式由 `economic-model.md` 負責，本文件只定義傳入的倍率訊號。

### 6.1 訊號傳遞流程

```
天氣事件生成 (WeatherStore)
    ↓
查表 WEATHER_SENSITIVITY[commodity][weatherType]
    ↓
查表 COMMODITY_REGION_MAP[commodity]
    ↓
計算 impactFactor = priceImpact × (severity / 0.7) × regionWeight
    ↓
dispatch 到 FuturesMarketStore.applyShock(commodity, impactFactor)
    ↓
FuturesMarket 更新所有未交割合約月份的價格
    ↓
UI 顯示：價格跳動動畫 + 新聞彈窗
```

### 6.2 regionWeight 說明

```typescript
function getRegionWeight(
  commodity: CommodityId,
  region: ProductionRegion
): number {
  const map = COMMODITY_REGION_MAP[commodity];
  if (map.primary.includes(region)) return 1.0;
  if (map.secondary.includes(region)) return 0.35;
  return 0;
}
```

### 6.3 ENSO 對價格的漸進式影響

與天氣事件的 *尖銳脈衝* 不同，ENSO 是 *漸進偏移*：
- 每週對相關商品施加 `ensoIntensity × ensoDirectionMultiplier × 0.5%` 的價格偏移
- 反映市場對長期供應的預期調整

### 6.4 與玩家本地農場的隔離

- 玩家本地天氣只影響玩家的 yield，不 dispatch 到 FuturesMarketStore
- 玩家不會自己種的作物對全球價格造成影響（太小）
- 例外：玩家選擇「大農場」模式（未來 DLC），產量開始有市場比例時才納入

---

## 7. 附錄：真實世界參照表

### 7.1 ENSO 歷史參照（1950-2025）

| 年份 | 相位 | 強度 | 主要影響 |
|------|------|------|---------|
| 1982-83 | El Niño | Very Strong | 全球多處乾旱；巴西咖啡霜害 1983 |
| 1988-89 | La Niña | Strong | 美國 1988 大乾旱；1989 巴西霜害 |
| 1997-98 | El Niño | Very Strong | 印尼火災；東南亞乾旱 |
| 2007-08 | La Niña | Strong | 澳洲乾旱延續；俄羅斯小麥減產 |
| 2010-11 | La Niña | Strong | 泰國大洪水 2011；俄羅斯熱浪 2010 |
| 2015-16 | El Niño | Very Strong | 印尼乾旱火災；全球糧價跳動 |
| 2020-22 | La Niña | Triple-dip | 阿根廷 / 南巴西大豆減產連續三年 |
| 2023-24 | El Niño | Strong | 東南亞棕櫚減產；巴西咖啡波動 |

### 7.2 經典農產品災害年份

| 年份 | 事件 | 商品 | 價格影響 |
|------|------|------|---------|
| 1973 | 蘇聯「糧食大搶購」 | 小麥、大豆 | 翻倍 |
| 1975 | 巴西咖啡霜害 | 咖啡 | Arabica +300% |
| 1977 | 巴西咖啡霜害（世代級） | 咖啡 | +250% |
| 1983-85 | 西非可可危機 | 可可 | +180% |
| 1988 | 美國中西部大乾旱 | 玉米 / 大豆 / 小麥 | 玉米 +80% |
| 1989 | 佛州柳橙凍害 / 巴西霜害 | OJ / 咖啡 | OJ +120% |
| 1996 | 小麥庫存歷史低點 | 小麥 | +60% |
| 2004 | 南美大豆銹病 | 大豆 | +40% |
| 2010 | 俄羅斯熱浪 + 出口禁令 | 小麥 | +80% |
| 2011 | 泰國洪水 | 橡膠 / 稻米 | 橡膠 +50% |
| 2012 | 美國中西部乾旱 | 玉米 / 大豆 | 玉米 +60% |
| 2014-15 | 加州乾旱 | 果蔬 / 乳製品 | 多項上漲 |
| 2020 | 阿根廷 / 巴西南部乾旱 | 大豆 / 玉米 | +30% |
| 2021 | 巴西咖啡霜害 | 咖啡 | Arabica +90% |
| 2023 | 西非可可病害 + 天氣 | 可可 | +150%（歷史新高） |

### 7.3 主要產地真實對照

| 商品 | 現實主產國 | 遊戲 Region |
|------|-----------|------------|
| 玉米 | 美國 31%, 中國 23%, 巴西 11% | us_midwest, cn_northeast, br_central |
| 大豆 | 巴西 38%, 美國 32%, 阿根廷 14% | br_central, us_midwest, ar_pampas |
| 小麥（總） | 中國 17%, 印度 14%, 俄羅斯 11% | cn_central, in_punjab, ru_blacksea |
| 稻米 | 中國 28%, 印度 25%, 孟加拉 7% | cn_central, in_south, th_central |
| 咖啡 Arabica | 巴西 40%, 哥倫比亞 7% | br_south, af_east_coffee |
| 咖啡 Robusta | 越南 40%, 巴西 15% | vn_central, br_south |
| 可可 | 象牙海岸 45%, 迦納 20% | af_west_cocoa |
| 棕櫚油 | 印尼 58%, 馬來西亞 25% | my_id_palm |
| 橡膠 | 泰國 33%, 印尼 25%, 越南 8% | th_central, my_id_palm, vn_central |
| 柳橙汁 | 巴西 80% 濃縮汁、美國佛州 | us_florida, br_south |
| 棉花 | 中國 / 印度 / 美國 各約 20% | cn_central, in_punjab, us_south |
| 紅豆 Azuki | 日本北海道、中國東北 | jp_main, cn_northeast |
| 蘋果 Apple | 中國 50%（陝西、山東） | cn_central |
| 雞蛋 Egg | 中國 40%、美國、印度 | cn_central, cn_northeast |
| 花生 Peanut | 中國 38%、印度 13%、美國 6% | cn_central, in_punjab, us_south |

### 7.4 土壤類型地理對照（遊戲教學用）

| 土壤 | 現實典型地區 |
|------|-------------|
| Loam | 美國中西部、法國 Beauce、阿根廷 Pampas |
| Sandy | 美國喬治亞、中國東北部 |
| Clay | 泰國中部、越南湄公河、印度孟加拉 |
| Volcanic | 巴西 Cerrado、印尼爪哇、哥倫比亞、肯亞 |
| Humus | 烏克蘭黑土、美國愛荷華、阿根廷 Pampas |
| Saline | 印度西北、澳洲內陸、中國新疆 |
| Peat | 加拿大、北歐、印尼泥炭森林 |

---

## 附註：實作優先順序建議

1. **Phase 1（MVP）**：土壤 5 類型 + 4 季節 + 6 種天氣 + 8 個商品（玉米 / 大豆 / 小麥 / 咖啡 / 可可 / 糖 / 棉花 / OJ）
2. **Phase 2**：加入剩餘 21 商品 + ENSO 基礎週期 + 3 個歷史彩蛋（共 29 項 SSOT 完整覆蓋）
3. **Phase 3**：完整矩陣 + 所有歷史事件 + 進階視覺（shader 精修）
4. **Phase 4**：衛星農情、季節基差、期貨合約套利教學關卡

---

_文件結束_
