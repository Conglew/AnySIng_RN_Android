import { useCallback } from 'react';

import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

export function usePlaybackQueueActions() {
  const finishCurrent = usePlaybackQueueStore((state) => state.finishCurrent);
  const removeByQueueId = usePlaybackQueueStore((state) => state.removeByQueueId);

  const skipCurrent = useCallback(async () => {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Missing access token.');
    }

    await playlistClient.playNext({
      token,
    });

    finishCurrent();
  }, [finishCurrent]);

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
    },
    [removeByQueueId],
  );

  return {
    skipCurrent,
    removePendingSong,
  };
}
