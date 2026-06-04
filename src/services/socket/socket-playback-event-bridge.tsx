import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  addSocketPlaybackEventHandler,
  AudioTrackPayload,
  NowUpdatedPayload,
  SongSelectedPayload,
} from '@/src/services/socket/socket-client';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';

export function SocketPlaybackEventBridge() {
  const queryClient = useQueryClient();

  const pendingSongSelectedPayloadsRef = useRef<SongSelectedPayload[]>([]);
  const isProcessingSongSelectedQueueRef = useRef(false);
  //   const lastSyncedNowSongIdRef = useRef<string | null>(null);
  //   const isSyncingNowUpdatedRef = useRef(false);

  const { enqueueSongAfterDownload } = useInsertSongPlayback();

  const finishCurrent = usePlaybackQueueStore((state) => state.finishCurrent);
  const setPaused = usePlayerControlStore((state) => state.setPaused);

  useEffect(() => {
    const processSongSelectedQueue = async () => {
      if (isProcessingSongSelectedQueueRef.current) {
        return;
      }

      isProcessingSongSelectedQueueRef.current = true;

      try {
        while (pendingSongSelectedPayloadsRef.current.length > 0) {
          const payload = pendingSongSelectedPayloadsRef.current.shift();

          if (!payload) {
            continue;
          }

          const songId = payload.songId;

          if (!songId) {
            console.log(
              '[SocketPlaybackEventBridge] songSelected ignored: missing songId',
              payload,
            );
            continue;
          }

          try {
            console.log('[SocketPlaybackEventBridge] handle songSelected:', payload);

            const token = await getAccessToken();

            if (!token) {
              throw new Error('Missing access token.');
            }

            const song = await songClient.getSongById({
              token,
              songId,
            });

            await enqueueSongAfterDownload(song);
          } catch (error) {
            console.log('[SocketPlaybackEventBridge] handle songSelected failed:', error);
          }
        }
      } finally {
        isProcessingSongSelectedQueueRef.current = false;
      }
    };

    // const syncLocalPlaybackFromNowUpdated = async (payload: NowUpdatedPayload) => {
    //   const backendCurrentSongId = payload.current?.id ?? null;

    //   const playbackState = usePlaybackQueueStore.getState();
    //   const localCurrentSongId = playbackState.currentItem?.songId ?? null;
    //   const localNextSongId = playbackState.queue[0]?.songId ?? null;

    //   console.log('[SocketPlaybackEventBridge] nowUpdated compare:', {
    //     backendCurrentSongId,
    //     localCurrentSongId,
    //     localNextSongId,
    //     queueLength: playbackState.queue.length,
    //   });

    //   if (!backendCurrentSongId) {
    //     console.log('[SocketPlaybackEventBridge] nowUpdated current is null. Backend has no current song.');

    //     lastSyncedNowSongIdRef.current = null;

    //     /**
    //      * 後端已經沒有 current / next。
    //      * 如果 App 本地還有 currentItem，代表遠端已經切到清單結束，
    //      * 這裡只推進本地播放器，不再呼叫後端 API。
    //      *
    //      * finishCurrent() 會讓本地 currentItem 變成下一首；
    //      * 如果本地 queue 也空了，就會回到 SharedVideoPlayer 的 default video。
    //      */
    //     if (localCurrentSongId) {
    //         console.log('[SocketPlaybackEventBridge] clear local current by nowUpdated null:', {
    //         localCurrentSongId,
    //         queueLength: playbackState.queue.length,
    //         });

    //         finishCurrent();
    //         setPaused(false);

    //         await queryClient.invalidateQueries({
    //         queryKey: ['playlist', 'now-playing'],
    //         });
    //     }
    //     return;
    //   }

    //   if (lastSyncedNowSongIdRef.current === backendCurrentSongId) {
    //     console.log('[SocketPlaybackEventBridge] nowUpdated ignored: already synced', backendCurrentSongId);
    //     return;
    //   }

    //   /**
    //    * 如果 App 本地目前播放歌曲已經等於後端 current，代表不用切。
    //    * 例如點歌後後端 now:updated 只是更新 next，不應該讓 App finishCurrent。
    //    */
    //   if (localCurrentSongId === backendCurrentSongId) {
    //     lastSyncedNowSongIdRef.current = backendCurrentSongId;
    //     console.log('[SocketPlaybackEventBridge] nowUpdated local current already matches backend current.');
    //     return;
    //   }

    //   /**
    //    * Web 遠端切歌的正常情況：
    //    * 後端 current 已變成 App 本地 queue[0]。
    //    * 此時 App 不要打後端 playNext，只需要本地 finishCurrent。
    //    */
    //   if (localNextSongId === backendCurrentSongId) {
    //     if (isSyncingNowUpdatedRef.current) {
    //       console.log('[SocketPlaybackEventBridge] nowUpdated ignored: already syncing', backendCurrentSongId);
    //       return;
    //     }

    //     isSyncingNowUpdatedRef.current = true;

    //     try {
    //       console.log('[SocketPlaybackEventBridge] finish local current by nowUpdated:', {
    //         backendCurrentSongId,
    //         localCurrentSongId,
    //         localNextSongId,
    //       });

    //       finishCurrent();
    //       setPaused(false);

    //       console.log('[SocketPlaybackEventBridge] local playback advanced by nowUpdated:', {
    //         backendCurrentSongId,
    //       });

    //       lastSyncedNowSongIdRef.current = backendCurrentSongId;

    //       await queryClient.invalidateQueries({
    //         queryKey: ['playlist', 'now-playing'],
    //       });
    //     } catch (error) {
    //       console.log('[SocketPlaybackEventBridge] finish local current by nowUpdated failed:', error);
    //     } finally {
    //       isSyncingNowUpdatedRef.current = false;
    //     }

    //     return;
    //   }

    //   /**
    //    * 走到這裡代表：
    //    * 後端 current 跟 App local current / local next 都對不上。
    //    *
    //    * 常見原因：
    //    * 1. Web 快速點歌，但 App 端下載還沒完成，本地 queue 還沒跟上
    //    * 2. App 曾重開，後端有 current，但本地沒有該首歌
    //    * 3. 後端和 App 本地 queue 順序不同步
    //    */
    //   console.log('[SocketPlaybackEventBridge] nowUpdated cannot sync by local queue:', {
    //     backendCurrentSongId,
    //     localCurrentSongId,
    //     localNextSongId,
    //     queueLength: playbackState.queue.length,
    //   });
    // };

    const syncLocalPlaybackFromNowUpdated = async (payload: NowUpdatedPayload) => {
      const backendCurrentSongId = payload.current?.id ?? null;

      const playbackState = usePlaybackQueueStore.getState();
      const localCurrentSongId = playbackState.currentItem?.songId ?? null;
      const localNextSongId = playbackState.queue[0]?.songId ?? null;

      console.log('[SocketPlaybackEventBridge] nowUpdated compare:', {
        backendCurrentSongId,
        localCurrentSongId,
        localNextSongId,
        queueLength: playbackState.queue.length,
      });

      /**
       * 注意：
       * 一般切歌不要在 now:updated 裡面做 finishCurrent。
       * 因為同一首歌重複點時，backendCurrentSongId 會和 localCurrentSongId 一樣，
       * 用 songId 判斷會誤判成 already synced。
       *
       * 一般切歌統一交給 onNextSong 做本地 finishCurrent。
       */

      if (!backendCurrentSongId) {
        console.log(
          '[SocketPlaybackEventBridge] nowUpdated current is null. Backend has no current song.',
        );

        /**
         * 後端已經沒有 current / next。
         * 如果 App 本地還有 currentItem，代表遠端已經切到清單結束。
         * 這裡只推進本地播放器，不再呼叫後端 API。
         */
        if (playbackState.currentItem) {
          console.log('[SocketPlaybackEventBridge] clear local current by nowUpdated null:', {
            localCurrentSongId,
            queueLength: playbackState.queue.length,
          });

          finishCurrent();
          setPaused(false);

          await queryClient.invalidateQueries({
            queryKey: ['playlist', 'now-playing'],
          });
        }

        return;
      }
    };

    const unsubscribe = addSocketPlaybackEventHandler({
      onSongSelected: (payload: SongSelectedPayload) => {
        pendingSongSelectedPayloadsRef.current.push(payload);
        void processSongSelectedQueue();
      },

      onPauseSong: () => {
        const state = usePlayerControlStore.getState();

        console.log('[SocketPlaybackEventBridge] apply pauseSong:', {
          beforeIsPaused: state.isPaused,
        });

        state.setPaused(true);
      },

      onPlaySong: () => {
        const state = usePlayerControlStore.getState();

        console.log('[SocketPlaybackEventBridge] apply playSong:', {
          beforeIsPaused: state.isPaused,
        });

        state.setPaused(false);
      },

      //   onNextSong: () => {
      //     console.log(
      //       '[SocketPlaybackEventBridge] nextSong received from socket, skip backend call. Wait for now:updated.',
      //     );
      //   },

      onNextSong: () => {
        const playbackState = usePlaybackQueueStore.getState();

        console.log(
          '[SocketPlaybackEventBridge] nextSong received from socket, advance local playback only:',
          {
            localCurrentSongId: playbackState.currentItem?.songId ?? null,
            localNextSongId: playbackState.queue[0]?.songId ?? null,
            queueLength: playbackState.queue.length,
          },
        );

        /**
         * 注意：
         * 這裡只推進 App 本地播放器，不打後端 API。
         * 後端已經由 Web 的 nextSong 完成切歌。
         *
         * 這樣同一首歌重複點時，也可以從第 1 筆蘋果切到第 2 筆蘋果。
         */
        if (playbackState.currentItem) {
          finishCurrent();
          setPaused(false);
        }
      },

      onReplaySong: () => {
        usePlayerControlStore.getState().restartCurrentSong();
      },

      onAudioTrack: (_payload: AudioTrackPayload) => {
        usePlayerControlStore.getState().toggleAudioTrackMode();
      },

      onNowUpdated: (payload: NowUpdatedPayload) => {
        void syncLocalPlaybackFromNowUpdated(payload);
      },
    });

    return unsubscribe;
  }, [enqueueSongAfterDownload, finishCurrent, queryClient, setPaused]);

  return null;
}
