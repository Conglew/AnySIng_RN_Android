import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type NewSongsPanelCopy = {
  title: string;
  back: string;
  loading: string;

  insert: string;
  preparing: string;
  downloading: (progress: number) => string;
};

export const NEW_PANEL_COPY: Record<LanguageValue, NewSongsPanelCopy> = {
  'zh-CN': {
    title: '新歌',
    back: '返回',
    loading: '载入新歌中',

    insert: '插播',
    preparing: '準備中',
    downloading: (progress) => `下載中 ${progress}%`,
  },
  'zh-TW': {
    title: '新歌',
    back: '返回',
    loading: '載入新歌中',

    insert: '插播',
    preparing: '准备中',
    downloading: (progress) => `下载中 ${progress}%`,
  },
  en: {
    title: 'New',
    back: 'Back',
    loading: 'Loading new',

    insert: 'Insert',
    preparing: 'Preparing',
    downloading: (progress) => `Downloading ${progress}%`,
  },
  ms: {
    title: 'New',
    back: 'Kembali',
    loading: 'Memuatkan new',

    insert: 'Sisip',
    preparing: 'Bersedia',
    downloading: (progress) => `Memuat turun ${progress}%`,
  },
};
