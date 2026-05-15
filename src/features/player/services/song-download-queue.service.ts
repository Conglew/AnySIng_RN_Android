import * as FileSystem from 'expo-file-system/legacy';

import { useDownloadQueueStore } from '../stores/download-queue.store';
import { SongDownloadTask } from '../types/download.types';
import { songAssetResolverService } from './song-asset-resolver.service';
import { songCacheService } from './song-cache.service';

import { useSongDownloadStatusStore } from '../stores/song-download-status.store';

const MAX_CONCURRENT_DOWNLOADS = 3;

function createTaskId(songId: string) {
  return `${songId}-${Date.now()}`;
}

async function downloadFile({
  url,
  finalUri,
  task,
}: {
  url: string;
  finalUri: string;
  task: SongDownloadTask;
}) {
  let lastProgress = -1;
  let lastProgressUpdateAt = 0;

  const tempUri = `${finalUri}.tmp`;

  /**
   * 先刪除殘留暫存檔，避免上一次失敗下載留下半成品。
   */
  await FileSystem.deleteAsync(tempUri, {
    idempotent: true,
  });

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    tempUri,
    {},
    (downloadProgress) => {
      const expected = downloadProgress.totalBytesExpectedToWrite;

      if (expected <= 0) {
        return;
      }

      const progress = Math.floor((downloadProgress.totalBytesWritten / expected) * 100);

      const now = Date.now();
      const progressDelta = progress - lastProgress;
      const isProgressChangedEnough = progressDelta >= 5;
      const isTimePassedEnough = now - lastProgressUpdateAt >= 300;
      const isCompleted = progress >= 100;

      if (!isProgressChangedEnough && !isTimePassedEnough && !isCompleted) {
        return;
      }

      lastProgress = progress;
      lastProgressUpdateAt = now;

      useDownloadQueueStore.getState().updateTask(task.taskId, {
        progress,
      });

      useSongDownloadStatusStore.getState().setDownloading(task.song, progress);
    },
  );

  const result = await downloadResumable.downloadAsync();

  console.log('[SongDownloadQueue] download result:', {
    songId: task.songId,
    title: task.song.title,
    status: result?.status,
    uri: result?.uri,
    finalUri,
  });

  /**
   * downloadAsync 有 uri 不代表成功。
   * 必須檢查 HTTP status。
   */
  if (!result?.uri) {
    throw new Error('Download failed: missing local uri.');
  }

  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(tempUri, {
      idempotent: true,
    });

    throw new Error(`Download failed: HTTP ${result.status}`);
  }

  const tempInfo = await FileSystem.getInfoAsync(tempUri);

  if (!tempInfo.exists || tempInfo.size <= 0) {
    await FileSystem.deleteAsync(tempUri, {
      idempotent: true,
    });

    throw new Error('Download failed: downloaded file is empty.');
  }

  /**
   * 如果正式檔案已存在，先刪除，避免 moveAsync 失敗。
   */
  await FileSystem.deleteAsync(finalUri, {
    idempotent: true,
  });

  /**
   * 下載完整後才把 tmp 檔移成正式檔。
   */
  await FileSystem.moveAsync({
    from: tempUri,
    to: finalUri,
  });

  const finalInfo = await FileSystem.getInfoAsync(finalUri);

  if (!finalInfo.exists || finalInfo.size <= 0) {
    throw new Error('Download failed: final file is missing or empty.');
  }

  return finalUri;
}

async function executeTask(task: SongDownloadTask) {
  const { updateTask, removeTask } = useDownloadQueueStore.getState();
  const { setDownloading, clearStatus } = useSongDownloadStatusStore.getState();

  try {
    updateTask(task.taskId, {
      status: 'downloading',
      progress: 0,
    });

    setDownloading(task.song, 0);

    const assets = await songAssetResolverService.resolve(task.songId);

    if (!assets.videoUrl) {
      throw new Error('Missing videoUrl.');
    }

    const dir = await songCacheService.ensureSongDir(task.songId);

    // const videoExtension = getFileExtensionFromUrl(assets.videoUrl, 'mp4');
    // const videoUri = `${dir}video.${videoExtension}`;
    const videoUri = `${dir}video.mkv`;

    const localVideoUri = await downloadFile({
      url: assets.videoUrl,
      finalUri: videoUri,
      task,
    });

    // let localVocalUri: string | undefined;
    // let localInstrumentalUri: string | undefined;

    // if (assets.vocalUrl) {
    //   const vocalExtension = getFileExtensionFromUrl(assets.vocalUrl, 'wav');

    //   localVocalUri = await downloadFile({
    //     url: assets.vocalUrl,
    //     finalUri: `${dir}vocal.${vocalExtension}`,
    //     task,
    //   });
    // }

    // if (assets.instrumentalUrl) {
    //   const instrumentalExtension = getFileExtensionFromUrl(
    //     assets.instrumentalUrl,
    //     'wav',
    //   );

    //   localInstrumentalUri = await downloadFile({
    //     url: assets.instrumentalUrl,
    //     finalUri: `${dir}instrumental.${instrumentalExtension}`,
    //     task,
    //   });
    // }

    await songCacheService.saveCachedSong(task.songId, {
      songId: task.songId,
      videoUri: localVideoUri,
      // vocalUri: localVocalUri,
      // instrumentalUri: localInstrumentalUri,
      downloadedAt: Date.now(),
      song: task.song,
    });

    updateTask(task.taskId, {
      status: 'completed',
      progress: 100,
    });

    if (task.onCompleted) {
      await task.onCompleted({
        song: task.song,
        localVideoUri,
      });
    }
  } catch (error) {
    updateTask(task.taskId, {
      status: 'failed',
    });

    console.log('[SongDownloadQueue] task failed:', {
      taskId: task.taskId,
      songId: task.songId,
      title: task.song.title,
      error,
    });
  } finally {
    const latestState = useDownloadQueueStore.getState();

    latestState.setActiveTaskIds(
      latestState.activeTaskIds.filter((taskId) => taskId !== task.taskId),
    );

    removeTask(task.taskId);
    clearStatus(task.songId);
    songDownloadQueueService.pump();
  }
}

export const songDownloadQueueService = {
  enqueue({
    songId,
    song,
    mode,
    priority = 'normal',
    onCompleted,
  }: {
    songId: string;
    song: SongDownloadTask['song'];
    mode: SongDownloadTask['mode'];
    priority?: SongDownloadTask['priority'];
    onCompleted?: SongDownloadTask['onCompleted'];
  }) {
    const task: SongDownloadTask = {
      taskId: createTaskId(songId),
      songId,
      song,
      mode,
      priority,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      onCompleted,
    };

    useDownloadQueueStore.getState().addTask(task);

    console.log('[SongDownloadQueue] enqueue:', {
      taskId: task.taskId,
      songId: task.songId,
      title: task.song.title,
      mode: task.mode,
      priority: task.priority,
    });

    this.pump();

    return task;
  },

  pump() {
    const { tasks, activeTaskIds, setActiveTaskIds } = useDownloadQueueStore.getState();

    const activeCount = activeTaskIds.length;

    console.log('[SongDownloadQueue] pump:', {
      tasksCount: tasks.length,
      activeTaskIds,
      activeCount,
      maxConcurrentDownloads: MAX_CONCURRENT_DOWNLOADS,
    });

    if (activeCount >= MAX_CONCURRENT_DOWNLOADS) {
      console.log('[SongDownloadQueue] pump skipped: max concurrent reached', {
        activeTaskIds,
      });

      return;
    }

    const availableSlots = MAX_CONCURRENT_DOWNLOADS - activeCount;

    const queuedTasks = tasks
      .filter((task) => task.status === 'queued')
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') {
          return -1;
        }

        if (a.priority !== 'high' && b.priority === 'high') {
          return 1;
        }

        return a.createdAt - b.createdAt;
      })
      .slice(0, availableSlots);

    console.log('[SongDownloadQueue] queued tasks selected:', {
      queuedTaskIds: queuedTasks.map((task) => task.taskId),
    });

    if (queuedTasks.length === 0) {
      return;
    }

    const nextActiveIds = [...activeTaskIds, ...queuedTasks.map((task) => task.taskId)];

    setActiveTaskIds(nextActiveIds);

    queuedTasks.forEach((task) => {
      executeTask(task);
    });
  },
};
