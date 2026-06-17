import { create } from 'zustand';

import type { SongDto } from '@/src/services/song/song.types';

export type SongDownloadPhase = 'queued' | 'preparing' | 'downloading';

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

  setQueued: (song: SongDto) => void;
  setPreparing: (song: SongDto) => void;
  setDownloading: (song: SongDto, progress: number, speedText?: string) => void;
  clearStatus: (songId: string) => void;
  clearAllStatus: () => void;
};

const MIN_PROGRESS_UPDATE_STEP = 8;

function appendDownloadIdIfNeeded(downloadIds: string[], songId: string) {
  if (downloadIds.includes(songId)) {
    return downloadIds;
  }

  return [...downloadIds, songId];
}

function normalizeProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor(progress)));
}

export const useSongDownloadStatusStore = create<SongDownloadStatusStore>((set) => ({
  downloadIds: [],
  statusMap: {},

  setQueued: (song) => {
    set((state) => {
      const previousStatus = state.statusMap[song._id];

      /**
       * 如果已經進入 preparing / downloading，
       * 不要因為再次點擊又把狀態退回 queued。
       */
      if (previousStatus?.phase === 'preparing' || previousStatus?.phase === 'downloading') {
        return state;
      }

      /**
       * 已經是 queued 就不重複更新，避免 Row 不必要 render。
       */
      if (previousStatus?.phase === 'queued') {
        return state;
      }

      return {
        downloadIds: appendDownloadIdIfNeeded(state.downloadIds, song._id),
        statusMap: {
          ...state.statusMap,
          [song._id]: {
            phase: 'queued',
            progress: 0,
            song,
            createdAt: previousStatus?.createdAt ?? Date.now(),
            speedText: previousStatus?.speedText,
          },
        },
      };
    });
  },

  setPreparing: (song) => {
    set((state) => {
      const previousStatus = state.statusMap[song._id];

      if (previousStatus?.phase === 'preparing') {
        return state;
      }

      return {
        downloadIds: appendDownloadIdIfNeeded(state.downloadIds, song._id),
        statusMap: {
          ...state.statusMap,
          [song._id]: {
            phase: 'preparing',
            progress: 0,
            song,
            createdAt: previousStatus?.createdAt ?? Date.now(),
            speedText: previousStatus?.speedText,
          },
        },
      };
    });
  },

  setDownloading: (song, progress, speedText) => {
    set((state) => {
      const nextProgress = normalizeProgress(progress);
      const previousStatus = state.statusMap[song._id];

      const previousProgress = previousStatus?.progress ?? 0;
      const previousSpeedText = previousStatus?.speedText;

      const isSameDownloadingStatus =
        previousStatus?.phase === 'downloading' &&
        previousProgress === nextProgress &&
        previousSpeedText === speedText;

      if (isSameDownloadingStatus) {
        return state;
      }

      // const shouldThrottleProgress =
      //   previousStatus?.phase === 'downloading' &&
      //   nextProgress !== 100 &&
      //   nextProgress > previousProgress &&
      //   nextProgress - previousProgress < MIN_PROGRESS_UPDATE_STEP &&
      //   previousSpeedText === speedText;

      // if (shouldThrottleProgress) {
      //   return state;
      // }
      const shouldThrottleDownloadingUpdate =
        previousStatus?.phase === 'downloading' &&
        nextProgress !== 100 &&
        Math.abs(nextProgress - previousProgress) < MIN_PROGRESS_UPDATE_STEP;

      if (shouldThrottleDownloadingUpdate) {
        return state;
      }

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
            progress: nextProgress,
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
      const hasStatus = Boolean(state.statusMap[songId]);
      const hasDownloadId = state.downloadIds.includes(songId);

      if (!hasStatus && !hasDownloadId) {
        return state;
      }

      const nextStatusMap = { ...state.statusMap };
      delete nextStatusMap[songId];

      return {
        downloadIds: state.downloadIds.filter((id) => id !== songId),
        statusMap: nextStatusMap,
      };
    });
  },

  clearAllStatus: () => {
    set((state) => {
      if (state.downloadIds.length === 0 && Object.keys(state.statusMap).length === 0) {
        return state;
      }

      return {
        downloadIds: [],
        statusMap: {},
      };
    });
  },
}));
