import { useCallback } from 'react';

import { SongDto } from '@/src/services/song/song.types';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

import { songDownloadCancelService } from '@/src/features/player/services/song-download-cancel.service';
import { songDownloadQueueService } from '../services/song-download-queue.service';
import { songCacheService } from '../services/song-cache.service';

import { usePlaybackQueueStore } from '../stores/playback-queue.store';
import { useSongDownloadStatusStore } from '../stores/song-download-status.store';

type InsertSongMode = 'queue' | 'next';

type InsertSongParams = {
  song: SongDto;
  mode?: InsertSongMode;
};

const PENDING_QUEUE_FLUSH_DELAY_MS = 2000;

let pendingQueueTimer: ReturnType<typeof setTimeout> | null = null;

const pendingQueueSongMap = new Map<string, SongDto>();

function schedulePendingQueueFlush({
  onFlushSong,
}: {
  onFlushSong: (song: SongDto) => void | Promise<void>;
}) {
  if (pendingQueueTimer) {
    clearTimeout(pendingQueueTimer);
  }

  pendingQueueTimer = setTimeout(() => {
    pendingQueueTimer = null;

    const pendingSongs = Array.from(pendingQueueSongMap.values());
    pendingQueueSongMap.clear();

    pendingSongs.forEach((song) => {
      void onFlushSong(song);
    });
  }, PENDING_QUEUE_FLUSH_DELAY_MS);
}

function formatArtists(artists: SongDto['artists']) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return '未知歌手';
  }

  const artistNames = artists
    .map((artist) => {
      if (typeof artist === 'string') {
        return artist;
      }

      if (artist && typeof artist === 'object') {
        const record = artist as Record<string, unknown>;

        if (typeof record.name === 'string') {
          return record.name;
        }

        if (typeof record.artistName === 'string') {
          return record.artistName;
        }

        if (typeof record.singerName === 'string') {
          return record.singerName;
        }
      }

      return '';
    })
    .filter(Boolean);

  return artistNames.length > 0 ? artistNames.join('、') : '未知歌手';
}

function findLatestPlaylistSongItemBySongId({
  songs,
  songId,
}: {
  songs?: Array<{
    songId: string;
    queueId?: string | null;
    addedAt?: string;
  }>;
  songId: string;
}) {
  if (!Array.isArray(songs) || songs.length === 0) {
    return null;
  }

  const matchedItems = songs.filter((item) => item.songId === songId && item.queueId);

  if (matchedItems.length === 0) {
    return null;
  }

  const hasAddedAt = matchedItems.some((item) => Boolean(item.addedAt));

  if (!hasAddedAt) {
    return matchedItems[matchedItems.length - 1];
  }

  return matchedItems.sort((a, b) => {
    const aTime = a.addedAt ? new Date(a.addedAt).getTime() : 0;
    const bTime = b.addedAt ? new Date(b.addedAt).getTime() : 0;

    return bTime - aTime;
  })[0];
}

function createPlaybackQueueItem({
  song,
  queueId,
  localVideoUri,
  artistText,
}: {
  song: SongDto;
  queueId: string;
  localVideoUri: string;
  artistText?: string;
}) {
  return {
    queueId,
    songId: song._id,
    song,
    title: song.title,
    artistText,
    localVideoUri,
    status: 'ready' as const,
    createdAt: Date.now(),
  };
}

export function useInsertSongPlayback() {
  const enqueueSong = usePlaybackQueueStore((state) => state.enqueue);
  const enqueueNextSong = usePlaybackQueueStore((state) => state.enqueueNext);

  const setQueued = useSongDownloadStatusStore((state) => state.setQueued);
  const clearDownloadStatus = useSongDownloadStatusStore((state) => state.clearStatus);

  const songActionStatusMap = useSongDownloadStatusStore((state) => state.statusMap);

  const syncPendingPlaylistAndEnqueue = useCallback(
    async ({
      song,
      localVideoUri,
      mode,
    }: {
      song: SongDto;
      localVideoUri: string;
      mode: InsertSongMode;
    }) => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      if (mode === 'queue') {
        const response = await playlistClient.addSongToPlaylist({
          token,
          type: 'pending',
          songId: song._id,
        });

        const playlistItem = findLatestPlaylistSongItemBySongId({
          songs: response.playlist.songs,
          songId: song._id,
        });

        if (!playlistItem?.queueId) {
          throw new Error('Missing backend queueId after adding song to playlist.');
        }

        const item = createPlaybackQueueItem({
          song,
          queueId: playlistItem.queueId,
          artistText: formatArtists(song.artists),
          localVideoUri,
        });

        enqueueSong(item);
        return;
      }

      const response = await playlistClient.interjectSongNext({
        token,
        songId: song._id,
      });

      const playlistItem =
        response.nextUp?.songId === song._id && response.nextUp.queueId
          ? response.nextUp
          : findLatestPlaylistSongItemBySongId({
              songs: response.playlist.songs,
              songId: song._id,
            });

      if (!playlistItem?.queueId) {
        throw new Error('Missing backend queueId after interjecting song.');
      }

      const item = createPlaybackQueueItem({
        song,
        queueId: playlistItem.queueId,
        artistText: formatArtists(song.artists),
        localVideoUri,
      });

      enqueueNextSong(item);
    },
    [enqueueNextSong, enqueueSong],
  );

  const enqueuePendingSongDownloadTask = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      if (!songId) {
        return;
      }

      const existingStatus = useSongDownloadStatusStore.getState().statusMap[songId];

      /**
       * 如果等待期間狀態被清掉，代表可能已取消或已被其他流程處理。
       */
      if (!existingStatus) {
        return;
      }

      /**
       * 只有 queued 狀態才允許從 pending buffer 轉成下載任務。
       * preparing / downloading 都代表已經在流程中，不重複建立 task。
       */
      if (existingStatus.phase !== 'queued') {
        return;
      }

      /**
       * flush 時重新檢查 cache。
       * 避免等待期間同一首歌已經被其他地方下載完成，卻又重複建立下載任務。
       */
      const cachedSong = await songCacheService.getCachedSong(songId);

      if (cachedSong?.videoUri) {
        await syncPendingPlaylistAndEnqueue({
          song,
          localVideoUri: cachedSong.videoUri,
          mode: 'queue',
        });

        clearDownloadStatus(songId);
        return;
      }

      songDownloadQueueService.enqueue({
        songId,
        song,
        mode: 'queue',
        priority: 'normal',
        onCompleted: async ({ song, localVideoUri }) => {
          await syncPendingPlaylistAndEnqueue({
            song,
            localVideoUri,
            mode: 'queue',
          });

          clearDownloadStatus(song._id);
        },
      });
    },
    [clearDownloadStatus, syncPendingPlaylistAndEnqueue],
  );

  const insertSong = useCallback(
    async ({ song, mode = 'next' }: InsertSongParams) => {
      const songId = song._id;

      if (!songId) {
        return;
      }

      const currentStatus = useSongDownloadStatusStore.getState().statusMap[songId];

      if (currentStatus) {
        console.log('[useInsertSongPlayback] song is already processing:', {
          songId,
          currentStatus,
        });

        return;
      }

      try {
        /**
         * 插播流程：
         * 已下載：直接同步後端 pending / next，並加入本地播放隊列。
         * 未下載：直接建立下載任務，因為插播屬於高優先級。
         */
        const cachedSong = await songCacheService.getCachedSong(songId);

        if (cachedSong?.videoUri) {
          await syncPendingPlaylistAndEnqueue({
            song,
            localVideoUri: cachedSong.videoUri,
            mode,
          });

          return;
        }

        songDownloadQueueService.enqueue({
          songId,
          song,
          mode,
          priority: mode === 'next' ? 'high' : 'normal',
          onCompleted: async ({ song, localVideoUri }) => {
            await syncPendingPlaylistAndEnqueue({
              song,
              localVideoUri,
              mode,
            });

            clearDownloadStatus(song._id);
          },
        });
      } catch (error) {
        pendingQueueSongMap.delete(songId);
        clearDownloadStatus(songId);

        console.log('[useInsertSongPlayback] insert song failed:', {
          songId,
          title: song.title,
          error,
        });
      }
    },
    [clearDownloadStatus, syncPendingPlaylistAndEnqueue],
  );

  const insertSongNext = useCallback(
    async (song: SongDto) => {
      await insertSong({
        song,
        mode: 'next',
      });
    },
    [insertSong],
  );

  const enqueueSongAfterDownload = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      if (!songId) {
        return;
      }

      const existingStatus = useSongDownloadStatusStore.getState().statusMap[songId];

      if (existingStatus) {
        return;
      }

      try {
        /**
         * 一般點歌流程：
         * 已下載：直接加入後端 pending 與本地播放隊列尾端。
         */
        const cachedSong = await songCacheService.getCachedSong(songId);

        if (cachedSong?.videoUri) {
          await syncPendingPlaylistAndEnqueue({
            song,
            localVideoUri: cachedSong.videoUri,
            mode: 'queue',
          });

          return;
        }

        /**
         * 未下載：
         * 只標記 queued，不搜尋 S3、不下載、不加入播放隊列。
         * 等使用者停止操作後，才由 pendingQueueSongMap flush 成下載任務。
         */
        setQueued(song);

        pendingQueueSongMap.set(songId, song);

        schedulePendingQueueFlush({
          onFlushSong: enqueuePendingSongDownloadTask,
        });
      } catch (error) {
        pendingQueueSongMap.delete(songId);
        clearDownloadStatus(songId);

        console.log('[useInsertSongPlayback] enqueue song failed:', {
          songId,
          title: song.title,
          error,
        });
      }
    },
    [clearDownloadStatus, enqueuePendingSongDownloadTask, setQueued, syncPendingPlaylistAndEnqueue],
  );

  const cancelSongDownload = useCallback(
    async (songId: string) => {
      pendingQueueSongMap.delete(songId);

      await songDownloadCancelService.cancel(songId);

      clearDownloadStatus(songId);
    },
    [clearDownloadStatus],
  );

  return {
    songActionStatusMap,
    insertSong,
    cancelSongDownload,
    insertSongNext,
    enqueueSongAfterDownload,
  };
}