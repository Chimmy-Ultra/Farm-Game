/**
 * 所有商品的唯一真相來源 (Single Source of Truth, SSOT)
 *
 * 三份 docs 文件（environmental-systems.md / asset-prompts.md / economic-model.md）
 * 的商品清單必須與此檔案一致。若有不一致，以此檔案為主。
 *
 * 依使用者 2026-04-24 核可的清單建立。
 *
 * 總計 29 項商品，分布於 7 大分類：
 *   - 穀物 Grains: 7
 *   - 油籽 Oilseeds: 3
 *   - 軟商品 Softs: 5
 *   - 畜產 Livestock: 3
 *   - 乳製品 Dairy: 4
 *   - 工業 Industrial: 3
 *   - 亞洲特色 Asian Regional: 4
 */

// ============================================================
// Commodity ID enum (29 項)
// ============================================================

export const COMMODITY_IDS = [
  // 穀物 Grains (7)
  'corn',
  'wheat_hrw',
  'wheat_srw',
  'wheat_hrs',
  'wheat_durum',
  'rice',
  'oats',
  // 油籽 Oilseeds (3)
  'soybean',
  'canola',
  'palm_oil',
  // 軟商品 Softs (5)
  'coffee_arabica',
  'coffee_robusta',
  'cocoa',
  'sugar',
  'orange_juice',
  // 畜產 Livestock (3)
  'feeder_cattle',
  'live_cattle',
  'lean_hogs',
  // 乳製品 Dairy (4)
  'milk_class_iii',
  'butter',
  'cheese',
  'nfdm',
  // 工業 Industrial (3)
  'cotton',
  'rubber',
  'lumber',
  // 亞洲特色 Asian Regional (4)
  'azuki_bean',
  'apple',
  'egg',
  'peanut',
] as const;

export type CommodityId = (typeof COMMODITY_IDS)[number];

// ============================================================
// Category enum
// ============================================================

export const COMMODITY_CATEGORIES = [
  'grain',
  'oilseed',
  'soft',
  'livestock',
  'dairy',
  'industrial',
  'asian',
] as const;

export type CommodityCategory = (typeof COMMODITY_CATEGORIES)[number];

// ============================================================
// Contract month code
// ============================================================

/**
 * CME/CBOT/ICE 期貨月份代碼：
 *   F=Jan  G=Feb  H=Mar  J=Apr  K=May  M=Jun
 *   N=Jul  Q=Aug  U=Sep  V=Oct  X=Nov  Z=Dec
 */
export type MonthCode =
  | 'F' | 'G' | 'H' | 'J' | 'K' | 'M'
  | 'N' | 'Q' | 'U' | 'V' | 'X' | 'Z';

// ============================================================
// Spec interface
// ============================================================

export interface CommoditySpec {
  /** 唯一識別碼 */
  id: CommodityId;
  /** 中文名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 分類 */
  category: CommodityCategory;
  /** 主要交易所 */
  exchange: string;
  /** 交易所合約代號 (e.g. 'ZC' for Corn) */
  symbol: string;
  /** 合約月份列表 */
  contractMonths: MonthCode[];
  /** 是否為多年生（樹/木本） */
  perennial: boolean;
  /** 主產區（可能多個）。參照 environmental-systems.md §4.7 */
  primaryRegion: string;
  /** 次要產區（可能多個） */
  secondaryRegions?: string[];
  /** 基準價格 (USD)，與 unitLabel 搭配 */
  basePrice: number;
  /** 基準價格的計價單位 */
  unitLabel: string;
  /** 每日價格變動標準差 σ（例：0.008 = 0.8%/日） */
  dailyVolatility: number;
  /** 合約單位（例：5000 bu / contract） */
  contractUnit?: number;
  /** 結算方式 */
  settlement?: 'physical' | 'cash';
}

// ============================================================
// The SSOT table
// ============================================================

export const COMMODITIES: Record<CommodityId, CommoditySpec> = {
  // ---------------- 穀物 Grains ----------------
  corn: {
    id: 'corn',
    nameZh: '玉米',
    nameEn: 'Corn',
    category: 'grain',
    exchange: 'CBOT',
    symbol: 'ZC',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: false,
    primaryRegion: 'us_midwest',
    secondaryRegions: ['br_central', 'ar_pampas', 'cn_northeast', 'ca_prairies'],
    basePrice: 4.5,
    unitLabel: 'bushel',
    dailyVolatility: 0.008,
    contractUnit: 5000,
    settlement: 'physical',
  },
  wheat_hrw: {
    id: 'wheat_hrw',
    nameZh: '硬紅冬麥',
    nameEn: 'Hard Red Winter Wheat',
    category: 'grain',
    exchange: 'KCBT',
    symbol: 'KW',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: false,
    primaryRegion: 'us_plains',
    secondaryRegions: ['ru_blacksea', 'au_wheat'],
    basePrice: 6.2,
    unitLabel: 'bushel',
    dailyVolatility: 0.01,
    contractUnit: 5000,
    settlement: 'physical',
  },
  wheat_srw: {
    id: 'wheat_srw',
    nameZh: '軟紅冬麥',
    nameEn: 'Soft Red Winter Wheat',
    category: 'grain',
    exchange: 'CBOT',
    symbol: 'ZW',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: false,
    primaryRegion: 'us_midwest',
    secondaryRegions: ['eu_france', 'eu_blacksea'],
    basePrice: 5.8,
    unitLabel: 'bushel',
    dailyVolatility: 0.01,
    contractUnit: 5000,
    settlement: 'physical',
  },
  wheat_hrs: {
    id: 'wheat_hrs',
    nameZh: '硬紅春麥',
    nameEn: 'Hard Red Spring Wheat',
    category: 'grain',
    exchange: 'MGEX',
    symbol: 'MW',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: false,
    primaryRegion: 'us_plains',
    secondaryRegions: ['ca_prairies'],
    basePrice: 6.8,
    unitLabel: 'bushel',
    dailyVolatility: 0.011,
    contractUnit: 5000,
    settlement: 'physical',
  },
  wheat_durum: {
    id: 'wheat_durum',
    nameZh: '杜蘭麥',
    nameEn: 'Durum Wheat',
    category: 'grain',
    exchange: 'MGEX',
    symbol: 'DW',
    // 杜蘭麥期貨流動性極低；沿用 MW 月份
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: false,
    primaryRegion: 'ca_prairies',
    secondaryRegions: ['us_plains', 'eu_france'],
    basePrice: 8.2,
    unitLabel: 'bushel',
    dailyVolatility: 0.012,
    contractUnit: 5000,
    settlement: 'cash',
  },
  rice: {
    id: 'rice',
    nameZh: '稻米',
    nameEn: 'Rough Rice',
    category: 'grain',
    exchange: 'CBOT',
    symbol: 'ZR',
    contractMonths: ['F', 'H', 'K', 'N', 'U', 'X'],
    perennial: false,
    primaryRegion: 'th_central',
    secondaryRegions: ['cn_central', 'in_south', 'us_south', 'jp_main'],
    basePrice: 14.5,
    unitLabel: 'cwt',
    dailyVolatility: 0.007,
    contractUnit: 2000,
    settlement: 'physical',
  },
  oats: {
    id: 'oats',
    nameZh: '燕麥',
    nameEn: 'Oats',
    category: 'grain',
    exchange: 'CBOT',
    symbol: 'ZO',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: false,
    primaryRegion: 'ca_prairies',
    secondaryRegions: ['us_midwest'],
    basePrice: 3.4,
    unitLabel: 'bushel',
    dailyVolatility: 0.01,
    contractUnit: 5000,
    settlement: 'physical',
  },

  // ---------------- 油籽 Oilseeds ----------------
  soybean: {
    id: 'soybean',
    nameZh: '大豆',
    nameEn: 'Soybean',
    category: 'oilseed',
    exchange: 'CBOT',
    symbol: 'ZS',
    contractMonths: ['F', 'H', 'K', 'N', 'Q', 'U', 'X'],
    perennial: false,
    primaryRegion: 'br_central',
    secondaryRegions: ['us_midwest', 'ar_pampas', 'cn_northeast'],
    basePrice: 11.0,
    unitLabel: 'bushel',
    dailyVolatility: 0.009,
    contractUnit: 5000,
    settlement: 'physical',
  },
  canola: {
    id: 'canola',
    nameZh: '菜籽',
    nameEn: 'Canola',
    category: 'oilseed',
    exchange: 'ICE Canada',
    symbol: 'RS',
    contractMonths: ['F', 'H', 'K', 'N', 'X'],
    perennial: false,
    primaryRegion: 'ca_prairies',
    secondaryRegions: ['eu_france', 'au_wheat'],
    basePrice: 640,
    unitLabel: 'metric_ton',
    dailyVolatility: 0.009,
    contractUnit: 20,
    settlement: 'physical',
  },
  palm_oil: {
    id: 'palm_oil',
    nameZh: '棕櫚油',
    nameEn: 'Palm Oil',
    category: 'oilseed',
    exchange: 'Bursa MDEX',
    symbol: 'FCPO',
    contractMonths: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
    perennial: true,
    primaryRegion: 'my_id_palm',
    secondaryRegions: [],
    basePrice: 900,
    unitLabel: 'metric_ton',
    dailyVolatility: 0.012,
    contractUnit: 25,
    settlement: 'physical',
  },

  // ---------------- 軟商品 Softs ----------------
  coffee_arabica: {
    id: 'coffee_arabica',
    nameZh: '阿拉比卡咖啡',
    nameEn: 'Arabica Coffee',
    category: 'soft',
    exchange: 'ICE US',
    symbol: 'KC',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: true,
    primaryRegion: 'br_south',
    secondaryRegions: ['af_east_coffee', 'vn_central'],
    basePrice: 1.8,
    unitLabel: 'lb',
    dailyVolatility: 0.012,
    contractUnit: 37500,
    settlement: 'physical',
  },
  coffee_robusta: {
    id: 'coffee_robusta',
    nameZh: '羅布斯塔咖啡',
    nameEn: 'Robusta Coffee',
    category: 'soft',
    exchange: 'ICE London',
    symbol: 'RC',
    contractMonths: ['F', 'H', 'K', 'N', 'U', 'X'],
    perennial: true,
    primaryRegion: 'vn_central',
    secondaryRegions: ['in_south', 'br_south'],
    basePrice: 2200,
    unitLabel: 'metric_ton',
    dailyVolatility: 0.012,
    contractUnit: 10,
    settlement: 'physical',
  },
  cocoa: {
    id: 'cocoa',
    nameZh: '可可',
    nameEn: 'Cocoa',
    category: 'soft',
    exchange: 'ICE US',
    symbol: 'CC',
    contractMonths: ['H', 'K', 'N', 'U', 'Z'],
    perennial: true,
    primaryRegion: 'af_west_cocoa',
    secondaryRegions: ['br_south'],
    basePrice: 3200,
    unitLabel: 'metric_ton',
    dailyVolatility: 0.011,
    contractUnit: 10,
    settlement: 'physical',
  },
  sugar: {
    id: 'sugar',
    nameZh: '糖（甘蔗）',
    nameEn: 'Sugar (Cane)',
    category: 'soft',
    exchange: 'ICE US',
    symbol: 'SB',
    contractMonths: ['H', 'K', 'N', 'V'],
    perennial: true,
    primaryRegion: 'br_northeast',
    secondaryRegions: ['in_south', 'th_central', 'us_florida'],
    basePrice: 0.2,
    unitLabel: 'lb',
    dailyVolatility: 0.01,
    contractUnit: 112000,
    settlement: 'physical',
  },
  orange_juice: {
    id: 'orange_juice',
    nameZh: '柳橙',
    nameEn: 'Orange Juice',
    category: 'soft',
    exchange: 'ICE US',
    symbol: 'OJ',
    contractMonths: ['F', 'H', 'K', 'N', 'U', 'X'],
    perennial: true,
    primaryRegion: 'us_florida',
    secondaryRegions: ['br_south'],
    basePrice: 1.6,
    unitLabel: 'lb',
    dailyVolatility: 0.014,
    contractUnit: 15000,
    settlement: 'physical',
  },

  // ---------------- 畜產 Livestock ----------------
  feeder_cattle: {
    id: 'feeder_cattle',
    nameZh: '飼料牛',
    nameEn: 'Feeder Cattle',
    category: 'livestock',
    exchange: 'CME',
    symbol: 'GF',
    contractMonths: ['F', 'H', 'J', 'K', 'Q', 'U', 'V', 'X'],
    perennial: false,
    primaryRegion: 'us_ranch_west',
    secondaryRegions: ['au_beef'],
    basePrice: 2.4,
    unitLabel: 'lb',
    dailyVolatility: 0.007,
    contractUnit: 50000,
    settlement: 'cash',
  },
  live_cattle: {
    id: 'live_cattle',
    nameZh: '肉牛',
    nameEn: 'Live Cattle',
    category: 'livestock',
    exchange: 'CME',
    symbol: 'LE',
    contractMonths: ['G', 'J', 'M', 'Q', 'V', 'Z'],
    perennial: false,
    primaryRegion: 'us_ranch_west',
    secondaryRegions: ['au_beef', 'br_south'],
    basePrice: 1.75,
    unitLabel: 'lb',
    dailyVolatility: 0.006,
    contractUnit: 40000,
    settlement: 'physical',
  },
  lean_hogs: {
    id: 'lean_hogs',
    nameZh: '瘦肉豬',
    nameEn: 'Lean Hogs',
    category: 'livestock',
    exchange: 'CME',
    symbol: 'HE',
    contractMonths: ['G', 'J', 'K', 'M', 'N', 'Q', 'V', 'Z'],
    perennial: false,
    primaryRegion: 'us_midwest',
    secondaryRegions: ['cn_northeast', 'eu_france'],
    basePrice: 0.95,
    unitLabel: 'lb',
    dailyVolatility: 0.011,
    contractUnit: 40000,
    settlement: 'cash',
  },

  // ---------------- 乳製品 Dairy ----------------
  milk_class_iii: {
    id: 'milk_class_iii',
    nameZh: 'Class III 牛奶',
    nameEn: 'Class III Milk',
    category: 'dairy',
    exchange: 'CME',
    symbol: 'DC',
    contractMonths: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
    perennial: false,
    primaryRegion: 'us_dairy_wi_ca',
    secondaryRegions: [],
    basePrice: 18.5,
    unitLabel: 'cwt',
    dailyVolatility: 0.008,
    contractUnit: 200000, // lb
    settlement: 'cash',
  },
  butter: {
    id: 'butter',
    nameZh: '奶油',
    nameEn: 'Butter',
    category: 'dairy',
    exchange: 'CME',
    symbol: 'CB',
    contractMonths: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
    perennial: false,
    primaryRegion: 'us_dairy_wi_ca',
    secondaryRegions: [],
    basePrice: 2.4,
    unitLabel: 'lb',
    dailyVolatility: 0.009,
    contractUnit: 20000,
    settlement: 'cash',
  },
  cheese: {
    id: 'cheese',
    nameZh: '起司',
    nameEn: 'Cheese',
    category: 'dairy',
    exchange: 'CME',
    symbol: 'CSC',
    contractMonths: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
    perennial: false,
    primaryRegion: 'us_dairy_wi_ca',
    secondaryRegions: [],
    basePrice: 1.8,
    unitLabel: 'lb',
    dailyVolatility: 0.009,
    contractUnit: 20000,
    settlement: 'cash',
  },
  nfdm: {
    id: 'nfdm',
    nameZh: '脫脂奶粉',
    nameEn: 'Nonfat Dry Milk',
    category: 'dairy',
    exchange: 'CME',
    symbol: 'GNF',
    contractMonths: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
    perennial: false,
    primaryRegion: 'us_dairy_wi_ca',
    secondaryRegions: [],
    basePrice: 1.2,
    unitLabel: 'lb',
    dailyVolatility: 0.009,
    contractUnit: 44000,
    settlement: 'cash',
  },

  // ---------------- 工業 Industrial ----------------
  cotton: {
    id: 'cotton',
    nameZh: '棉花',
    nameEn: 'Cotton',
    category: 'industrial',
    exchange: 'ICE US',
    symbol: 'CT',
    contractMonths: ['H', 'K', 'N', 'V', 'Z'],
    perennial: false,
    primaryRegion: 'us_south',
    secondaryRegions: ['in_punjab', 'cn_central'],
    basePrice: 0.72,
    unitLabel: 'lb',
    dailyVolatility: 0.009,
    contractUnit: 50000,
    settlement: 'physical',
  },
  rubber: {
    id: 'rubber',
    nameZh: '橡膠',
    nameEn: 'Rubber',
    category: 'industrial',
    exchange: 'TOCOM / SHFE',
    symbol: 'JN / RU',
    contractMonths: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
    perennial: true,
    primaryRegion: 'th_central',
    secondaryRegions: ['my_id_palm', 'vn_central'],
    basePrice: 1.6, // USD / kg equivalent; see eco-model for unit reconciliation
    unitLabel: 'kg',
    dailyVolatility: 0.012,
    contractUnit: 5000, // TOCOM: 5000 kg
    settlement: 'physical',
  },
  lumber: {
    id: 'lumber',
    nameZh: '木材',
    nameEn: 'Lumber',
    category: 'industrial',
    exchange: 'CME',
    symbol: 'LBR',
    contractMonths: ['F', 'H', 'K', 'N', 'U', 'X'],
    perennial: true,
    primaryRegion: 'us_midwest', // 實際美國西北/加拿大 BC，此處沿用既有 region 集
    secondaryRegions: ['ca_prairies'],
    basePrice: 550,
    unitLabel: 'thousand_board_feet',
    dailyVolatility: 0.018,
    contractUnit: 27500, // board feet (LBR spec)
    settlement: 'physical',
  },

  // ---------------- 亞洲特色 Asian Regional ----------------
  azuki_bean: {
    id: 'azuki_bean',
    nameZh: '紅豆',
    nameEn: 'Azuki Bean',
    category: 'asian',
    exchange: 'TOCOM',
    symbol: 'AZ',
    contractMonths: ['G', 'J', 'M', 'Q', 'V', 'Z'],
    perennial: false,
    primaryRegion: 'jp_main',
    secondaryRegions: ['cn_northeast'],
    basePrice: 140, // JPY 換算近似值
    unitLabel: 'bag_30kg',
    dailyVolatility: 0.011,
    contractUnit: 2400, // kg
    settlement: 'physical',
  },
  apple: {
    id: 'apple',
    nameZh: '蘋果',
    nameEn: 'Apple',
    category: 'asian',
    exchange: 'Zhengzhou',
    symbol: 'AP',
    contractMonths: ['F', 'H', 'K', 'N', 'V', 'Z'],
    perennial: true,
    primaryRegion: 'cn_central',
    secondaryRegions: [],
    basePrice: 1.1, // USD / kg 等值
    unitLabel: 'kg',
    dailyVolatility: 0.013,
    contractUnit: 10000, // kg (10 tons)
    settlement: 'physical',
  },
  egg: {
    id: 'egg',
    nameZh: '雞蛋',
    nameEn: 'Egg',
    category: 'asian',
    exchange: 'Dalian',
    symbol: 'JD',
    contractMonths: ['F', 'H', 'K', 'N', 'U', 'X'],
    perennial: false,
    // 產出來源：蛋雞 (Laying Hen)。素材以 Leghorn 蛋雞為準（見 asset-prompts §24）。
    primaryRegion: 'cn_central',
    secondaryRegions: ['cn_northeast'],
    basePrice: 1.3, // USD / kg 等值
    unitLabel: 'kg',
    dailyVolatility: 0.014,
    contractUnit: 5000, // kg
    settlement: 'physical',
  },
  peanut: {
    id: 'peanut',
    nameZh: '花生',
    nameEn: 'Peanut',
    category: 'asian',
    exchange: 'Dalian',
    symbol: 'PK',
    contractMonths: ['F', 'H', 'K', 'N', 'V'],
    perennial: false,
    primaryRegion: 'cn_central',
    secondaryRegions: ['us_south', 'in_punjab'],
    basePrice: 1.2, // USD / kg 等值
    unitLabel: 'kg',
    dailyVolatility: 0.011,
    contractUnit: 5000, // kg
    settlement: 'physical',
  },
};

// ============================================================
// Helpers
// ============================================================

/** 依分類取得商品清單。 */
export function commoditiesByCategory(category: CommodityCategory): CommoditySpec[] {
  return COMMODITY_IDS
    .map((id) => COMMODITIES[id])
    .filter((c) => c.category === category);
}

/** 清單總數 — compile-time 檢查用，執行期也可 assert。 */
export const COMMODITY_COUNT = COMMODITY_IDS.length; // 29

// Runtime self-check: 若未來有人編輯此檔案漏項或多項，將直接拋錯。
if (COMMODITY_IDS.length !== Object.keys(COMMODITIES).length) {
  throw new Error(
    `Commodity SSOT mismatch: IDs=${COMMODITY_IDS.length} vs COMMODITIES keys=${Object.keys(COMMODITIES).length}`,
  );
}
