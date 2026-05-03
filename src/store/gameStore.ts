import { create } from 'zustand';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const DAYS_PER_SEASON = 7;

type GameState = {
  day: number;
  season: Season;
  money: number;
  stamina: number;
  staminaMax: number;
  timeOfDay: number;
  timeSpeed: number;
  language: 'zh-TW' | 'en';
  setLanguage: (lng: 'zh-TW' | 'en') => void;
  setTimeOfDay: (t: number) => void;
  setTimeSpeed: (s: number) => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  advanceDay: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  day: 1,
  season: 'spring',
  money: 500,
  stamina: 100,
  staminaMax: 100,
  timeOfDay: 11,
  timeSpeed: 1,
  language: 'zh-TW',

  setLanguage: (lng) => set({ language: lng }),
  setTimeOfDay: (t) => set({ timeOfDay: ((t % 24) + 24) % 24 }),
  setTimeSpeed: (s) => set({ timeSpeed: s }),

  addMoney: (amount) => set((s) => ({ money: s.money + amount })),

  spendMoney: (amount) => {
    const { money } = get();
    if (money < amount) return false;
    set({ money: money - amount });
    return true;
  },

  advanceDay: () => {
    const { day, season } = get();
    const nextDay = day + 1;
    const dayInYear = ((nextDay - 1) % (DAYS_PER_SEASON * 4));
    const seasonIdx = Math.floor(dayInYear / DAYS_PER_SEASON) % 4;
    const nextSeason = SEASON_ORDER[seasonIdx] ?? season;
    set({ day: nextDay, season: nextSeason, stamina: get().staminaMax });
  },
}));

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as unknown as Record<string, unknown>).__gameStore = useGameStore;
}
