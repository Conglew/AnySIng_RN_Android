import { SongDto } from '@/src/services/song/song.types';

import { usePlaybackQueueStore } from '../stores/playback-queue.store';
import { QueueInsertMode } from '../types/playback.types';
import { songCacheService } from './song-cache.service';
import { songDownloadQueueService } from './song-download-queue.service';

function createQueueId(songId: string) {
  return `${songId}-${Date.now()}`;
}

function insertPlaybackItem({
  song,
  mode,
  localVideoUri,
  localVocalUri,
  localInstrumentalUri,
}: {
  song: SongDto;
  mode: QueueInsertMode;
  localVideoUri?: string;
  localVocalUri?: string;
  localInstrumentalUri?: string;
}) {
  const item = {
    queueId: createQueueId(song._id),
    songId: song._id,
    song,
    localVideoUri,
    localVocalUri,
    localInstrumentalUri,
    status: localVideoUri ? ('ready' as const) : ('waiting' as const),
    createdAt: Date.now(),
  };

  const store = usePlaybackQueueStore.getState();

  if (mode === 'interrupt') {
    store.interrupt(item);
    return item;
  }

  if (mode === 'priority') {
    store.enqueueNext(item);
    return item;
  }

  store.enqueue(item);
  return item;
}

export const songPlaybackService = {
  async requestSong({ song, mode }: { song: SongDto; mode: QueueInsertMode }) {
    const cached = await songCacheService.getCachedSong(song._id);

    if (cached?.videoUri) {
      return insertPlaybackItem({
        song,
        mode,
        localVideoUri: cached.videoUri,
        localVocalUri: cached.vocalUri,
        localInstrumentalUri: cached.instrumentalUri,
      });
    }

    const item = insertPlaybackItem({
      song,
      mode,
    });

    songDownloadQueueService.enqueue({
      songId: song._id,
      song,
      priority: mode === 'queue' ? 'normal' : 'high',
    });

    return item;
  },
};
