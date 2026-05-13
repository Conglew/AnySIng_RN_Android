import { create } from 'zustand';

type SongRequestQrPanelStore = {
  isVisible: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

export const useSongRequestQrPanelStore = create<SongRequestQrPanelStore>((set) => ({
  isVisible: false,

  openPanel: () => {
    set({
      isVisible: true,
    });
  },

  closePanel: () => {
    set({
      isVisible: false,
    });
  },
}));
