import { useInfiniteQuery } from '@tanstack/react-query';

import { categoryClient } from '@/src/services/category/category-client';
import { CategoryListResponse } from '@/src/services/category/category.types';

const DEFAULT_PAGE_SIZE = 20;

type UseCategoriesInfiniteQueryParams = {
  q?: string;
  limit?: number;
  enabled?: boolean;
};

export function useCategoriesInfiniteQuery({
  q = '',
  limit = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseCategoriesInfiniteQueryParams = {}) {
  return useInfiniteQuery<CategoryListResponse>({
    queryKey: ['categories', 'infinite', { q, limit }],
    enabled,
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;

      return categoryClient.getCategories();
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
