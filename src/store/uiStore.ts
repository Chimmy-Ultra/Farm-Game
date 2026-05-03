import { create } from 'zustand';

type Panel = 'none' | 'futures' | 'inventory' | 'shop';

interface UIState {
  panel: Panel;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  panel: 'none',
  openPanel: (p) => set({ panel: p }),
  closePanel: () => set({ panel: 'none' }),
}));

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as unknown as Record<string, unknown>).__uiStore = useUIStore;
}
