import { useCallback, useMemo, useRef, useState } from 'react';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';
import { SongDto } from '@/src/services/song/song.types';

const PAGE_SIZE = 20;

/**
 * 快取有效時間
 * 目前設定 5 分鐘。
 * 如果希望排行榜更即時，可以改短。
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

type RankingSongsCacheEntry = {
  songs: SongDto[];
  page: number;
  total: number;
  cachedAt: number;
};

type LoadSongsParams = {
  targetPage: number;
  replace: boolean;
};

type UseRankingSongsCacheParams = {
  languageValue?: string;
  searchKeyword?: string;
};

const rankingSongsCache = new Map<string, RankingSongsCacheEntry>();

function getCacheKey(languageValue?: string, searchKeyword?: string) {
  const normalizedSearchKeyword = searchKeyword?.trim() ?? '';

  if (normalizedSearchKeyword.length > 0) {
    return `search:${normalizedSearchKeyword}`;
  }

  return `ranking:${languageValue ?? 'all'}`;
}

function isCacheValid(entry: RankingSongsCacheEntry | undefined): entry is RankingSongsCacheEntry {
  if (!entry) {
    return false;
  }

  return Date.now() - entry.cachedAt <= CACHE_TTL_MS;
}

function getTotalPages(total: number) {
  if (total <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function useRankingSongsCache({
  languageValue,
  searchKeyword = '',
}: UseRankingSongsCacheParams) {
  const normalizedSearchKeyword = searchKeyword.trim();
  const isSearchMode = normalizedSearchKeyword.length > 0;

  const cacheKey = useMemo(
    () => getCacheKey(languageValue, normalizedSearchKeyword),
    [languageValue, normalizedSearchKeyword],
  );

  const [songs, setSongs] = useState<SongDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isLoadingMoreRef = useRef(false);

  const totalPages = useMemo(() => getTotalPages(total), [total]);

  const hasMore = useMemo(() => {
    if (total === 0) {
      return false;
    }

    return songs.length < total;
  }, [songs.length, total]);

  const canLoadMore = useMemo(() => {
    if (total <= 0) {
      return false;
    }

    if (songs.length >= total) {
      return false;
    }

    if (page >= totalPages) {
      return false;
    }

    return true;
  }, [page, songs.length, total, totalPages]);

  const applyCache = useCallback((entry: RankingSongsCacheEntry) => {
    setSongs(entry.songs);
    setPage(entry.page);
    setTotal(entry.total);
  }, []);

  const loadSongs = useCallback(
    async ({ targetPage, replace }: LoadSongsParams) => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      // const response = await songClient.getSongs({
      //   token,
      //   params: {
      //     page: targetPage,
      //     limit: PAGE_SIZE,
      //     sortBy: 'playCount',
      //     order: 'desc',
      //     lan: languageValue,
      //   },
      // });

      const response = isSearchMode
        ? await songClient.searchSongs({
            token,
            params: {
              q: normalizedSearchKeyword,
              page: targetPage,
              limit: PAGE_SIZE,
            },
          })
        : await songClient.getSongs({
            token,
            params: {
              page: targetPage,
              limit: PAGE_SIZE,
              sortBy: 'playCount',
              order: 'desc',
              lan: languageValue,
            },
          });

      setTotal(response.total);
      setPage(response.page);

      setSongs((previousSongs) => {
        let nextSongs: SongDto[];

        if (replace) {
          nextSongs = response.songs;
        } else {
          const existingIds = new Set(previousSongs.map((song) => song._id));
          const newSongs = response.songs.filter((song) => !existingIds.has(song._id));

          nextSongs = [...previousSongs, ...newSongs];
        }

        rankingSongsCache.set(cacheKey, {
          songs: nextSongs,
          page: response.page,
          total: response.total,
          cachedAt: Date.now(),
        });

        return nextSongs;
      });
    },
    [cacheKey, isSearchMode, languageValue, normalizedSearchKeyword],
  );

  const loadFirstPage = useCallback(
    async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}) => {
      try {
        setErrorMessage('');

        const cachedEntry = rankingSongsCache.get(cacheKey);

        if (!forceRefresh && isCacheValid(cachedEntry)) {
          applyCache(cachedEntry);
          return;
        }

        setIsInitialLoading(true);

        await loadSongs({
          targetPage: 1,
          replace: true,
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsInitialLoading(false);
      }
    },
    [applyCache, cacheKey, loadSongs],
  );

  const loadNextPage = useCallback(async () => {
    if (isInitialLoading) {
      return;
    }

    if (!canLoadMore) {
      return;
    }

    if (isLoadingMoreRef.current) {
      return;
    }

    try {
      isLoadingMoreRef.current = true;

      setErrorMessage('');
      setIsLoadingMore(true);

      await loadSongs({
        targetPage: page + 1,
        replace: false,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [canLoadMore, isInitialLoading, loadSongs, page]);

  const clearCurrentCache = useCallback(() => {
    rankingSongsCache.delete(cacheKey);
  }, [cacheKey]);

  return {
    songs,
    page,
    total,
    totalPages,
    hasMore,
    canLoadMore,

    isInitialLoading,
    isLoadingMore,
    errorMessage,
    setErrorMessage,

    loadFirstPage,
    loadNextPage,
    clearCurrentCache,
  };
}
