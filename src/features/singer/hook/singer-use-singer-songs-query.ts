import { useQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { singerClient } from '@/src/services/singer/singer-client';

type UseSingerSongsQueryParams = {
  singerId: string;
  enabled?: boolean;
};

export function useSingerSongsQuery({ singerId, enabled = true }: UseSingerSongsQueryParams) {
  return useQuery({
    queryKey: ['singers', singerId, 'songs'],
    enabled: enabled && singerId.length > 0,

    queryFn: async () => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      return singerClient.getSongsBySinger({
        token,
        singerId,
      });
    },

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
