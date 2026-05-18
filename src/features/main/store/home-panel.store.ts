import { create } from 'zustand';

export type HomePanelType =
  | 'singer'
  | 'category'
  | 'newsongs'
  | 'ranking'
  | 'cachedSongs'
  | 'mySongs'
  | 'mySetting';

type HomePanelStore = {
  activePanel: HomePanelType | null;

  openPanel: (panel: HomePanelType) => void;
  closePanel: () => void;
};

export const useHomePanelStore = create<HomePanelStore>((set) => ({
  activePanel: null,

  openPanel: (panel) => {
    set({
      activePanel: panel,
    });
  },

  closePanel: () => {
    set({
      activePanel: null,
    });
  },
}));
