import { useInfiniteQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { singerClient } from '@/src/services/singer/singer-client';
import { SongDto } from '@/src/services/song/song.types';

type UseSingerSongsInfiniteQueryParams = {
  singerId: string;
  enabled?: boolean;
  limit?: number;

  /**
   * 搜尋此歌手底下的歌曲。
   *
   * 注意：
   * 目前後端 /artists/:id/songs 沒有支援 keyword 查詢，
   * 所以這裡先在前端針對已回傳的 songs 做過濾。
   */
  keyword?: string;
};

export type SingerSongsInfinitePage = {
  songs: SongDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useSingerSongsInfiniteQuery({
  singerId,
  enabled = true,
  limit = 20,
  keyword = '',
}: UseSingerSongsInfiniteQueryParams) {
  const normalizedKeyword = keyword.trim();

  return useInfiniteQuery<SingerSongsInfinitePage, Error>({
    queryKey: ['singer-songs', singerId, normalizedKeyword],

    enabled: enabled && singerId.length > 0,

    initialPageParam: 1,

    queryFn: async () => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      const response = await singerClient.getSingerSongs({
        token,
        singerId,
      });

      /**
       * 後端 /artists/:id/songs 回傳的 songs 可能沒有 artists 欄位。
       * 這裡直接把外層 artist.name 補進每一首歌，
       * 讓 SingerPanel 的歌曲列表可以正確顯示歌手名稱。
       */
      const songsWithArtist = response.songs.map((song) => ({
        ...song,
        artists: [response.artist.name],
      }));

      const filteredSongs =
        normalizedKeyword.length > 0
          ? songsWithArtist.filter((song) => {
              return song.title.includes(normalizedKeyword);
            })
          : songsWithArtist;

      return {
        songs: filteredSongs,
        page: 1,
        limit,
        total: filteredSongs.length,
        totalPages: 1,
      };
    },

    getNextPageParam: () => {
      return undefined;
    },
  });
}
