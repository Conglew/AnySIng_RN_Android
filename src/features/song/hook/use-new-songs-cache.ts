import { useCallback, useMemo, useRef, useState } from 'react';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';
import { SongDto } from '@/src/services/song/song.types';

const PAGE_SIZE = 20;
const CACHE_TTL_MS = 10 * 60 * 1000;

type NewSongsCacheEntry = {
  songs: SongDto[];
  page: number;
  total: number;
  cachedAt: number;
};

type LoadSongsParams = {
  targetPage: number;
  replace: boolean;
};

type UseNewSongsCacheParams = {
  languageValue?: string;
};

const newSongsCache = new Map<string, NewSongsCacheEntry>();

function getCacheKey(languageValue?: string) {
  return languageValue ?? 'all';
}

function isCacheValid(entry: NewSongsCacheEntry | undefined): entry is NewSongsCacheEntry {
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

export function useNewSongsCache({ languageValue }: UseNewSongsCacheParams) {
  const cacheKey = useMemo(() => getCacheKey(languageValue), [languageValue]);

  const isLoadingMoreRef = useRef(false);

  const [songs, setSongs] = useState<SongDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalPages = useMemo(() => getTotalPages(total), [total]);

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

  const applyCache = useCallback((entry: NewSongsCacheEntry) => {
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

      const response = await songClient.getSongs({
        token,
        params: {
          page: targetPage,
          limit: PAGE_SIZE,
          sortBy: 'createdAt',
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

        newSongsCache.set(cacheKey, {
          songs: nextSongs,
          page: response.page,
          total: response.total,
          cachedAt: Date.now(),
        });

        return nextSongs;
      });
    },
    [cacheKey, languageValue],
  );

  const loadFirstPage = useCallback(
    async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}) => {
      try {
        setErrorMessage('');

        const cachedEntry = newSongsCache.get(cacheKey);

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
    newSongsCache.delete(cacheKey);
  }, [cacheKey]);

  return {
    songs,
    page,
    total,
    totalPages,
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
