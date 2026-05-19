import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type HomeCopy = {
  singer: string;
  category: string;
  newSongs: string;
  ranking: string;
};

export const HOME_COPY: Record<LanguageValue, HomeCopy> = {
  'zh-CN': {
    singer: '歌手',
    category: '分类',
    newSongs: '新歌',
    ranking: '排行榜',
  },
  'zh-TW': {
    singer: '歌手',
    category: '分類',
    newSongs: '新歌',
    ranking: '排行榜',
  },
  en: {
    singer: 'Singers',
    category: 'Categories',
    newSongs: 'New Songs',
    ranking: 'Ranking',
  },
  ms: {
    singer: 'Penyanyi',
    category: 'Kategori',
    newSongs: 'Lagu Baru',
    ranking: 'Carta',
  },
};
