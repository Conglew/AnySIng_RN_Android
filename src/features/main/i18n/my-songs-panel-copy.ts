import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type MySongsPanelCopy = {
  title: string;
  unknownArtist: string;
  insert: string;
  preparing: string;
  downloading: (progress: number) => string;
  loadingMySongs: string;
  emptyMySongs: string;
  back: string;
};

export const MY_SONGS_PANEL_COPY: Record<LanguageValue, MySongsPanelCopy> = {
  'zh-CN': {
    title: '我的歌单',
    unknownArtist: '未知歌手',
    insert: '插播',
    preparing: '准备中',
    downloading: (progress) => `下载中 ${progress}%`,
    loadingMySongs: '载入我的歌单中',
    emptyMySongs: '目前没有收藏歌曲',
    back: '返回',
  },
  'zh-TW': {
    title: '我的歌單',
    unknownArtist: '未知歌手',
    insert: '插播',
    preparing: '準備中',
    downloading: (progress) => `下載中 ${progress}%`,
    loadingMySongs: '載入我的歌單中',
    emptyMySongs: '目前沒有收藏歌曲',
    back: '返回',
  },
  en: {
    title: 'My Songs',
    unknownArtist: 'Unknown Artist',
    insert: 'Next',
    preparing: 'Preparing',
    downloading: (progress) => `Downloading ${progress}%`,
    loadingMySongs: 'Loading My Songs',
    emptyMySongs: 'No favorite songs',
    back: 'Back',
  },
  ms: {
    title: 'Lagu Saya',
    unknownArtist: 'Penyanyi Tidak Dikenali',
    insert: 'Next',
    preparing: 'Menyediakan',
    downloading: (progress) => `Memuat turun ${progress}%`,
    loadingMySongs: 'Memuatkan Lagu Saya',
    emptyMySongs: 'Tiada lagu kegemaran',
    back: 'Kembali',
  },
};
