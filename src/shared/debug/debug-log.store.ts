import { create } from 'zustand';

type DebugLogItem = {
  id: string;
  time: string;
  scope: string;
  message: string;
  data?: unknown;
};

type DebugLogStore = {
  logs: DebugLogItem[];
  addLog: (scope: string, message: string, data?: unknown) => void;
  clearLogs: () => void;
};

export const useDebugLogStore = create<DebugLogStore>((set) => ({
  logs: [],

  addLog: (scope, message, data) => {
    const item: DebugLogItem = {
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString(),
      scope,
      message,
      data,
    };

    set((state) => ({
      logs: [item, ...state.logs].slice(0, 150),
    }));

    console.log(`[${scope}] ${message}`, data ?? '');
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));
