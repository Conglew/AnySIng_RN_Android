import { useQuery } from '@tanstack/react-query';

import { categoryClient } from '@/src/services/category/category-client';
import { GetSongsByCategoryParams } from '@/src/services/category/category.types';

export function useCategorySongsQuery({
  categoryId,
  params = {},
  enabled = true,
}: {
  categoryId: string;
  params?: GetSongsByCategoryParams;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['categories', categoryId, 'songs', params],
    enabled: enabled && categoryId.length > 0,
    queryFn: () =>
      categoryClient.getSongsByCategory({
        categoryId,
        params,
      }),
  });
}
