import { create } from 'zustand';
import type { CommodityId } from '../data/commodities';

export type Tool = 'till' | 'seed' | 'water' | 'harvest';

interface ToolStoreState {
  selectedTool: Tool;
  selectedSeed: CommodityId;
  setTool: (tool: Tool) => void;
  setSeed: (seed: CommodityId) => void;
}

export const useToolStore = create<ToolStoreState>((set) => ({
  selectedTool: 'till',
  selectedSeed: 'corn',
  setTool: (tool) => set({ selectedTool: tool }),
  setSeed: (seed) => set({ selectedSeed: seed }),
}));

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as unknown as Record<string, unknown>).__toolStore = useToolStore;
}
