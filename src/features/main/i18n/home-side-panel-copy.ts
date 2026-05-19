import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type HomeSidePanelCopy = {
  settings: string;
  mySongs: string;
  cachedDownloads: string;
};

export const HOME_SIDE_PANEL_COPY: Record<LanguageValue, HomeSidePanelCopy> = {
  'zh-CN': {
    settings: '设置',
    mySongs: '我的歌单',
    cachedDownloads: '缓存下载',
  },
  'zh-TW': {
    settings: '設定',
    mySongs: '我的歌單',
    cachedDownloads: '緩存下載',
  },
  en: {
    settings: 'Settings',
    mySongs: 'My Songs',
    cachedDownloads: 'Downloads',
  },
  ms: {
    settings: 'Tetapan',
    mySongs: 'Lagu Saya',
    cachedDownloads: 'Muat Turun',
  },
};
