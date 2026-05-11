import { create } from 'zustand';

export type SongDownloadPhase = 'preparing' | 'downloading';

export type SongDownloadStatus = {
  phase: SongDownloadPhase;
  progress?: number;
};

type SongDownloadStatusStore = {
  statusMap: Record<string, SongDownloadStatus | undefined>;

  setPreparing: (songId: string) => void;
  setDownloading: (songId: string, progress: number) => void;
  clearStatus: (songId: string) => void;
};

export const useSongDownloadStatusStore = create<SongDownloadStatusStore>((set) => ({
  statusMap: {},

  setPreparing: (songId) => {
    set((state) => ({
      statusMap: {
        ...state.statusMap,
        [songId]: {
          phase: 'preparing',
        },
      },
    }));
  },

  setDownloading: (songId, progress) => {
    set((state) => ({
      statusMap: {
        ...state.statusMap,
        [songId]: {
          phase: 'downloading',
          progress,
        },
      },
    }));
  },

  clearStatus: (songId) => {
    set((state) => ({
      statusMap: {
        ...state.statusMap,
        [songId]: undefined,
      },
    }));
  },
}));
