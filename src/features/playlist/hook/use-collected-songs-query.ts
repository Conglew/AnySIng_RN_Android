import { useQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';
import { SongDto } from '@/src/services/song/song.types';

export type CollectedSongItem = SongDto & {
  queueId?: string | null;
  songId: string;
};

export function useCollectedSongsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<CollectedSongItem[], Error>({
    queryKey: ['playlist', 'collect', 'songs'],

    enabled,

    queryFn: async () => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      const playlists = await playlistClient.getUserPlaylists({
        token,
        params: {
          type: 'collect',
        },
      });

      const songs = playlists.flatMap((playlist) =>
        (playlist.songs ?? [])
          .filter((item) => item.song)
          .map((item) => {
            const songId = item.songId || item.song._id || item.song.id || '';

            return {
              ...item.song,
              _id: songId,
              id: songId,
              songId,
              queueId: item.queueId,
              isCollected: item.isCollected ?? true,
              isPendinged: item.isPendinged ?? false,
            };
          }),
      );

      return songs;
    },
  });
}
