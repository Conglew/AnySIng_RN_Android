import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

type PlaybackErrorSkipPayload = {
  reason: 'video-error' | 'missing-uri' | 'file-missing' | 'invalid-source' | 'manual-debug';
  error?: unknown;
  source?: string;
};

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
  }, [finishCurrent, queryClient, setPaused]);

  /**
   * 播放錯誤時使用的容錯切歌。
   *
   * 與 skipCurrent() 的差異：
   * - skipCurrent(): 後端 playNext 成功後，才本地 finishCurrent()
   * - skipCurrentAfterPlaybackError(): 播放器已經壞在當前歌曲，所以即使後端失敗，也要避免本地卡死
   */
  const skipCurrentAfterPlaybackError = useCallback(
    async (payload: PlaybackErrorSkipPayload) => {
      const token = await getAccessToken();

      const playbackState = usePlaybackQueueStore.getState();
      const playerState = usePlayerControlStore.getState();

      const currentItem = playbackState.currentItem;
      const nextItem = playbackState.queue[0] ?? null;

      const failedQueueId = currentItem?.queueId ?? null;
      const failedSongId = currentItem?.songId ?? null;

      console.log('[PlaybackQueueActions] playback error skip flow:', {
        reason: payload.reason,
        source: payload.source ?? null,
        hasToken: Boolean(token),

        currentItem: currentItem
          ? {
              queueId: currentItem.queueId,
              songId: currentItem.songId,
              title: currentItem.title,
              artistText: currentItem.artistText,
              localVideoUri: currentItem.localVideoUri,
            }
          : null,

        nextItem: nextItem
          ? {
              queueId: nextItem.queueId,
              songId: nextItem.songId,
              title: nextItem.title,
              artistText: nextItem.artistText,
              localVideoUri: nextItem.localVideoUri,
            }
          : null,

        queueLength: playbackState.queue.length,
        isPaused: playerState.isPaused,

        error: payload.error,
      });

      try {
        if (!token) {
          throw new Error('Missing access token.');
        }

        await playlistClient.playNext({
          token,
        });

        console.log('[PlaybackQueueActions] playNext succeeded after playback error', {
          failedQueueId,
          failedSongId,
        });
      } catch (error) {
        console.log('[PlaybackQueueActions] playNext failed after playback error:', {
          error,
          failedQueueId,
          failedSongId,
        });
      } finally {
        const latestPlaybackState = usePlaybackQueueStore.getState();
        const latestCurrentItem = latestPlaybackState.currentItem;

        const isStillSameFailedItem =
          failedQueueId != null
            ? latestCurrentItem?.queueId === failedQueueId
            : latestCurrentItem?.songId === failedSongId;

        if (isStillSameFailedItem) {
          finishCurrent();

          console.log('[PlaybackQueueActions] local finishCurrent executed after playback error', {
            failedQueueId,
            failedSongId,
          });
        } else {
          console.log(
            '[PlaybackQueueActions] local finishCurrent skipped: current item already changed',
            {
              failedQueueId,
              failedSongId,
              latestCurrentItem: latestCurrentItem
                ? {
                    queueId: latestCurrentItem.queueId,
                    songId: latestCurrentItem.songId,
                    title: latestCurrentItem.title,
                  }
                : null,
            },
          );
        }

        setPaused(false);

        await queryClient.invalidateQueries({
          queryKey: ['playlist', 'now-playing'],
        });
      }
    },
    [finishCurrent, queryClient, setPaused],
  );

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

    await queryClient.invalidateQueries({
      queryKey: ['playlist', 'now-playing'],
    });
  }, [clear, queryClient]);

  return {
    skipCurrent,
    skipCurrentAfterPlaybackError,
    removePendingSong,
    clearPendingPlaylist,
  };
}
