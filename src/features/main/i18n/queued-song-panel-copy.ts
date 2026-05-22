import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type QueuedSongPanelCopy = {
  queuedTab: string;
  downloadingTab: string;

  emptyQueued: string;
  emptyDownloading: string;

  unknownArtist: string;

  insert: string;
  processing: string;

  preparingDownload: string;
  downloading: (progress: number) => string;
};

export const QUEUED_SONG_PANEL_COPY: Record<LanguageValue, QueuedSongPanelCopy> = {
  'zh-TW': {
    queuedTab: '已點歌曲',
    downloadingTab: '正在下載',

    emptyQueued: '目前尚未點歌',
    emptyDownloading: '目前尚未下載的歌曲',

    unknownArtist: '未知歌手',

    insert: '插播',
    processing: '處理中',

    preparingDownload: '準備下載中',
    downloading: (progress) => `下載中 ${progress}%`,
  },

  'zh-CN': {
    queuedTab: '已点歌曲',
    downloadingTab: '正在下载',

    emptyQueued: '目前尚未点歌',
    emptyDownloading: '目前尚未下载的歌曲',

    unknownArtist: '未知歌手',

    insert: '插播',
    processing: '处理中',

    preparingDownload: '准备下载中',
    downloading: (progress) => `下载中 ${progress}%`,
  },

  en: {
    queuedTab: 'Queued Songs',
    downloadingTab: 'Downloading',

    emptyQueued: 'No queued songs yet',
    emptyDownloading: 'No songs downloading',

    unknownArtist: 'Unknown artist',

    insert: 'Insert',
    processing: 'Processing',

    preparingDownload: 'Preparing download',
    downloading: (progress) => `Downloading ${progress}%`,
  },

  ms: {
    queuedTab: 'Lagu Dipilih',
    downloadingTab: 'Memuat Turun',

    emptyQueued: 'Tiada lagu dipilih',
    emptyDownloading: 'Tiada lagu sedang dimuat turun',

    unknownArtist: 'Penyanyi tidak diketahui',

    insert: 'Sisip',
    processing: 'Memproses',

    preparingDownload: 'Bersedia memuat turun',
    downloading: (progress) => `Memuat turun ${progress}%`,
  },
};
