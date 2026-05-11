import { create } from 'zustand';

type MainBackgroundMode = 'home' | 'ranking' | 'newsongs' | 'category';

type MainBackgroundStore = {
  mode: MainBackgroundMode;
  setMode: (mode: MainBackgroundMode) => void;
  resetMode: () => void;
};

export const useMainBackgroundStore = create<MainBackgroundStore>((set) => ({
  mode: 'home',

  setMode: (mode) => {
    set({ mode });
  },

  resetMode: () => {
    set({ mode: 'home' });
  },
}));
