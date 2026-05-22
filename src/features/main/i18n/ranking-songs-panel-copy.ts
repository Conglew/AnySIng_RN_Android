import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type RankingSongsPanelCopy = {
  title: string;
  back: string;
  loading: string;

  insert: string;
  preparing: string;
  downloading: (progress: number) => string;
};

export const RANKING_PANEL_COPY: Record<LanguageValue, RankingSongsPanelCopy> = {
  'zh-CN': {
    title: '排行',
    back: '返回',
    loading: '载入排行榜中',

    insert: '插播',
    preparing: '準備中',
    downloading: (progress) => `下載中 ${progress}%`,
  },
  'zh-TW': {
    title: '排行',
    back: '返回',
    loading: '載入排行榜中',

    insert: '插播',
    preparing: '准备中',
    downloading: (progress) => `下载中 ${progress}%`,
  },
  en: {
    title: 'Rank',
    back: 'Back',
    loading: 'Loading ranking',

    insert: 'Insert',
    preparing: 'Preparing',
    downloading: (progress) => `Downloading ${progress}%`,
  },
  ms: {
    title: 'Rank',
    back: 'Kembali',
    loading: 'Memuatkan ranking',

    insert: 'Sisip',
    preparing: 'Bersedia',
    downloading: (progress) => `Memuat turun ${progress}%`,
  },
};
