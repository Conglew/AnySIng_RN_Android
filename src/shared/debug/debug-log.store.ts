import { create } from 'zustand';

export type DebugLogLevel = 'info' | 'success' | 'error' | 'warning';

export type DebugLogItem = {
  id: string;
  time: string;
  scope: string;
  message: string;
  level: DebugLogLevel;
  data?: unknown;
};

type DebugLogStore = {
  logs: DebugLogItem[];
  addLog: (scope: string, message: string, data?: unknown, level?: DebugLogLevel) => void;
  clearLogs: () => void;
};

function inferDebugLogLevel(message: string, data?: unknown): DebugLogLevel {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('success') ||
    lowerMessage.includes('connected') ||
    lowerMessage.includes('finished') ||
    lowerMessage.includes('fulfilled')
  ) {
    return 'success';
  }

  if (
    lowerMessage.includes('failed') ||
    lowerMessage.includes('error') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('abort') ||
    lowerMessage.includes('rejected')
  ) {
    return 'error';
  }

  if (
    lowerMessage.includes('retry') ||
    lowerMessage.includes('skipped') ||
    lowerMessage.includes('warning')
  ) {
    return 'warning';
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (typeof record.error === 'string' || typeof record.errorMessage === 'string') {
      return 'error';
    }

    if (record.ok === true || record.status === 200) {
      return 'success';
    }
  }

  return 'info';
}

export const useDebugLogStore = create<DebugLogStore>((set) => ({
  logs: [],

  addLog: (scope, message, data, level) => {
    const item: DebugLogItem = {
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString(),
      scope,
      message,
      level: level ?? inferDebugLogLevel(message, data),
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
