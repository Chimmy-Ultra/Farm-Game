import type { CommodityId } from '../data/commodities';

export type TileStage = 'untouched' | 'tilled' | 'seeded' | 'growing' | 'mature';

export interface TileState {
  x: number;
  z: number;
  stage: TileStage;
  watered: boolean;
  cropId: CommodityId | null;
  plantedDay: number | null;
  growthProgress: number;
}

export const GRID_COLS = 7;
export const GRID_ROWS = 6;

export function makeEmptyGrid(): TileState[] {
  const tiles: TileState[] = [];
  for (let x = 0; x < GRID_COLS; x++) {
    for (let z = 0; z < GRID_ROWS; z++) {
      tiles.push({
        x,
        z,
        stage: 'untouched',
        watered: false,
        cropId: null,
        plantedDay: null,
        growthProgress: 0,
      });
    }
  }
  return tiles;
}

export function tileKey(x: number, z: number): string {
  return `${x}-${z}`;
}
