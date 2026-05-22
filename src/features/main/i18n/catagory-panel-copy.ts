import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type CategoryPanelCopy = {
  title: string;
  back: string;
  loadingCategories: string;
  loadingSongs: string;
  loadingMoreCategories: string;
  loadingMoreSongs: string;
  emptyCategories: string;
  emptySongs: string;
  insert: string;
  preparing: string;
  downloading: (progress: number) => string;
  unknownArtist: string;
  categoryNames: Record<string, string>;
};

export const CATEGORY_PANEL_COPY: Record<LanguageValue, CategoryPanelCopy> = {
  'zh-CN': {
    title: '分类',
    back: '返回',
    loadingCategories: '载入分类中',
    loadingSongs: '载入歌曲中',
    loadingMoreCategories: '载入更多分类',
    loadingMoreSongs: '载入更多歌曲',
    emptyCategories: '目前没有分类资料',
    emptySongs: '此分类目前没有歌曲',
    insert: '插播',
    preparing: '准备中',
    downloading: (progress) => `下载中 ${progress}%`,
    unknownArtist: '未知歌手',
    categoryNames: {
      炒熱氣氛: '炒热气氛',
      當下最火: '当下最火',
      失戀情歌: '失恋情歌',
      雙人對唱: '双人对唱',
      高音挑戰: '高音挑战',
      影視金曲: '影视金曲',
      抖音神曲: '抖音神曲',
      嘻哈饒舌: '嘻哈饶舌',
      千禧世代: '千禧世代',
      '90s': '90s',
      '80s': '80s',
      '70s': '70s',
    },
  },

  'zh-TW': {
    title: '分類',
    back: '返回',
    loadingCategories: '載入分類中',
    loadingSongs: '載入歌曲中',
    loadingMoreCategories: '載入更多分類',
    loadingMoreSongs: '載入更多歌曲',
    emptyCategories: '目前沒有分類資料',
    emptySongs: '此分類目前沒有歌曲',
    insert: '插播',
    preparing: '準備中',
    downloading: (progress) => `下載中 ${progress}%`,
    unknownArtist: '未知歌手',
    categoryNames: {
      炒熱氣氛: '炒熱氣氛',
      當下最火: '當下最火',
      失戀情歌: '失戀情歌',
      雙人對唱: '雙人對唱',
      高音挑戰: '高音挑戰',
      影視金曲: '影視金曲',
      抖音神曲: '抖音神曲',
      嘻哈饒舌: '嘻哈饒舌',
      千禧世代: '千禧世代',
      '90s': '90s',
      '80s': '80s',
      '70s': '70s',
    },
  },

  en: {
    title: 'Categories',
    back: 'Back',
    loadingCategories: 'Loading categories',
    loadingSongs: 'Loading songs',
    loadingMoreCategories: 'Loading more categories',
    loadingMoreSongs: 'Loading more songs',
    emptyCategories: 'No categories available',
    emptySongs: 'No songs in this category',
    insert: 'Insert',
    preparing: 'Preparing',
    downloading: (progress) => `Downloading ${progress}%`,
    unknownArtist: 'Unknown artist',
    categoryNames: {
      炒熱氣氛: 'Party Hits',
      當下最火: 'Trending Now',
      失戀情歌: 'Heartbreak Songs',
      雙人對唱: 'Duets',
      高音挑戰: 'High Note Challenge',
      影視金曲: 'Movie & TV Hits',
      抖音神曲: 'TikTok Hits',
      嘻哈饒舌: 'Hip-Hop & Rap',
      千禧世代: 'Millennial Hits',
      '90s': '90s',
      '80s': '80s',
      '70s': '70s',
    },
  },

  ms: {
    title: 'Kategori',
    back: 'Kembali',
    loadingCategories: 'Memuatkan kategori',
    loadingSongs: 'Memuatkan lagu',
    loadingMoreCategories: 'Memuatkan lebih kategori',
    loadingMoreSongs: 'Memuatkan lebih lagu',
    emptyCategories: 'Tiada kategori tersedia',
    emptySongs: 'Tiada lagu dalam kategori ini',
    insert: 'Sisip',
    preparing: 'Bersedia',
    downloading: (progress) => `Memuat turun ${progress}%`,
    unknownArtist: 'Penyanyi tidak diketahui',
    categoryNames: {
      炒熱氣氛: 'Lagu Pesta',
      當下最火: 'Sedang Popular',
      失戀情歌: 'Lagu Patah Hati',
      雙人對唱: 'Duet',
      高音挑戰: 'Cabaran Nada Tinggi',
      影視金曲: 'Lagu Filem & TV',
      抖音神曲: 'Lagu TikTok',
      嘻哈饒舌: 'Hip-Hop & Rap',
      千禧世代: 'Lagu Milenium',
      '90s': '90an',
      '80s': '80an',
      '70s': '70an',
    },
  },
};
