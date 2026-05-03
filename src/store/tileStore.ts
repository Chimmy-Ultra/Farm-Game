import { create } from 'zustand';
import type { CommodityId } from '../data/commodities';
import { GRID_COLS, GRID_ROWS, makeEmptyGrid, tileKey, type TileState } from '../game/tile';
import { CROPS } from '../game/crops';

interface TileStoreState {
  tiles: Record<string, TileState>;
  till: (x: number, z: number) => boolean;
  seed: (x: number, z: number, cropId: CommodityId, day: number) => boolean;
  water: (x: number, z: number) => boolean;
  harvest: (x: number, z: number) => { cropId: CommodityId } | null;
  advanceDay: (currentDay: number) => void;
  getTile: (x: number, z: number) => TileState | undefined;
}

function initTiles(): Record<string, TileState> {
  const out: Record<string, TileState> = {};
  for (const t of makeEmptyGrid()) {
    out[tileKey(t.x, t.z)] = t;
  }
  return out;
}

export const useTileStore = create<TileStoreState>((set, get) => ({
  tiles: initTiles(),

  getTile: (x, z) => get().tiles[tileKey(x, z)],

  till: (x, z) => {
    const key = tileKey(x, z);
    const tile = get().tiles[key];
    if (!tile || tile.stage !== 'untouched') return false;
    set((s) => ({
      tiles: { ...s.tiles, [key]: { ...tile, stage: 'tilled' } },
    }));
    return true;
  },

  seed: (x, z, cropId, day) => {
    const key = tileKey(x, z);
    const tile = get().tiles[key];
    if (!tile || tile.stage !== 'tilled') return false;
    set((s) => ({
      tiles: {
        ...s.tiles,
        [key]: {
          ...tile,
          stage: 'seeded',
          cropId,
          plantedDay: day,
          growthProgress: 0,
        },
      },
    }));
    return true;
  },

  water: (x, z) => {
    const key = tileKey(x, z);
    const tile = get().tiles[key];
    if (!tile) return false;
    if (tile.stage !== 'seeded' && tile.stage !== 'growing') return false;
    if (tile.watered) return false;
    set((s) => ({
      tiles: { ...s.tiles, [key]: { ...tile, watered: true } },
    }));
    return true;
  },

  harvest: (x, z) => {
    const key = tileKey(x, z);
    const tile = get().tiles[key];
    if (!tile || tile.stage !== 'mature' || !tile.cropId) return null;
    const cropId = tile.cropId;
    set((s) => ({
      tiles: {
        ...s.tiles,
        [key]: {
          ...tile,
          stage: 'untouched',
          cropId: null,
          plantedDay: null,
          growthProgress: 0,
          watered: false,
        },
      },
    }));
    return { cropId };
  },

  advanceDay: () => {
    set((s) => {
      const next: Record<string, TileState> = {};
      for (const key in s.tiles) {
        const tile = s.tiles[key];
        let { stage, growthProgress } = tile;
        if (tile.watered && (stage === 'seeded' || stage === 'growing')) {
          growthProgress += 1;
          if (stage === 'seeded') stage = 'growing';
          const spec = tile.cropId ? CROPS[tile.cropId] : undefined;
          if (spec && growthProgress >= spec.growthDays) {
            stage = 'mature';
          }
        }
        next[key] = {
          ...tile,
          stage,
          growthProgress,
          watered: false,
        };
      }
      return { tiles: next };
    });
  },
}));

export { GRID_COLS, GRID_ROWS };

// Dev-only: expose store on window for debugging / cheats
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as unknown as Record<string, unknown>).__tileStore = useTileStore;
}
