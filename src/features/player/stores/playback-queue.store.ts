import { create } from 'zustand';

import { PlaybackQueueItem } from '../types/playback.types';

type PlaybackQueueStore = {
  queue: PlaybackQueueItem[];
  currentItem: PlaybackQueueItem | null;

  enqueue: (item: PlaybackQueueItem) => void;
  enqueueNext: (item: PlaybackQueueItem) => void;
  interrupt: (item: PlaybackQueueItem) => void;

  setCurrentItem: (item: PlaybackQueueItem | null) => void;
  markReady: (queueId: string, localUris: Partial<PlaybackQueueItem>) => void;
  remove: (queueId: string) => void;
  clear: () => void;
};

export const usePlaybackQueueStore = create<PlaybackQueueStore>((set) => ({
  queue: [],
  currentItem: null,

  enqueue: (item) => {
    set((state) => ({
      queue: [...state.queue, item],
    }));
  },

  enqueueNext: (item) => {
    set((state) => {
      const [first, ...rest] = state.queue;

      if (!first) {
        return {
          queue: [item],
        };
      }

      return {
        queue: [first, item, ...rest],
      };
    });
  },

  interrupt: (item) => {
    set((state) => ({
      queue: [item, ...state.queue],
    }));
  },

  setCurrentItem: (item) => {
    set({
      currentItem: item,
    });
  },

  markReady: (queueId, localUris) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.queueId === queueId
          ? {
              ...item,
              ...localUris,
              status: 'ready',
            }
          : item,
      ),
    }));
  },

  remove: (queueId) => {
    set((state) => ({
      queue: state.queue.filter((item) => item.queueId !== queueId),
    }));
  },

  clear: () => {
    set({
      queue: [],
      currentItem: null,
    });
  },
}));
