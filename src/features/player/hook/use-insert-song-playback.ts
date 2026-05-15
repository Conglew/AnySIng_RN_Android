import { useCallback } from 'react';

import * as ExpoFileSystem from 'expo-file-system/legacy';

import { SongDto } from '@/src/services/song/song.types';

import { songAssetResolverService } from '../services/song-asset-resolver.service';
import { songDownloadQueueService } from '../services/song-download-queue.service';

import { songCacheService } from '../services/song-cache.service';
import { usePlaybackQueueStore } from '../stores/playback-queue.store';
import { useSongDownloadStatusStore } from '../stores/song-download-status.store';

import { songDownloadCancelService } from '@/src/features/player/services/song-download-cancel.service';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

// function sleep(ms: number) {
//   return new Promise<void>((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }

// let globalDownloadQueue: Promise<void> = Promise.resolve();

// function enqueueGlobalDownloadJob(job: () => Promise<void>) {
//   const nextJob = globalDownloadQueue
//     .catch(() => undefined)
//     .then(async () => {
//       await job();

//       /**
//        * 下載任務完成後讓 JS thread / UI / video player 稍微喘息。
//        * 數值不要太大，200~500ms 即可。
//        */
//       await sleep(300);
//     });

//   globalDownloadQueue = nextJob.catch(() => undefined);

//   return nextJob;
// }

function throwIfDownloadCancelled(songId: string) {
  if (songDownloadCancelService.isCancelled(songId)) {
    throw new Error('Download cancelled.');
  }
}

function formatArtists(artists: SongDto['artists']) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return '未知歌手';
  }

  return artists
    .map((artist) => String(artist))
    .filter(Boolean)
    .join('、');
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

function getFileExtensionFromS3Key(key?: string) {
  if (!key) {
    return 'mkv';
  }

  const filename = key.split('/').pop() || '';
  const extension = filename.split('.').pop();

  if (!extension || extension.length > 8) {
    return 'mkv';
  }

  return extension;
}

function calculateDownloadProgress(totalBytesWritten: number, totalBytesExpectedToWrite: number) {
  if (totalBytesExpectedToWrite <= 0) {
    return 0;
  }

  const progress = Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100);

  return Math.max(0, Math.min(progress, 100));
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

type InsertSongMode = 'queue' | 'next';

// type ActiveDownloadTask = {
//   downloadResumable: ExpoFileSystem.DownloadResumable;
//   tempUri: string;
// };

// const activeDownloadTasks = new Map<string, ActiveDownloadTask>();
// const cancelledSongIds = new Set<string>();

type InsertSongParams = {
  song: SongDto;
  mode?: InsertSongMode;
};

function formatDownloadSpeed(bytesPerSecond: number) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return '-- MB/s';
  }

  const mbPerSecond = bytesPerSecond / 1024 / 1024;

  if (mbPerSecond >= 1) {
    return `${mbPerSecond.toFixed(1)} MB/s`;
  }

  const kbPerSecond = bytesPerSecond / 1024;
  return `${Math.max(kbPerSecond, 0).toFixed(0)} KB/s`;
}

export function useInsertSongPlayback() {
  const enqueueSong = usePlaybackQueueStore((state) => state.enqueue);
  const enqueueNextSong = usePlaybackQueueStore((state) => state.enqueueNext);

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

      /**
       * 插播下一首時，後端 response 通常會直接給 nextUp。
       * 這是最準的來源。
       */
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

  const songActionStatusMap = useSongDownloadStatusStore((state) => state.statusMap);
  const setPreparing = useSongDownloadStatusStore((state) => state.setPreparing);
  const setDownloading = useSongDownloadStatusStore((state) => state.setDownloading);
  const clearDownloadStatus = useSongDownloadStatusStore((state) => state.clearStatus);

  // const insertSong = useCallback(
  //   async ({ song, mode = 'next' }: InsertSongParams) => {
  //     const songId = song._id;

  //     let tempUri: string | null = null;

  //     const currentStatus = useSongDownloadStatusStore.getState().statusMap[songId];

  //     /**
  //      * 避免同一首歌在不同 Panel 被重複點擊後重複下載。
  //      */
  //     if (currentStatus) {
  //       console.log('[useInsertSongPlayback] song is already processing:', {
  //         songId,
  //         currentStatus,
  //       });

  //       return;
  //     }

  //     try {
  //       // setPreparing(songId);
  //       setPreparing(song);

  //       const cachedSong = await songCacheService.getCachedSong(songId);

  //       // if (cachedSong?.videoUri) {
  //       //   const item = createPlaybackQueueItem({
  //       //     song,
  //       //     artistText: formatArtists(song.artists),
  //       //     localVideoUri: cachedSong.videoUri,
  //       //   });

  //       //   if (mode === 'queue') {
  //       //     enqueueSong(item);
  //       //   } else {
  //       //     enqueueNextSong(item);
  //       //   }

  //       //   return;
  //       // }

  //       if (cachedSong?.videoUri) {
  //         await syncPendingPlaylistAndEnqueue({
  //           song,
  //           localVideoUri: cachedSong.videoUri,
  //           mode,
  //         });

  //         return;
  //       }

  //       const resolvedAssets = await songAssetResolverService.resolveFromS3Title({
  //         songId,
  //         title: song.title,
  //       });

  //       // setDownloading(songId, 0);
  //       setDownloading(song, 0);

  //       const songDir = await songCacheService.ensureSongDir(songId);
  //       const extension = getFileExtensionFromS3Key(resolvedAssets.s3Key);

  //       /**
  //        * 先下載到暫存檔，避免下載失敗時留下半成品正式檔案。
  //        */
  //       const finalUri = `${songDir}video.${extension}`;
  //       tempUri = `${songDir}video.${extension}.tmp`;

  //       // const downloadResumable = ExpoFileSystem.createDownloadResumable(
  //       //   resolvedAssets.videoUrl,
  //       //   tempUri,
  //       //   {},
  //       //   (downloadProgress) => {
  //       //     const progress = calculateDownloadProgress(
  //       //       downloadProgress.totalBytesWritten,
  //       //       downloadProgress.totalBytesExpectedToWrite,
  //       //     );

  //       //     if (progress === lastProgress) {
  //       //       return;
  //       //     }

  //       //     lastProgress = progress;

  //       //     // setDownloading(songId, progress);
  //       //     setDownloading(song, progress);
  //       //   },
  //       // );

  //       let lastProgress = -1;
  //       let lastProgressUpdateAt = 0;
  //       let lastSpeedText = '-- MB/s';
  //       let lastSpeedTimestamp = Date.now();
  //       let lastBytesWritten = 0;

  //       const downloadResumable = ExpoFileSystem.createDownloadResumable(
  //         resolvedAssets.videoUrl,
  //         tempUri,
  //         {},
  //         (downloadProgress) => {
  //           const progress = calculateDownloadProgress(
  //             downloadProgress.totalBytesWritten,
  //             downloadProgress.totalBytesExpectedToWrite,
  //           );

  //           const now = Date.now();
  //           const elapsedSeconds = (now - lastSpeedTimestamp) / 1000;
  //           const bytesDelta = downloadProgress.totalBytesWritten - lastBytesWritten;

  //           if (elapsedSeconds >= 0.5 && bytesDelta >= 0) {
  //             const bytesPerSecond = bytesDelta / elapsedSeconds;

  //             lastSpeedText = formatDownloadSpeed(bytesPerSecond);
  //             lastSpeedTimestamp = now;
  //             lastBytesWritten = downloadProgress.totalBytesWritten;
  //           }

  //           // if (progress === lastProgress) {
  //           //   return;
  //           // }

  //           // lastProgress = progress;

  //           // setDownloading(song, progress, lastSpeedText);

  //           const progressDelta = progress - lastProgress;
  //           const isProgressChangedEnough = progressDelta >= 0.05;
  //           const isTimePassedEnough = now - lastProgressUpdateAt >= 300;
  //           const isCompleted = progress >= 1;

  //           if (!isProgressChangedEnough && !isTimePassedEnough && !isCompleted) {
  //             return;
  //           }

  //           lastProgress = progress;
  //           lastProgressUpdateAt = now;

  //           setDownloading(song, progress, lastSpeedText);
  //         },
  //       );

  //       songDownloadCancelService.register(songId, downloadResumable);

  //       // activeDownloadTasks.set(songId, {
  //       //   downloadResumable,
  //       //   tempUri,
  //       // });

  //       throwIfDownloadCancelled(songId);

  //       const downloadResult = await downloadResumable.downloadAsync();

  //       // if (cancelledSongIds.has(songId)) {
  //       //   throw new Error('Download cancelled.');
  //       // }

  //       throwIfDownloadCancelled(songId);

  //       if (!downloadResult?.uri) {
  //         throw new Error('Download failed: missing local uri.');
  //       }

  //       throwIfDownloadCancelled(songId);

  //       /**
  //        * 如果正式檔案已存在，先刪除，避免 moveAsync 失敗。
  //        */
  //       const existingFinalFile = await ExpoFileSystem.getInfoAsync(finalUri);

  //       if (existingFinalFile.exists) {
  //         await ExpoFileSystem.deleteAsync(finalUri, {
  //           idempotent: true,
  //         });
  //       }

  //       throwIfDownloadCancelled(songId);

  //       await ExpoFileSystem.moveAsync({
  //         from: tempUri,
  //         to: finalUri,
  //       });

  //       throwIfDownloadCancelled(songId);

  //       await songCacheService.saveCachedSong(songId, {
  //         songId,
  //         videoUri: finalUri,
  //         downloadedAt: Date.now(),
  //         totalBytes: resolvedAssets.size,
  //         song,
  //       });

  //       // const item = createPlaybackQueueItem({
  //       //   song,
  //       //   artistText: formatArtists(song.artists),
  //       //   localVideoUri: finalUri,
  //       // });

  //       // if (mode === 'queue') {
  //       //   enqueueSong(item);
  //       // } else {
  //       //   enqueueNextSong(item);
  //       // }

  //       throwIfDownloadCancelled(songId);

  //       await syncPendingPlaylistAndEnqueue({
  //         song,
  //         localVideoUri: finalUri,
  //         mode,
  //       });
  //     } catch (error) {
  //       if (
  //         songDownloadCancelService.isCancelled(songId) ||
  //         (error instanceof Error && error.message === 'Download cancelled.')
  //       ) {
  //         console.log('[useInsertSongPlayback] download cancelled:', {
  //           songId,
  //           title: song.title,
  //         });

  //         return;
  //       }

  //       console.log('[useInsertSongPlayback] insert song failed:', {
  //         songId,
  //         title: song.title,
  //         error,
  //       });
  //     } finally {
  //       // const activeTask = activeDownloadTasks.get(songId);

  //       // if (activeTask) {
  //       //   await ExpoFileSystem.deleteAsync(activeTask.tempUri, {
  //       //     idempotent: true,
  //       //   });
  //       // }

  //       if (tempUri) {
  //         try {
  //           await ExpoFileSystem.deleteAsync(tempUri, {
  //             idempotent: true,
  //           });
  //         } catch (error) {
  //           console.log('[useInsertSongPlayback] delete temp file failed:', {
  //             songId,
  //             tempUri,
  //             error,
  //           });
  //         }
  //       }

  //       // activeDownloadTasks.delete(songId);
  //       // cancelledSongIds.delete(songId);

  //       songDownloadCancelService.unregister(songId);
  //       clearDownloadStatus(songId);
  //     }
  //   },
  //   // [clearDownloadStatus, enqueueNextSong, enqueueSong, setDownloading, setPreparing],
  //   [clearDownloadStatus, setDownloading, setPreparing, syncPendingPlaylistAndEnqueue],
  // );

  const insertSong = useCallback(
    async ({ song, mode = 'next' }: InsertSongParams) => {
      const songId = song._id;

      const currentStatus = useSongDownloadStatusStore.getState().statusMap[songId];

      if (currentStatus) {
        console.log('[useInsertSongPlayback] song is already processing:', {
          songId,
          currentStatus,
        });

        return;
      }

      try {
        setPreparing(song);

        const cachedSong = await songCacheService.getCachedSong(songId);

        if (cachedSong?.videoUri) {
          await syncPendingPlaylistAndEnqueue({
            song,
            localVideoUri: cachedSong.videoUri,
            mode,
          });

          clearDownloadStatus(songId);
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
        clearDownloadStatus(songId);

        console.log('[useInsertSongPlayback] insert song failed:', {
          songId,
          title: song.title,
          error,
        });
      }
    },
    [clearDownloadStatus, setPreparing, syncPendingPlaylistAndEnqueue],
  );

  // const cancelSongDownload = useCallback(
  //   async (songId: string) => {
  //     const activeTask = activeDownloadTasks.get(songId);

  //     cancelledSongIds.add(songId);

  //     if (!activeTask) {
  //       clearDownloadStatus(songId);
  //       return;
  //     }

  //     try {
  //       await activeTask.downloadResumable.pauseAsync();

  //       await ExpoFileSystem.deleteAsync(activeTask.tempUri, {
  //         idempotent: true,
  //       });
  //     } catch (error) {
  //       console.log('[useInsertSongPlayback] cancel download failed:', {
  //         songId,
  //         error,
  //       });
  //     } finally {
  //       activeDownloadTasks.delete(songId);
  //       cancelledSongIds.delete(songId);
  //       clearDownloadStatus(songId);
  //     }
  //   },
  //   [clearDownloadStatus],
  // );

  // const insertSongNext = useCallback(
  //   async (song: SongDto) => {
  //     await insertSong({
  //       song,
  //       mode: 'next',
  //     });
  //   },
  //   [insertSong],
  // );

  const cancelSongDownload = useCallback(
    async (songId: string) => {
      await songDownloadCancelService.cancel(songId);
      clearDownloadStatus(songId);
    },
    [clearDownloadStatus],
  );

  // const insertSongNext = useCallback(
  //   async (song: SongDto) => {
  //     await enqueueGlobalDownloadJob(async () => {
  //       await insertSong({
  //         song,
  //         mode: 'next',
  //       });
  //     });
  //   },
  //   [insertSong],
  // );

  const insertSongNext = useCallback(
    async (song: SongDto) => {
      await insertSong({
        song,
        mode: 'next',
      });
    },
    [insertSong],
  );

  // const enqueueSongAfterDownload = useCallback(
  //   async (song: SongDto) => {
  //     await insertSong({
  //       song,
  //       mode: 'queue',
  //     });
  //   },
  //   [insertSong],
  // );

  // const enqueueSongAfterDownload = useCallback(
  //   async (song: SongDto) => {
  //     await enqueueGlobalDownloadJob(async () => {
  //       await insertSong({
  //         song,
  //         mode: 'queue',
  //       });
  //     });
  //   },
  //   [insertSong],
  // );

  const enqueueSongAfterDownload = useCallback(
    async (song: SongDto) => {
      await insertSong({
        song,
        mode: 'queue',
      });
    },
    [insertSong],
  );

  return {
    songActionStatusMap,
    insertSong,
    cancelSongDownload,
    insertSongNext,
    enqueueSongAfterDownload,
  };
}
