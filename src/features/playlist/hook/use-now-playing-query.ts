import { useQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';
import { PlaylistNowPlayingResponse } from '@/src/services/playlist/playlist.types';

export function useNowPlayingQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<PlaylistNowPlayingResponse, Error>({
    queryKey: ['playlist', 'now-playing'],

    enabled,

    refetchInterval: 5000,

    queryFn: async () => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      return playlistClient.getNowPlaying({
        token,
      });
    },
  });
}
