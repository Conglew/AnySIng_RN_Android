import { create } from 'zustand';

import type { SongDto } from '@/src/services/song/song.types';

export type SongDownloadPhase = 'preparing' | 'downloading';

export type SongDownloadStatus = {
  phase: SongDownloadPhase;
  progress: number;
  song: SongDto;
  createdAt: number;
  speedText?: string;
};

type SongDownloadStatusStore = {
  statusMap: Record<string, SongDownloadStatus | undefined>;

  setPreparing: (song: SongDto) => void;
  setDownloading: (song: SongDto, progress: number, speedText?: string) => void;
  clearStatus: (songId: string) => void;
};

export const useSongDownloadStatusStore = create<SongDownloadStatusStore>((set) => ({
  statusMap: {},

  setPreparing: (song) => {
    set((state) => ({
      statusMap: {
        ...state.statusMap,
        [song._id]: {
          phase: 'preparing',
          progress: 0,
          song,
          createdAt: Date.now(),
        },
      },
    }));
  },

  setDownloading: (song, progress, speedText) => {
    set((state) => {
      const previousStatus = state.statusMap[song._id];

      return {
        statusMap: {
          ...state.statusMap,
          [song._id]: {
            phase: 'downloading',
            progress,
            song,
            createdAt: previousStatus?.createdAt ?? Date.now(),
            speedText: speedText ?? previousStatus?.speedText,
          },
        },
      };
    });
  },

  clearStatus: (songId) => {
    set((state) => {
      const nextStatusMap = { ...state.statusMap };
      delete nextStatusMap[songId];

      return {
        statusMap: nextStatusMap,
      };
    });
  },
}));
