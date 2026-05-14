import * as FileSystem from 'expo-file-system/legacy';

import { useDownloadQueueStore } from '../stores/download-queue.store';
import { SongDownloadTask } from '../types/download.types';
import { songAssetResolverService } from './song-asset-resolver.service';
import { songCacheService } from './song-cache.service';

const MAX_CONCURRENT_DOWNLOADS = 1;

function createTaskId(songId: string) {
  return `${songId}-${Date.now()}`;
}

function getFileExtensionFromUrl(url: string, fallback: string) {
  const cleanUrl = url.split('?')[0];
  const extension = cleanUrl.split('.').pop();

  if (!extension || extension.length > 8) {
    return fallback;
  }

  return extension;
}

async function downloadFile(url: string, targetUri: string) {
  const result = await FileSystem.downloadAsync(url, targetUri);
  return result.uri;
}

async function executeTask(task: SongDownloadTask) {
  const { updateTask, removeTask } = useDownloadQueueStore.getState();

  try {
    updateTask(task.taskId, {
      status: 'downloading',
      progress: 0,
    });

    const assets = await songAssetResolverService.resolve(task.songId);
    const dir = await songCacheService.ensureSongDir(task.songId);

    const videoExtension = getFileExtensionFromUrl(assets.videoUrl, 'mp4');
    const videoUri = `${dir}video.${videoExtension}`;

    const localVideoUri = await downloadFile(assets.videoUrl, videoUri);

    let localVocalUri: string | undefined;
    let localInstrumentalUri: string | undefined;

    if (assets.vocalUrl) {
      const vocalExtension = getFileExtensionFromUrl(assets.vocalUrl, 'wav');
      localVocalUri = await downloadFile(assets.vocalUrl, `${dir}vocal.${vocalExtension}`);
    }

    if (assets.instrumentalUrl) {
      const instrumentalExtension = getFileExtensionFromUrl(assets.instrumentalUrl, 'wav');
      localInstrumentalUri = await downloadFile(
        assets.instrumentalUrl,
        `${dir}instrumental.${instrumentalExtension}`,
      );
    }

    await songCacheService.saveCachedSong(task.songId, {
      songId: task.songId,
      videoUri: localVideoUri,
      vocalUri: localVocalUri,
      instrumentalUri: localInstrumentalUri,
      downloadedAt: Date.now(),
    });

    updateTask(task.taskId, {
      status: 'completed',
      progress: 1,
    });
  } catch (error) {
    updateTask(task.taskId, {
      status: 'failed',
    });

    console.log('[SongDownloadQueue] task failed:', {
      taskId: task.taskId,
      songId: task.songId,
      error,
    });
  } finally {
    removeTask(task.taskId);
    songDownloadQueueService.pump();
  }
}

export const songDownloadQueueService = {
  enqueue({
    songId,
    song,
    priority = 'normal',
  }: {
    songId: string;
    song: SongDownloadTask['song'];
    priority?: SongDownloadTask['priority'];
  }) {
    const task: SongDownloadTask = {
      taskId: createTaskId(songId),
      songId,
      song,
      priority,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };

    useDownloadQueueStore.getState().addTask(task);
    this.pump();

    return task;
  },

  pump() {
    const { tasks, activeTaskIds, setActiveTaskIds } = useDownloadQueueStore.getState();

    const activeCount = activeTaskIds.length;

    if (activeCount >= MAX_CONCURRENT_DOWNLOADS) {
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
