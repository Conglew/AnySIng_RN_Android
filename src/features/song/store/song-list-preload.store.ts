import { create } from 'zustand';

import { SongDto } from '@/src/services/song/song.types';

type SongListCache = {
  songs: SongDto[];
  page: number;
  limit: number;
  total: number;
  cachedAt: number;
};

type SongListPreloadStore = {
  rankingSongsCache: SongListCache | null;
  newSongsCache: SongListCache | null;

  setRankingSongsCache: (cache: SongListCache) => void;
  setNewSongsCache: (cache: SongListCache) => void;
};

export const useSongListPreloadStore = create<SongListPreloadStore>((set) => ({
  rankingSongsCache: null,
  newSongsCache: null,

  setRankingSongsCache: (cache) => {
    set({
      rankingSongsCache: cache,
    });
  },

  setNewSongsCache: (cache) => {
    set({
      newSongsCache: cache,
    });
  },
}));