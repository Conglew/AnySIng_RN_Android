import { create } from 'zustand';

import { SongDto } from '@/src/services/song/song.types';

/**
 * 播放佇列項目
 *
 * 注意：
 * title 這裡保留，因為 home-side-panel.tsx 有可能會讀 currentPlaybackItem.title。
 * 如果不保留，TypeScript 就會報：
 * 類型 'PlaybackQueueItem' 沒有屬性 'title'
 */
export type PlaybackQueueItem = {
  queueId: string;
  songId: string;
  song: SongDto;

  /**
   * 歌曲標題
   */
  title: string;

  /**
   * 歌手文字
   */
  artistText?: string;

  /**
   * 本機影片路徑
   */
  localVideoUri: string;

  /**
   * 本機人聲音軌路徑
   */
  localVocalUri?: string;

  /**
   * 本機伴奏音軌路徑
   */
  localInstrumentalUri?: string;

  /**
   * 播放狀態
   */
  status: 'ready' | 'playing' | 'finished' | 'failed';

  /**
   * 建立時間
   */
  createdAt: number;
};
/**
 * 新增播放項目時使用的輸入型別
 *
 * 重點：
 * 外部 enqueue / enqueueNext 不一定要傳 status。
 * status 應該由 store 自己決定，而不是由 UI 元件決定。
 */
export type CreatePlaybackQueueItemInput = Omit<PlaybackQueueItem, 'status'> & {
  status?: PlaybackQueueItem['status'];
};

/**
 * 播放佇列 Store
 *
 * 注意：
 * 這裡要 export，方便 TypeScript 與其他檔案明確讀到 finishCurrent。
 */
export type PlaybackQueueStore = {
  currentItem: PlaybackQueueItem | null;
  queue: PlaybackQueueItem[];

  /**
   * 加入播放隊列尾端
   */
  enqueue: (item: CreatePlaybackQueueItemInput) => void;

  /**
   * 插入下一首
   */
  enqueueNext: (item: CreatePlaybackQueueItemInput) => void;

  /**
   * 立即插播
   *
   * 邏輯：
   * - 新歌曲立刻變成 currentItem
   * - 原本正在播放的 currentItem 放回 queue 最前面
   */
  interrupt: (item: CreatePlaybackQueueItemInput) => void;

  /**
   * 結束目前播放項目，並自動播放下一首
   */
  finishCurrent: () => void;

  clear: () => void;
};

/**
 * 統一整理播放項目格式
 *
 * 原因：
 * enqueue 和 enqueueNext 都需要把外部傳進來的 item 轉成正式的 PlaybackQueueItem。
 * 如果每個 action 各自處理，後續容易出現 status 或 title 不一致。
 */
function createPlaybackQueueItem(
  item: CreatePlaybackQueueItemInput,
  status: PlaybackQueueItem['status'],
): PlaybackQueueItem {
  return {
    ...item,
    title: item.title,
    status,
  };
}

export const usePlaybackQueueStore = create<PlaybackQueueStore>((set) => ({
  currentItem: null,
  queue: [],

  enqueue: (item) => {
    set((state) => {
      const nextItem = createPlaybackQueueItem(item, 'ready');

      if (!state.currentItem) {
        return {
          currentItem: {
            ...nextItem,
            status: 'playing',
          },
        };
      }

      return {
        queue: [...state.queue, nextItem],
      };
    });
  },

  enqueueNext: (item) => {
    set((state) => {
      const nextItem = createPlaybackQueueItem(item, 'ready');

      if (!state.currentItem) {
        return {
          currentItem: {
            ...nextItem,
            status: 'playing',
          },
        };
      }

      return {
        queue: [nextItem, ...state.queue],
      };
    });
  },

  interrupt: (item) => {
    set((state) => {
      const nextItem = createPlaybackQueueItem(item, 'playing');

      if (!state.currentItem) {
        return {
          currentItem: nextItem,
        };
      }

      return {
        currentItem: nextItem,
        queue: [
          {
            ...state.currentItem,
            status: 'ready',
          },
          ...state.queue,
        ],
      };
    });
  },

  finishCurrent: () => {
    set((state) => {
      const [nextItem, ...remainingQueue] = state.queue;

      if (!nextItem) {
        return {
          currentItem: null,
          queue: [],
        };
      }

      return {
        currentItem: {
          ...nextItem,
          status: 'playing',
        },
        queue: remainingQueue,
      };
    });
  },

  clear: () => {
    set({
      currentItem: null,
      queue: [],
    });
  },
}));
