import { useQuery } from '@tanstack/react-query';

import { singerClient } from '@/src/services/singer/singer-client';
import { SearchSingersParams } from '@/src/services/singer/singer.types';

export function useSearchSingersQuery(params: SearchSingersParams, enabled = true) {
  return useQuery({
    queryKey: ['singers', 'search', params],
    enabled: enabled && params.q.trim().length > 0,
    queryFn: () => singerClient.searchSingers(params),
  });
}
