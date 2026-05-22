import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type SingerPanelCopy = {
  title: string;
  back: string;
  loadingSingers: string;
  loadingSongs: string;
  loadingMoreSingers: string;
  loadingMoreSongs: string;
  emptySingers: string;
  emptySongs: string;

  insert: string;
  preparing: string;
  downloading: (progress: number) => string;

  unknownArtist: string;
};

export const SINGER_PANEL_COPY: Record<LanguageValue, SingerPanelCopy> = {
  'zh-TW': {
    title: '歌手',
    back: '返回',
    loadingSingers: '載入歌手中',
    loadingSongs: '載入歌曲中',
    loadingMoreSingers: '載入更多歌手',
    loadingMoreSongs: '載入更多歌曲',
    emptySingers: '目前沒有歌手資料',
    emptySongs: '此歌手目前沒有歌曲',

    insert: '插播',
    preparing: '準備中',
    downloading: (progress) => `下載中 ${progress}%`,

    unknownArtist: '未知歌手',
  },

  'zh-CN': {
    title: '歌手',
    back: '返回',
    loadingSingers: '载入歌手中',
    loadingSongs: '载入歌曲中',
    loadingMoreSingers: '载入更多歌手',
    loadingMoreSongs: '载入更多歌曲',
    emptySingers: '目前没有歌手资料',
    emptySongs: '此歌手目前没有歌曲',

    insert: '插播',
    preparing: '准备中',
    downloading: (progress) => `下载中 ${progress}%`,

    unknownArtist: '未知歌手',
  },

  en: {
    title: 'Singers',
    back: 'Back',
    loadingSingers: 'Loading singers',
    loadingSongs: 'Loading songs',
    loadingMoreSingers: 'Loading more singers',
    loadingMoreSongs: 'Loading more songs',
    emptySingers: 'No singers available',
    emptySongs: 'No songs available for this singer',

    insert: 'Insert',
    preparing: 'Preparing',
    downloading: (progress) => `Downloading ${progress}%`,

    unknownArtist: 'Unknown artist',
  },

  ms: {
    title: 'Penyanyi',
    back: 'Kembali',
    loadingSingers: 'Memuatkan penyanyi',
    loadingSongs: 'Memuatkan lagu',
    loadingMoreSingers: 'Memuatkan lebih penyanyi',
    loadingMoreSongs: 'Memuatkan lebih lagu',
    emptySingers: 'Tiada penyanyi tersedia',
    emptySongs: 'Tiada lagu untuk penyanyi ini',

    insert: 'Sisip',
    preparing: 'Bersedia',
    downloading: (progress) => `Memuat turun ${progress}%`,

    unknownArtist: 'Penyanyi tidak diketahui',
  },
};
