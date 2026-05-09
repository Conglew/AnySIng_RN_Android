import { useInfiniteQuery } from '@tanstack/react-query';

import { singerClient } from '@/src/services/singer/singer-client';
import { SingerListResponse } from '@/src/services/singer/singer.types';

const DEFAULT_PAGE_SIZE = 20;

type UseSingersInfiniteQueryParams = {
  q?: string;
  limit?: number;
  enabled?: boolean;
};

export function useSingersInfiniteQuery({
  q = '',
  limit = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseSingersInfiniteQueryParams = {}) {
  return useInfiniteQuery<SingerListResponse>({
    queryKey: ['singers', 'infinite', { q, limit }],
    enabled,
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;

      return singerClient.getSingers({
        q,
        page,
        limit,
      });
    },

    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.page * lastPage.limit;

      if (loadedCount >= lastPage.total) {
        return undefined;
      }

      return lastPage.page + 1;
    },

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
