import { useQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

// export function useNowPlayingQuery({ enabled = true }: { enabled?: boolean } = {}) {
//   return useQuery<PlaylistNowPlayingResponse, Error>({
//     queryKey: ['playlist', 'now-playing'],

//     enabled,

//     refetchInterval: 5000,

//     queryFn: async () => {
//       const token = await getAccessToken();

//       if (!token) {
//         throw new Error('Missing access token.');
//       }

//       return playlistClient.getNowPlaying({
//         token,
//       });
//     },
//   });
// }

export function useNowPlayingQuery() {
  return useQuery({
    queryKey: ['playlist', 'now-playing'],
    queryFn: async () => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      return playlistClient.getNowPlaying({
        token,
      });
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
}
