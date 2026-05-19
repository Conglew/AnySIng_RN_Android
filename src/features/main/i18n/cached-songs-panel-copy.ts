import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type CachedSongsPanelCopy = {
  title: string;
  edit: string;
  done: string;
  cancel: string;
  removeAll: string;
  remove: string;
  removing: string;
  back: string;
  clear: string;
  unknownArtist: string;
  insert: string;
  preparing: string;
  downloading: (progress: number) => string;
  loadingCachedSongs: string;
  emptyCachedSongs: string;
  clearAllConfirm: string;
};

export const CACHED_SONGS_PANEL_COPY: Record<LanguageValue, CachedSongsPanelCopy> = {
  'zh-CN': {
    title: '缓存下载',
    edit: '编辑',
    done: '完成',
    cancel: '取消',
    removeAll: '全部移除',
    remove: '移除',
    removing: '移除中',
    back: '返回',
    clear: '清除',
    unknownArtist: '未知歌手',
    insert: '插播',
    preparing: '准备中',
    downloading: (progress) => `下载中 ${progress}%`,
    loadingCachedSongs: '读取缓存歌曲中',
    emptyCachedSongs: '目前没有已缓存歌曲',
    clearAllConfirm: '是否清除所有歌曲？',
  },
  'zh-TW': {
    title: '緩存下載',
    edit: '編輯',
    done: '完成',
    cancel: '取消',
    removeAll: '全部移除',
    remove: '移除',
    removing: '移除中',
    back: '返回',
    clear: '清除',
    unknownArtist: '未知歌手',
    insert: '插播',
    preparing: '準備中',
    downloading: (progress) => `下載中 ${progress}%`,
    loadingCachedSongs: '讀取緩存歌曲中',
    emptyCachedSongs: '目前沒有已緩存歌曲',
    clearAllConfirm: '是否清除所有歌曲？',
  },
  en: {
    title: 'Downloads',
    edit: 'Edit',
    done: 'Done',
    cancel: 'Cancel',
    removeAll: 'Remove All',
    remove: 'Remove',
    removing: 'Removing',
    back: 'Back',
    clear: 'Clear',
    unknownArtist: 'Unknown Artist',
    insert: 'Next',
    preparing: 'Preparing',
    downloading: (progress) => `Downloading ${progress}%`,
    loadingCachedSongs: 'Loading cached songs',
    emptyCachedSongs: 'No cached songs',
    clearAllConfirm: 'Clear all cached songs?',
  },
  ms: {
    title: 'Muat Turun',
    edit: 'Edit',
    done: 'Selesai',
    cancel: 'Batal',
    removeAll: 'Padam Semua',
    remove: 'Padam',
    removing: 'Memadam',
    back: 'Kembali',
    clear: 'Kosongkan',
    unknownArtist: 'Penyanyi Tidak Dikenali',
    insert: 'Next',
    preparing: 'Menyediakan',
    downloading: (progress) => `Memuat turun ${progress}%`,
    loadingCachedSongs: 'Memuatkan lagu cache',
    emptyCachedSongs: 'Tiada lagu cache',
    clearAllConfirm: 'Kosongkan semua lagu cache?',
  },
};
