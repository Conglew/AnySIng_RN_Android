import { useQuery } from '@tanstack/react-query';

import { categoryClient } from '@/src/services/category/category-client';
import { GetCategoriesParams } from '@/src/services/category/category.types';

export function useCategoriesQuery(params: GetCategoriesParams = {}) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryClient.getCategories(),
  });
}
