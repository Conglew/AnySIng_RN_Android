import { create } from 'zustand';

type QueuedSongsPanelStore = {
  isVisible: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

export const useQueuedSongsPanelStore = create<QueuedSongsPanelStore>((set) => ({
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
