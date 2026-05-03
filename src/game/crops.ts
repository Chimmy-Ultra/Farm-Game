import type { CommodityId } from '../data/commodities';
import type { Season } from '../store/gameStore';

export interface CropSpec {
  commodityId: CommodityId;
  seedCost: number;
  growthDays: number;
  yieldUnits: number;
  allowedSeasons: Season[];
}

export const CROPS: Partial<Record<CommodityId, CropSpec>> = {
  corn: {
    commodityId: 'corn',
    seedCost: 20,
    growthDays: 28,
    yieldUnits: 8,
    allowedSeasons: ['spring', 'summer'],
  },
  wheat_srw: {
    commodityId: 'wheat_srw',
    seedCost: 25,
    growthDays: 42,
    yieldUnits: 10,
    allowedSeasons: ['autumn', 'winter', 'spring'],
  },
  soybean: {
    commodityId: 'soybean',
    seedCost: 30,
    growthDays: 35,
    yieldUnits: 6,
    allowedSeasons: ['spring', 'summer'],
  },
};

export const STARTER_CROP_IDS = ['corn', 'wheat_srw', 'soybean'] as const satisfies readonly CommodityId[];
