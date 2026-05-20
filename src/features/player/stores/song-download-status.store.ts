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
  /**
   * 只存正在下載或準備下載的 songId 順序。
   * Panel 只訂閱這個，避免 progress 更新時整個 Panel 重 render。
   */
  downloadIds: string[];

  /**
   * 每首歌自己的下載狀態。
   * Row 會用 songId 單獨訂閱 statusMap[songId]。
   */
  statusMap: Record<string, SongDownloadStatus | undefined>;

  setPreparing: (song: SongDto) => void;
  setDownloading: (song: SongDto, progress: number, speedText?: string) => void;
  clearStatus: (songId: string) => void;
  clearAllStatus: () => void;
};

function appendDownloadIdIfNeeded(downloadIds: string[], songId: string) {
  if (downloadIds.includes(songId)) {
    return downloadIds;
  }

  return [...downloadIds, songId];
}

export const useSongDownloadStatusStore = create<SongDownloadStatusStore>((set) => ({
  downloadIds: [],
  statusMap: {},

  setPreparing: (song) => {
    set((state) => ({
      downloadIds: appendDownloadIdIfNeeded(state.downloadIds, song._id),
      statusMap: {
        ...state.statusMap,
        [song._id]: {
          phase: 'preparing',
          progress: 0,
          song,
          createdAt: state.statusMap[song._id]?.createdAt ?? Date.now(),
          speedText: state.statusMap[song._id]?.speedText,
        },
      },
    }));
  },

  setDownloading: (song, progress, speedText) => {
    set((state) => {
      const previousStatus = state.statusMap[song._id];

      return {
        /**
         * progress 更新時如果 songId 已存在，downloadIds 會維持原參考。
         * 這樣 Panel 訂閱 downloadIds 時，不會因為進度更新而重 render。
         */
        downloadIds: appendDownloadIdIfNeeded(state.downloadIds, song._id),
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
        downloadIds: state.downloadIds.filter((id) => id !== songId),
        statusMap: nextStatusMap,
      };
    });
  },

  clearAllStatus: () => {
    set({
      downloadIds: [],
      statusMap: {},
    });
  },
}));
