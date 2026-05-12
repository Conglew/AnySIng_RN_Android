import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

export function usePlaybackQueueActions() {
  const queryClient = useQueryClient();

  const finishCurrent = usePlaybackQueueStore((state) => state.finishCurrent);
  const removeByQueueId = usePlaybackQueueStore((state) => state.removeByQueueId);
  const clear = usePlaybackQueueStore((state) => state.clear);

  const setPaused = usePlayerControlStore((state) => state.setPaused);

  const skipCurrent = useCallback(async () => {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Missing access token.');
    }

    await playlistClient.playNext({
      token,
    });

    finishCurrent();

    setPaused(false);

    await queryClient.invalidateQueries({
      queryKey: ['playlist', 'now-playing'],
    });
  }, [finishCurrent, queryClient]);

  const removePendingSong = useCallback(
    async ({ songId, queueId }: { songId?: string; queueId?: string | null }) => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      await playlistClient.removeSongFromPlaylist({
        token,
        type: 'pending',
        songId,
        queueId,
      });

      if (queueId) {
        removeByQueueId(queueId);
      }

      await queryClient.invalidateQueries({
        queryKey: ['playlist', 'now-playing'],
      });
    },
    [queryClient, removeByQueueId],
  );

  const clearPendingPlaylist = useCallback(async () => {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Missing access token.');
    }

    await playlistClient.clearPlaylist({
      token,
      type: 'pending',
    });

    clear();

    // setPaused(true);

    await queryClient.invalidateQueries({
      queryKey: ['playlist', 'now-playing'],
    });
  }, [clear, queryClient]);

  return {
    skipCurrent,
    removePendingSong,
    clearPendingPlaylist,
  };
}
