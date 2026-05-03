# 期貨 × 天氣經濟模型 Economic Model

> **商品清單 SSOT 聲明**：本文件商品清單以 `src/data/commodities.ts` 為準，如有不一致以該檔為主。共 29 項核可商品。
>
> 文件版本：v0.2
> 最後更新：2026-04-24
> 範圍：本文件定義 Farm Game 的價格引擎、期貨合約機制、玩家遊戲循環、29 種商品合約規格，以及與 `environmental-systems.md` 的資料介面。

---

## 0. 設計原則 Design Pillars

本經濟模型圍繞一個核心命題設計：

> **遊戲的戲劇性 = 天氣觸發價格波動，玩家用期貨對沖或投機，教玩家「真農民也是在做金融」。**

五項已確認的設計決策：

| 決策點 | 選擇 | 對模型的影響 |
|---|---|---|
| 資訊揭露 | 半透明：有新聞、有歷史價格，沒上帝視角，不顯示真實機率 | 引擎內部機率對玩家隱藏，只透過 NewsItem 暗示 |
| 期貨複雜度 | 中度：選合約月、保證金、可平倉、看即時 P&L，沒有選擇權跨月價差 | 合約只需定義一組 ContractMonth，無 Options 巢狀結構 |
| 天氣模型 | 週期驅動 + 歷史彩蛋：ENSO 2-7 年週期 + 偶爾重現 1988/2012 真實大旱 | ShockMultiplier 由 weather-systems 觸發，無需自行管理週期 |
| 時間壓縮 | 1 現實日 = 1 遊戲週，一年 52 分鐘 | priceTick 的粒度為「遊戲日」；52 週/年 |
| 農場範圍 | 單一農場 + 期貨代理參與外地 | 玩家 physicalInventory 只含自產，其他商品只能透過期貨持倉 |

---

## 一、價格引擎 Price Engine

### 1.1 核心公式

```
Spot(t)        = BasePrice × (1 + Drift·t + Noise(t)) × Π ShockMultiplier(activeEvents)
Futures(t, m)  = Spot(t) × CarryCost(t → m) × MarketExpectation(m)
Basis(t, m)    = Spot(t) − Futures(t, m)         // 收斂到 0 at delivery
```

### 1.2 各元素定義

| 符號 | 意義 | 典型數值 |
|---|---|---|
| `BasePrice` | 每商品的長期平均價（真實世界參考） | 玉米 $4.50/bu、大豆 $11.00/bu（見 §5） |
| `Drift` | 微小正向趨勢（通膨） | `~0.1%` / 遊戲年，即 `≈ 0.0019% / 遊戲日` |
| `Noise(t)` | 每日 Gaussian 小波動 | σ 依商品；玉米 `σ=0.008`（0.8%/日），黃金 `σ=0.004` |
| `ShockMultiplier` | 由天氣/災害/政治事件觸發的乘數 | 旱災 `×1.15 ~ ×1.45`、豐收 `×0.85` |
| `CarryCost` | 倉儲 + 利息，讓遠月 Futures > Spot（Contango） | `exp(r × daysToExpiry / 365)`，`r=5%` 年化 |
| `MarketExpectation` | 對該合約月的季節性預期 | 穀物秋收合約有收成壓低效應、肉類冬季需求溢價 |

### 1.3 每日 Tick 流程（偽代碼）

```
for each gameDay:
  1. 推進 Drift
  2. 抽 Gaussian Noise
  3. 套用 activeWeatherEvents 的 ShockMultiplier
  4. 對每個 ContractMonth：
     - 重新計算 CarryCost
     - 更新 MarketExpectation（若本週期有新新聞）
     - daysToExpiry 為 0 時強制 Futures = Spot
  5. 對 Portfolio 做 mark-to-market
  6. 檢查 Margin Call
  7. Push 新 PricePoint 到 history，供 K 線繪圖
```

### 1.4 TypeScript 函式骨架

```typescript
// src/systems/pricing/types.ts
export type CommodityId = string;                  // e.g. "CORN"
export type ContractMonth = `${number}-${number}`; // "2027-12"
export type GameDate = { year: number; week: number; day: number }; // 1-52 weeks, 1-7 days

export interface PricePoint {
  date: GameDate;
  spot: number;
  futuresByMonth: Record<ContractMonth, number>;
}

export interface PriceState {
  commodityId: CommodityId;
  basePrice: number;
  drift: number;                  // per game day
  noiseSigma: number;             // per game day
  spot: number;
  futures: Map<ContractMonth, number>;
  history: PricePoint[];          // ring buffer, e.g. last 4 game years (208 weeks)
  activeShocks: ShockInstance[];  // decaying multipliers
}

export interface ShockInstance {
  sourceEventId: string;
  multiplier: number;             // e.g. 1.25 means +25%
  appliedOn: GameDate;
  halfLifeDays: number;           // exponential decay
  remainingDays: number;
}

// src/systems/pricing/engine.ts
export function tickPriceDaily(
  state: PriceState,
  weather: WeatherEvent[],
  rng: SeededRng,
  today: GameDate,
): PriceState {
  const drifted = applyDrift(state, today);
  const noised = applyNoise(drifted, rng);
  const shocked = applyWeatherShocks(noised, weather, today);
  const decayed = decayShocks(shocked);
  const futures = recomputeFuturesCurve(decayed, today);
  const history = pushHistory(decayed, futures, today);
  return { ...decayed, futures, history };
}

export function applyShock(state: PriceState, event: WeatherEvent): PriceState {
  const sensitivity = WEATHER_SENSITIVITY[state.commodityId]; // from environmental-systems
  if (!sensitivity) return state;
  const multiplier = 1 + sensitivity.priceImpact * event.severity;
  const instance: ShockInstance = {
    sourceEventId: event.id,
    multiplier,
    appliedOn: event.startedOn,
    halfLifeDays: sensitivity.priceHalfLifeDays ?? 30,
    remainingDays: event.durationDays,
  };
  return { ...state, activeShocks: [...state.activeShocks, instance] };
}

export function convergeFuturesToSpot(
  state: PriceState,
  contractMonth: ContractMonth,
  daysToExpiry: number,
): PriceState {
  // Linear pull of the basis toward zero across the final 30 days
  const pullWindow = 30;
  if (daysToExpiry > pullWindow) return state;
  const weight = 1 - daysToExpiry / pullWindow;
  const prev = state.futures.get(contractMonth) ?? state.spot;
  const target = state.spot;
  const next = prev + (target - prev) * weight;
  const futures = new Map(state.futures);
  futures.set(contractMonth, next);
  return { ...state, futures };
}

// Helpers (stubs to be filled)
export function applyDrift(s: PriceState, d: GameDate): PriceState { /* ... */ return s; }
export function applyNoise(s: PriceState, rng: SeededRng): PriceState { /* ... */ return s; }
export function applyWeatherShocks(s: PriceState, w: WeatherEvent[], d: GameDate): PriceState { /* ... */ return s; }
export function decayShocks(s: PriceState): PriceState { /* ... */ return s; }
export function recomputeFuturesCurve(s: PriceState, d: GameDate): Map<ContractMonth, number> { /* ... */ return s.futures; }
export function pushHistory(s: PriceState, f: Map<ContractMonth, number>, d: GameDate): PricePoint[] { /* ... */ return s.history; }
```

### 1.5 設計備註

* **確定性**：所有隨機皆經 seeded RNG 串接（`save.rngSeed`），確保重播同一存檔得到相同價格序列。
* **效能預算**：29 商品 × 平均 ~6 合約月 × 每秒 1 tick（52 週/52 分鐘 ≈ 每 4.3 秒前進 1 遊戲週 = 每 0.6 秒前進 1 遊戲日）。引擎每 tick 必須 < 8ms。
* **history 截斷**：`history` 為 ring buffer，最多保留近 4 遊戲年 = 208 週 × 7 日 = 1456 筆。

---

## 二、期貨合約機制 Contract Mechanics

### 2.1 合約規格資料結構

```typescript
export interface ContractSpec {
  commodityId: CommodityId;
  symbol: string;              // e.g. "ZC" for corn
  contractUnit: number;        // e.g. 5000
  unitLabel: string;           // "bushel" | "lb" | "ton" | "oz" | "barrel"
  tickSize: number;            // e.g. 0.0025 ($/bushel)
  tickValue: number;           // e.g. 12.50 ($ per 1 tick per contract)
  initialMargin: number;       // e.g. 2200
  maintenanceMargin: number;   // e.g. 2000
  deliveryMonths: MonthCode[]; // ['H','K','N','U','Z'] etc.
  lastTradingDayRule: string;  // e.g. "business day prior to 15th of month"
  settlementType: 'physical' | 'cash';
}
```

### 2.2 玩家可執行操作

1. **開倉 Open**：`buy` 多頭 / `sell` 空頭，系統扣 `initialMargin × qty`。
2. **平倉 Close**：`reverse` 部分或全部倉位，釋放保證金 + 實現 P&L。
3. **實物交割 Physical Delivery**：到期時若持有多頭且有對應倉儲，入庫；空頭則出庫交付。
4. **現金結算 Cash Settlement**：到期自動以結算價差清算為現金。
5. **展延 Roll**：T-5 日前可一鍵「平近月 + 開遠月」，收取展延成本 = `|nearPrice - farPrice| × qty × contractUnit`。

### 2.3 保證金與爆倉機制

```
posted = Σ marginPosted
equity = cash + Σ (side × (spot - entryPrice) × qty × contractUnit)

if equity < Σ maintenanceMargin:
    status = 'margin_call'
    grace  = 3 game days
    if not topped up within grace:
        forced_liquidation(largest_loser_first)
```

新手緩衝：
* 前 4 遊戲年啟用 `beginnerMode=true`，Margin Call 給 **3 遊戲日**補繳期（否則 1 日）。
* 首次 Margin Call 觸發教學彈窗。
* 首年起始保證金打 8 折。

### 2.4 避險 vs 投機識別

```typescript
export function classifyPosition(p: Position, inventory: Map<CommodityId, number>): 'hedge' | 'speculation' {
  const phys = inventory.get(p.commodityId) ?? 0;
  const exposedUnits = p.quantity * CONTRACT_SPECS[p.commodityId].contractUnit;
  // Short futures + long physical = hedge
  if (p.side === 'short' && phys >= exposedUnits * 0.5) return 'hedge';
  // Long futures + short physical (forward-sold) = hedge
  if (p.side === 'long'  && phys <= -exposedUnits * 0.5) return 'hedge';
  return 'speculation';
}
```

UI 表現：
* 避險倉：綠色徽章「對沖 HEDGE」、顯示「對沖比率 73%」
* 投機倉：橙色徽章「投機 SPEC」、顯示「曝險 $X, VaR(95%) $Y」

---

## 三、玩家遊戲循環 Player Loop

### 3.1 一年 = 52 分鐘的節奏

```
春播期 Spring Planting (~13 分鐘, 週 1-13)
├─ 查看天氣預報（3-7 日短期、季節展望中期、ENSO 長期）
├─ 決定種植作物組合
├─ 預先避險：賣出秋收合約鎖定未來售價
└─ 或投機：純金融倉位，不種地也可做

夏季 Summer (~13 分鐘, 週 14-26)
├─ 作物生長動畫
├─ 隨機天氣事件觸發
├─ 新聞彈窗 → 期貨價格反應
├─ 玩家持續可開倉/平倉
└─ 持倉 mark-to-market 浮動 P&L 實時顯示

秋收 Autumn Harvest (~13 分鐘, 週 27-39)
├─ 實體作物收成
├─ 近月合約到期
├─ 決策：實物交割 vs 現金結算 vs 展延
├─ 年度 P&L 初步結算
└─ 報告：本年天氣事件回顧

冬季 Winter (~13 分鐘, 週 40-52)
├─ 年度財報
├─ 研究升級（新商品解鎖、設備購買）
├─ 計畫明年
└─ ENSO 週期狀態更新
```

### 3.2 每週關鍵節點

| 遊戲週 | 事件 |
|---|---|
| W1 | 春耕倒數通知、USDA Prospective Plantings 報告 |
| W8 | 種植進度報告 |
| W14 | Planting 收尾 + 首次天氣展望 |
| W20 | Acreage Report（修訂種植面積） |
| W24 | WASDE 更新（供需預估） |
| W27-32 | 秋收啟動，近月合約漸次到期 |
| W38 | Stocks Report |
| W45 | 年度 WASDE |
| W52 | 跨年結算、ENSO 指數公告 |

---

## 四、2012 大旱情境腳本（教學範例）

以下為**遊戲內會實際呈現**的事件時間線，用於新手引導第 3 章。背景：玩家擁有 100 英畝玉米地（預期產量 16,000 蒲式耳）、初始資金 $50,000。

### Day 1（4 月初，W1）
* **新聞**：NOAA 春季展望 —「美中大平原降雨高於平均，玉米播種順利」
* **價格**：玉米現貨 **$5.00/bu**、12 月合約 **$5.20/bu**
* **玩家 HUD**：天氣樂觀、期貨市場平靜
* **預計秋收收入**：$5.00 × 16,000 = $80,000

### Day 60（6 月初，W9）
* **新聞**：NOAA 發布拉尼娜警報 —「6-8 月中西部降雨低於平均機率 65%」
* **價格**：12 月合約上漲至 **$5.80/bu**（+11.5%）
* **現貨**：$5.10/bu（僅微幅上漲，因新作尚未採收）
* **UI**：遊戲彈出「避險建議」面板

### 玩家三種選擇路徑

| 路徑 | 操作 | 當下成本 |
|---|---|---|
| **A. 避險** | 賣 3 張 12 月玉米（5000bu × 3 = 15,000bu，覆蓋 94% 預期產量） | 初始保證金 $2,200 × 3 = $6,600 |
| **B. 投機** | 買 5 張 12 月玉米（押旱災） | $6,600 + $4,400 = $11,000 |
| **C. 觀望** | 不動作 | $0 |

### Day 90（7 月初，W13）
* **新聞**：「玉米帶遭遇 50 年一遇熱浪，作物 D2 乾旱面積達 65%」、「USDA 下修單產預估」
* **價格**：12 月合約 **$7.50/bu**（+44% from Day 1）、現貨 **$7.20/bu**
* **玩家 HUD**：作物預計減產 35%，實際產量預估降至 10,400 bu

### Day 120（8 月初，W17）
* **新聞**：「熱浪緩解但傷害已成，出口買家搶貨」
* **價格**：12 月合約 **$8.10/bu**（峰值）
* **Margin 檢查**：避險玩家（A）帳上浮虧 `(8.10 - 5.80) × 5000 × 3 = -$34,500`；但實體玉米市值上升 `(7.80 - 5.00) × 10,400 = +$29,120`，淨曝險大幅下降。

### Day 180（11 月初，W27，近月到期）
* **價格**：12 月合約 **$7.40/bu**（盤整回落）、現貨 **$7.30/bu**

### 三路徑結算結果

假設實際產量 10,400 bu（減產 35%）、現貨售價 $7.30/bu：

| 路徑 | 實體銷售 | 期貨損益 | 總收入 | 備註 |
|---|---|---|---|---|
| **A. 避險** | 10,400 × $7.30 = **$75,920** | `(5.80 − 7.40) × 5000 × 3 = -$24,000` | **$51,920** | 鎖定了早期 $5.80 價位；若不避險，收入=$75,920，看起來少賺？但**風險已知**。 |
| **B. 投機** | 10,400 × $7.30 = **$75,920** | `(7.40 − 5.80) × 5000 × 5 = +$40,000` | **$115,920** | 大贏，但若旱災未成真，$11,000 保證金可能全失。 |
| **C. 觀望** | 10,400 × $7.30 = **$75,920** | $0 | **$75,920** | 靠天吃飯，天幫忙了。 |

### 教學重點彈窗

> **避險不是賺最多，是風險最小。**
> 路徑 A 的玩家在 Day 60 就鎖定了年度收入區間 $50k–55k，無論之後漲跌都睡得著。
> 路徑 C 在 Day 90 看著乾旱新聞彈出時，若作物失敗則顆粒無收 → 破產風險。
> 路徑 B 是賭博，賭對了翻倍，賭錯了可能爆倉。

---

## 五、29 商品合約規格表

### 5.1 商品分類（以 SSOT `src/data/commodities.ts` 為準）

* **穀物 Grains (7)**：玉米、硬紅冬麥 (HRW)、軟紅冬麥 (SRW)、硬紅春麥 (HRS)、杜蘭麥、稻米、燕麥
* **油籽 Oilseeds (3)**：大豆、菜籽、棕櫚油
* **軟商品 Softs (5)**：阿拉比卡咖啡、羅布斯塔咖啡、可可、糖（甘蔗）、柳橙
* **畜產 Livestock (3)**：飼料牛、肉牛、瘦肉豬
* **乳製品 Dairy (4)**：Class III 牛奶、奶油、起司、脫脂奶粉 (NFDM)
* **工業 Industrial (3)**：棉花、橡膠、木材
* **亞洲特色 Asian Regional (4)**：紅豆、蘋果、雞蛋、花生

### 5.2 合約規格總覽（29 項 — 對應 SSOT `src/data/commodities.ts`）

| # | CommodityId | 中文 | 交易所 / Symbol | 單位 | 合約量 | 跳動點 $/單位 | Tick值 | 初始保證金 | 維持保證金 | 交割月 | 結算 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | corn | 玉米 | CBOT / ZC | bushel | 5,000 | 0.0025 | $12.50 | $2,200 | $2,000 | H,K,N,U,Z | 實物 |
| 2 | wheat_hrw | 硬紅冬麥 | KCBT / KW | bushel | 5,000 | 0.0025 | $12.50 | $2,400 | $2,200 | H,K,N,U,Z | 實物 |
| 3 | wheat_srw | 軟紅冬麥 | CBOT / ZW | bushel | 5,000 | 0.0025 | $12.50 | $2,100 | $1,900 | H,K,N,U,Z | 實物 |
| 4 | wheat_hrs | 硬紅春麥 | MGEX / MW | bushel | 5,000 | 0.0025 | $12.50 | $2,500 | $2,300 | H,K,N,U,Z | 實物 |
| 5 | wheat_durum | 杜蘭麥 | MGEX / DW | bushel | 5,000 | 0.0025 | $12.50 | $2,200 | $2,000 | H,K,N,U,Z | 現金 |
| 6 | rice | 稻米 | CBOT / ZR | cwt | 2,000 | 0.005 | $10.00 | $1,800 | $1,600 | F,H,K,N,U,X | 實物 |
| 7 | oats | 燕麥 | CBOT / ZO | bushel | 5,000 | 0.0025 | $12.50 | $1,000 | $900 | H,K,N,U,Z | 實物 |
| 8 | soybean | 大豆 | CBOT / ZS | bushel | 5,000 | 0.0025 | $12.50 | $3,500 | $3,200 | F,H,K,N,Q,U,X | 實物 |
| 9 | canola | 菜籽 | ICE Canada / RS | metric ton | 20 | 0.10 | $2.00 | $1,400 | $1,300 | F,H,K,N,X | 實物 |
| 10 | palm_oil | 棕櫚油 | Bursa MDEX / FCPO | metric ton | 25 | 1.00 | $25.00 | $2,500 | $2,300 | 每月 (F-Z) | 實物 |
| 11 | coffee_arabica | 阿拉比卡咖啡 | ICE US / KC | lb | 37,500 | 0.0005 | $18.75 | $5,500 | $5,000 | H,K,N,U,Z | 實物 |
| 12 | coffee_robusta | 羅布斯塔咖啡 | ICE London / RC | metric ton | 10 | 1.00 | $10.00 | $2,800 | $2,500 | F,H,K,N,U,X | 實物 |
| 13 | cocoa | 可可 | ICE US / CC | metric ton | 10 | 1.00 | $10.00 | $2,900 | $2,600 | H,K,N,U,Z | 實物 |
| 14 | sugar | 糖（甘蔗） | ICE US / SB | lb | 112,000 | 0.0001 | $11.20 | $1,400 | $1,250 | H,K,N,V | 實物 |
| 15 | orange_juice | 柳橙 | ICE US / OJ | lb | 15,000 | 0.0005 | $7.50 | $2,000 | $1,800 | F,H,K,N,U,X | 實物 |
| 16 | feeder_cattle | 飼料牛 | CME / GF | lb | 50,000 | 0.00025 | $12.50 | $3,300 | $3,000 | F,H,J,K,Q,U,V,X | 現金 |
| 17 | live_cattle | 肉牛 | CME / LE | lb | 40,000 | 0.00025 | $10.00 | $2,800 | $2,500 | G,J,M,Q,V,Z | 實物 |
| 18 | lean_hogs | 瘦肉豬 | CME / HE | lb | 40,000 | 0.00025 | $10.00 | $1,900 | $1,700 | G,J,K,M,N,Q,V,Z | 現金 |
| 19 | milk_class_iii | Class III 牛奶 | CME / DC | cwt (200,000 lb) | 1 | 0.01 | $20.00 | $2,200 | $2,000 | 每月 | 現金 |
| 20 | butter | 奶油 | CME / CB | lb | 20,000 | 0.0025 | $50.00 | $1,800 | $1,600 | 每月 | 現金 |
| 21 | cheese | 起司 | CME / CSC | lb | 20,000 | 0.001 | $20.00 | $1,800 | $1,600 | 每月 | 現金 |
| 22 | nfdm | 脫脂奶粉 | CME / GNF | lb | 44,000 | 0.00025 | $11.00 | $1,500 | $1,350 | 每月 | 現金 |
| 23 | cotton | 棉花 | ICE US / CT | lb | 50,000 | 0.0001 | $5.00 | $3,200 | $2,900 | H,K,N,V,Z | 實物 |
| 24 | rubber | 橡膠 | TOCOM / SHFE | kg | 5,000 | 0.1 JPY | 約 $3.50 | $2,000 | $1,800 | 每月 | 實物 |
| 25 | lumber | 木材 | CME / LBR | board ft | 27,500 | 0.50 | $13.75 | $2,500 | $2,300 | F,H,K,N,U,X | 實物 |
| 26 | azuki_bean | 紅豆 | TOCOM | kg | 2,400 | 10 JPY | 約 $160 | $1,500 | $1,350 | G,J,M,Q,V,Z | 實物 |
| 27 | apple | 蘋果 | Zhengzhou / AP | kg | 10,000 | 1 CNY | 約 $1,400 | $1,800 | $1,600 | F,H,K,N,V,Z | 實物 |
| 28 | egg | 雞蛋 | Dalian / JD | kg | 5,000 | 1 CNY | 約 $700 | $1,500 | $1,350 | F,H,K,N,U,X | 實物 |
| 29 | peanut | 花生 | Dalian / PK | kg | 5,000 | 2 CNY | 約 $1,400 | $1,600 | $1,450 | F,H,K,N,V | 實物 |

**月份代碼**：F=1月 G=2月 H=3月 J=4月 K=5月 M=6月 N=7月 Q=8月 U=9月 V=10月 X=11月 Z=12月

> **移除說明**（與本文件上一版 v0.1 相比）：已移除 `SOYBEAN_OIL` / `SOYBEAN_MEAL` / `SUNFLOWER` / `CHICKEN` / `WHEY` / `CRUDE_OIL` / `NATURAL_GAS` / `UREA` / `POTASH` / `GOLD` / `SILVER` 等非 SSOT 商品；新增 `wheat_hrs` / `wheat_durum` / `palm_oil` / `coffee_robusta` / `feeder_cattle` / `nfdm` / `rubber` / `lumber` / `azuki_bean` / `apple` / `egg` / `peanut`。TODO：部分亞洲合約的保證金 / 跳動點為估算值，待產品進入實作期以 CME / TOCOM / ZCE / DCE 官方最新規格覆核。

### 5.3 參考價格表（BasePrice，以 SSOT 為準）

以下為 2020-2024 平均參考值，遊戲啟動時作為 BasePrice 初始化。完整欄位及 `dailyVolatility` 請見 `src/data/commodities.ts` 的 `COMMODITIES` 常數。

| CommodityId | BasePrice | σ/日 | CommodityId | BasePrice | σ/日 |
|---|---|---|---|---|---|
| corn | $4.50/bu | 0.008 | feeder_cattle | $2.40/lb | 0.007 |
| wheat_hrw | $6.20/bu | 0.010 | live_cattle | $1.75/lb | 0.006 |
| wheat_srw | $5.80/bu | 0.010 | lean_hogs | $0.95/lb | 0.011 |
| wheat_hrs | $6.80/bu | 0.011 | milk_class_iii | $18.50/cwt | 0.008 |
| wheat_durum | $8.20/bu | 0.012 | butter | $2.40/lb | 0.009 |
| rice | $14.50/cwt | 0.007 | cheese | $1.80/lb | 0.009 |
| oats | $3.40/bu | 0.010 | nfdm | $1.20/lb | 0.009 |
| soybean | $11.00/bu | 0.009 | cotton | $0.72/lb | 0.009 |
| canola | $640/mt | 0.009 | rubber | $1.60/kg | 0.012 |
| palm_oil | $900/mt | 0.012 | lumber | $550/Mbf | 0.018 |
| coffee_arabica | $1.80/lb | 0.012 | azuki_bean | $140/bag | 0.011 |
| coffee_robusta | $2,200/mt | 0.012 | apple | $1.10/kg | 0.013 |
| cocoa | $3,200/mt | 0.011 | egg | $1.30/kg | 0.014 |
| sugar | $0.20/lb | 0.010 | peanut | $1.20/kg | 0.011 |
| orange_juice | $1.60/lb | 0.014 | — | — | — |

---

## 六、資料結構 Data Structures

### 6.1 核心型別

```typescript
import { z } from 'zod';

export const ContractMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const PositionSchema = z.object({
  id: z.string().uuid(),
  commodityId: z.string(),
  contractMonth: ContractMonthSchema,
  side: z.enum(['long', 'short']),
  quantity: z.number().int().positive(),      // number of contracts
  entryPrice: z.number().positive(),
  entryDate: z.object({
    year: z.number().int(),
    week: z.number().int().min(1).max(52),
    day: z.number().int().min(1).max(7),
  }),
  marginPosted: z.number().nonnegative(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
});
export type Position = z.infer<typeof PositionSchema>;

export interface PositionWithComputed extends Position {
  currentPrice: number;        // live futures price
  markToMarket: number;        // (currentPrice - entryPrice) × qty × unit × side
  unrealizedPnL: number;       // == markToMarket
  classification: 'hedge' | 'speculation';
}

export const PortfolioSchema = z.object({
  cash: z.number(),
  positions: z.array(PositionSchema),
  physicalInventory: z.record(z.string(), z.number()),  // CommodityId -> units
  ledger: z.array(z.object({
    date: z.object({ year: z.number(), week: z.number(), day: z.number() }),
    kind: z.enum(['open', 'close', 'margin_add', 'margin_call', 'liquidation', 'delivery', 'settle']),
    commodityId: z.string().optional(),
    amount: z.number(),
    note: z.string().optional(),
  })),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;

export interface PortfolioDerived {
  totalEquity: number;         // cash + Σ markToMarket
  postedMargin: number;        // Σ position.marginPosted
  availableMargin: number;     // totalEquity - Σ maintenanceMargin
  marginCallActive: boolean;
  graceDaysRemaining: number;
}

// Contract & Market
export interface ContractSpec {
  commodityId: CommodityId;
  symbol: string;
  contractUnit: number;
  unitLabel: 'bushel' | 'lb' | 'cwt' | 'short_ton' | 'metric_ton' | 'troy_oz' | 'barrel' | 'MMBtu';
  tickSize: number;
  tickValue: number;
  initialMargin: number;
  maintenanceMargin: number;
  deliveryMonths: MonthCode[];
  lastTradingDayRule: string;
  settlementType: 'physical' | 'cash';
}

export type MonthCode = 'F'|'G'|'H'|'J'|'K'|'M'|'N'|'Q'|'U'|'V'|'X'|'Z';

// Market Event & News (consumed from environmental-systems)
export interface WeatherEvent {
  id: string;
  kind: 'drought' | 'flood' | 'frost' | 'heat_wave' | 'hurricane' | 'ideal';
  severity: number;                 // 0-1
  regions: string[];
  startedOn: GameDate;
  durationDays: number;
  affectedCommodities: CommodityId[];
}

export interface NewsItem {
  id: string;
  publishedOn: GameDate;
  headline: string;
  body: string;
  tags: ('weather' | 'report' | 'geopolitics' | 'crop_condition' | 'margin')[];
  linkedEventId?: string;
  priceImpactHint?: 'bullish' | 'bearish' | 'neutral';  // 半透明資訊揭露
}

// Sensitivity map (consumed from environmental-systems)
export interface WeatherSensitivity {
  commodityId: CommodityId;
  eventKind: WeatherEvent['kind'];
  yieldImpact: number;              // multiplier on harvest, e.g. 0.65 for drought
  priceImpact: number;              // multiplier delta per severity, e.g. 0.45 means +45% at severity=1
  priceHalfLifeDays: number;
}
```

### 6.2 訂單型別

```typescript
export const OrderSchema = z.object({
  id: z.string().uuid(),
  commodityId: z.string(),
  contractMonth: ContractMonthSchema,
  side: z.enum(['buy', 'sell']),
  quantity: z.number().int().positive(),
  kind: z.enum(['market', 'limit', 'stop', 'stop_limit']),
  limitPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeInForce: z.enum(['day', 'gtc']),
  placedOn: z.object({ year: z.number(), week: z.number(), day: z.number() }),
  status: z.enum(['pending', 'filled', 'partial', 'cancelled', 'rejected']),
  filledQuantity: z.number().int().nonnegative(),
  avgFillPrice: z.number().nonnegative().optional(),
});
export type Order = z.infer<typeof OrderSchema>;
```

### 6.3 Zustand Store 範例

```typescript
// src/stores/marketStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MarketStore {
  prices: Record<CommodityId, PriceState>;
  contracts: Record<CommodityId, ContractSpec>;
  news: NewsItem[];
  tick: (today: GameDate, weather: WeatherEvent[]) => void;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    (set) => ({
      prices: {},
      contracts: {},
      news: [],
      tick: (today, weather) => set((s) => ({
        prices: Object.fromEntries(
          Object.entries(s.prices).map(([id, state]) => [
            id,
            tickPriceDaily(state, weather, rng, today),
          ]),
        ),
      })),
    }),
    { name: 'farm-game-market', version: 1 },
  ),
);

// src/stores/portfolioStore.ts
interface PortfolioStore {
  portfolio: Portfolio;
  placeOrder: (order: Order) => { ok: true } | { ok: false; reason: string };
  closePosition: (positionId: string, quantity: number) => void;
  rollPosition: (positionId: string, newMonth: ContractMonth) => void;
  settleDelivery: (positionId: string, mode: 'physical' | 'cash') => void;
}
```

---

## 七、UI 設計提示

本節不繪製原型，僅列資料流對應的視圖需求。

### 7.1 K 線圖（CandlestickChart）
* 日線，支援切換近月 / 次近月
* 疊加：歷史大事件時間軸 pin（2012 旱災等彩蛋）、天氣事件色塊
* 推薦套件：`lightweight-charts` 或自刻 `<canvas>`

### 7.2 持倉面板（PositionsPanel）
* 每列顯示：商品、合約月、多空、數量、入場價、當前價、浮動 P&L、保證金、分類徽章（HEDGE/SPEC）
* 滑鼠懸停：顯示 VaR(95%) 與若全倉平倉的淨利

### 7.3 新聞 Feed（NewsFeed）
* 天氣事件、產地災害、期貨報價突變（> 2σ）、官方報告
* 三類標記顏色：看漲/看跌/中性，但**不顯示機率數字**

### 7.4 交易面板（OrderTicket）
* 快速下單：市價 / 限價 / 停損
* 合約月下拉（列 daysToExpiry）
* 即時保證金估算與爆倉距離
* 「一鍵避險」按鈕：若有實體作物，自動計算建議空頭口數

### 7.5 避險建議小工具（HedgeAdvisor）
* 顯示「本倉位對沖比率 X%」
* 建議補差：例「還需賣 1 張 12 月玉米以達到 100% 對沖」

---

## 八、平衡與難度設計

### 8.1 新手保護（遊戲前 4 年）

| 項目 | 設定 |
|---|---|
| Margin Call 緩衝 | 3 遊戲日 |
| 初始保證金折扣 | 首年 × 0.8、第 2 年 × 0.9 |
| 波動性倍率 | 首年 × 0.7、第 2 年 × 0.85 |
| 天氣彩蛋機率 | 首 2 年關閉（無 1988/2012 等極端事件） |
| 教學彈窗 | 首次 Margin Call、首次到期、首次展延各觸發一次 |
| 自動避險建議 | 顯示 |

### 8.2 難度梯度

```typescript
export function getDifficulty(gameYear: number): Difficulty {
  return {
    noiseMultiplier: Math.min(1 + 0.05 * (gameYear - 1), 1.4),
    shockIntensityMultiplier: Math.min(1 + 0.08 * (gameYear - 1), 1.6),
    easterEggEventChance: gameYear >= 3 ? 0.15 + 0.02 * gameYear : 0,
    beginnerMode: gameYear <= 4,
  };
}
```

### 8.3 勝利條件（開放式）

玩家可自選主題：
* **純沙盒**：永久經營
* **ROI 挑戰**：10 年內 ROI 達標
* **金額目標**：凈值達 $5M
* **社群排行榜**：匯出年度 P&L JSON（不上傳後端，本地分享）

---

## 九、與 environmental-systems.md 的介面

### 9.1 消費的資料

```typescript
import { WEATHER_SENSITIVITY, SeasonState } from './environmental-systems';

// Used by price engine tick
function computeShockMultiplier(events: WeatherEvent[], commodityId: CommodityId): number {
  return events.reduce((acc, e) => {
    const s = WEATHER_SENSITIVITY[commodityId]?.[e.kind];
    if (!s) return acc;
    return acc * (1 + s.priceImpact * e.severity);
  }, 1);
}

// Used by harvest logic
function computeYieldMultiplier(events: WeatherEvent[], commodityId: CommodityId): number { /* similar */ }

// Used by contract expiry scheduler
function deliveriesThisSeason(season: SeasonState): CommodityId[] {
  // e.g. autumn -> [CORN, SOYBEAN, WHEAT_SRW, ...]
  return CROPS_HARVESTED_BY_SEASON[season];
}
```

### 9.2 契約邊界（避免重複定義）

* **不在本文件定義**：天氣事件矩陣、ENSO 週期模型、地區地圖。那些在 `environmental-systems.md`。
* **本文件負責**：價格如何因天氣變動、期貨合約細節、玩家帳戶/下單流程、商品規格表。

### 9.3 事件流向

```
[environmental-systems]
    emitsWeatherEvent(e) ──▶ [market event bus]
                                    │
                                    ├──▶ [price engine]: applyShock()
                                    ├──▶ [news generator]: makeNewsItem(e)
                                    └──▶ [portfolio]: recomputeMarkToMarket()

[environmental-systems]
    emitsHarvest(season, yieldByCrop) ──▶ [portfolio.physicalInventory.add()]
                                     ──▶ [contract expiry]: trigger settlement
```

---

## 十、開放決策清單（需使用者確認）

以下項目在寫作過程中發現需要產品決策，建議在進入實作前敲定：

1. **手續費與滑價**：本文假設為 0（教學清晰）。是否加入每張 $2-5 手續費與 1 tick 滑價？會大幅影響小資金玩家的操作邊際，但更擬真。
2. **期貨槓桿上限**：目前用各商品真實 CME 保證金，槓桿 ~10-20×。是否對新手強制更嚴（例如 5×）？
3. **價格暫停熔斷**：CME 有每日漲跌停板。要不要加？建議加，否則旱災日 +30% 會讓新手瞬間爆倉。
4. **保證金幣別**：全部 USD？還是有匯率系統？本文假設純 USD。
5. **夜間/假日跳空**：本遊戲每遊戲日都交易，無跳空。真實市場有週末跳空，要不要加彩蛋？
6. **持倉數量上限**：避免玩家用數學漏洞 exploitation（例如極端倉位觸發引擎數值爆炸），建議單商品單方向最多 50 張。
7. **交割實物倉儲成本**：若玩家實物交割得到 5000 bu 玉米，是否收月度倉儲費？真實市場有，但遊戲內會讓交割路徑變冷門。
8. **勝利/失敗定義**：是否需要明確「破產=Game Over」還是「破產=重啟但保留成就」？
9. **ENSO 週期的玩家可視程度**：目前決策是「半透明，有新聞」，但具體到什麼程度？例如 NOAA SST 數值要不要顯示？
10. **多帳戶/家族帳戶**：同一存檔是否允許切換角色（主業農 vs 投機帳戶）？會影響 Portfolio 結構。
11. **K 線時框**：目前只定義日線。要不要加週線、月線切換？
12. **「作物保險」產品**：現實中農民也買作物保險（RMA）。要不要加入第三種風險管理工具（期貨 + 實物 + 保險）？會讓模型更完整但教學曲線變陡。

---

## 附錄 A：縮寫對照

| 縮寫 | 全稱 | 意義 |
|---|---|---|
| P&L | Profit and Loss | 盈虧 |
| MTM | Mark-to-Market | 逐日盯市 |
| WASDE | World Agricultural Supply and Demand Estimates | USDA 月度供需報告 |
| ENSO | El Niño Southern Oscillation | 聖嬰現象週期 |
| CME | Chicago Mercantile Exchange | 芝加哥商品交易所 |
| VaR | Value at Risk | 風險值 |
| Contango | —— | 遠月 > 近月，正常倉儲成本市場結構 |
| Backwardation | —— | 遠月 < 近月，逆價差，供給短缺訊號 |
| Basis | —— | 現貨 − 期貨 |
| Roll | —— | 展期，平近月開遠月 |

## 附錄 B：檔案規劃

```
src/
├── systems/
│   ├── pricing/
│   │   ├── types.ts               // PriceState, ShockInstance ...
│   │   ├── engine.ts              // tickPriceDaily, applyShock, ...
│   │   ├── futuresCurve.ts        // CarryCost, MarketExpectation
│   │   └── history.ts             // ring buffer
│   ├── contracts/
│   │   ├── specs.ts               // CONTRACT_SPECS[29] — 匯入 src/data/commodities.ts 的 COMMODITIES 並補上保證金/Tick 欄位
│   │   ├── expiry.ts              // 到期調度
│   │   └── delivery.ts            // 實物/現金結算
│   ├── portfolio/
│   │   ├── orders.ts              // placeOrder, validateOrder
│   │   ├── margin.ts              // marginCall, liquidation
│   │   ├── classify.ts            // hedge vs speculation
│   │   └── ledger.ts
│   └── news/
│       └── generator.ts
├── stores/
│   ├── marketStore.ts
│   ├── portfolioStore.ts
│   └── gameClockStore.ts
└── ui/
    ├── charts/CandlestickChart.tsx
    ├── panels/PositionsPanel.tsx
    ├── panels/OrderTicket.tsx
    ├── panels/NewsFeed.tsx
    └── panels/HedgeAdvisor.tsx
```

— End of Document —
