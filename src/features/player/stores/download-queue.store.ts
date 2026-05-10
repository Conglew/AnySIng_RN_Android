import { create } from 'zustand';

import { SongDownloadTask } from '../types/download.types';

type DownloadQueueStore = {
  tasks: SongDownloadTask[];
  activeTaskIds: string[];

  addTask: (task: SongDownloadTask) => void;
  setActiveTaskIds: (taskIds: string[]) => void;
  updateTask: (taskId: string, patch: Partial<SongDownloadTask>) => void;
  removeTask: (taskId: string) => void;
};

export const useDownloadQueueStore = create<DownloadQueueStore>((set) => ({
  tasks: [],
  activeTaskIds: [],

  addTask: (task) => {
    set((state) => {
      const exists = state.tasks.some((item) => item.songId === task.songId);

      if (exists) {
        return state;
      }

      return {
        tasks: [...state.tasks, task],
      };
    });
  },

  setActiveTaskIds: (taskIds) => {
    set({
      activeTaskIds: taskIds,
    });
  },

  updateTask: (taskId, patch) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.taskId === taskId
          ? {
              ...task,
              ...patch,
            }
          : task,
      ),
    }));
  },

  removeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.taskId !== taskId),
      activeTaskIds: state.activeTaskIds.filter((id) => id !== taskId),
    }));
  },
}));
