import { useInfiniteQuery } from '@tanstack/react-query';

import { categoryClient } from '@/src/services/category/category-client';
import { SongsByCategoryResponse } from '@/src/services/category/category.types';

const DEFAULT_PAGE_SIZE = 20;

type UseCategorySongsInfiniteQueryParams = {
  categoryId: string;
  q?: string;
  limit?: number;
  enabled?: boolean;
};

export function useCategorySongsInfiniteQuery({
  categoryId,
  q = '',
  limit = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseCategorySongsInfiniteQueryParams) {
  return useInfiniteQuery<SongsByCategoryResponse>({
    queryKey: ['categories', categoryId, 'songs', 'infinite', { q, limit }],
    enabled: enabled && categoryId.length > 0,
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;

      return categoryClient.getSongsByCategory({
        categoryId,
        params: {
          q,
          page,
          limit,
        },
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
