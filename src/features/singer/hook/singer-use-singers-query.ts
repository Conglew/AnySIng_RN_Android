import { useQuery } from '@tanstack/react-query';

import { singerClient } from '@/src/services/singer/singer-client';
import { GetSingersParams } from '@/src/services/singer/singer.types';

export function useSingersQuery(params: GetSingersParams = {}) {
  return useQuery({
    queryKey: ['singers', params],
    queryFn: () => singerClient.getSingers(params),
  });
}
