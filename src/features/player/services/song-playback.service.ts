import { SongDto } from '@/src/services/song/song.types';

import {
  CreatePlaybackQueueItemInput,
  usePlaybackQueueStore,
} from '../stores/playback-queue.store';
import { QueueInsertMode } from '../types/playback.types';
import { songCacheService } from './song-cache.service';
import { songDownloadQueueService } from './song-download-queue.service';

function createQueueId(songId: string) {
  return `${songId}-${Date.now()}`;
}

/**
 * 建立播放項目
 *
 * 注意：
 * 這裡只處理已經有 localVideoUri 的歌曲。
 * 如果歌曲還沒下載完成，不應該進入播放列表。
 */
function createPlaybackItem({
  song,
  localVideoUri,
  localVocalUri,
  localInstrumentalUri,
}: {
  song: SongDto;
  localVideoUri: string;
  localVocalUri?: string;
  localInstrumentalUri?: string;
}): CreatePlaybackQueueItemInput {
  return {
    queueId: createQueueId(song._id),
    songId: song._id,
    song,

    /**
     * 播放列表項目需要 title。
     */
    title: song.title,

    /**
     * 你的 SongArtistDto 目前是 string，所以不能使用 artist.name。
     */
    artistText: Array.isArray(song.artists)
      ? song.artists
          .map((artist) => String(artist))
          .filter(Boolean)
          .join('、')
      : undefined,

    /**
     * 播放列表中的歌曲一定要有 localVideoUri。
     */
    localVideoUri,

    /**
     * 若後續要支援人聲 / 伴奏切換，播放項目需要保留這兩個本機路徑。
     */
    localVocalUri,
    localInstrumentalUri,

    createdAt: Date.now(),
  };
}

/**
 * 把已經可播放的歌曲加入播放列表
 */
function insertPlaybackItem({
  song,
  mode,
  localVideoUri,
  localVocalUri,
  localInstrumentalUri,
}: {
  song: SongDto;
  mode: QueueInsertMode;
  localVideoUri: string;
  localVocalUri?: string;
  localInstrumentalUri?: string;
}) {
  const item = createPlaybackItem({
    song,
    localVideoUri,
    localVocalUri,
    localInstrumentalUri,
  });

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

    /**
     * 情況一：
     * 歌曲已經下載完成，有本地影片路徑。
     * 這時候才能加入播放列表。
     */
    if (cached?.videoUri) {
      return insertPlaybackItem({
        song,
        mode,
        localVideoUri: cached.videoUri,
        localVocalUri: cached.vocalUri,
        localInstrumentalUri: cached.instrumentalUri,
      });
    }

    /**
     * 情況二：
     * 歌曲還沒下載。
     * 這裡只加入下載隊列，不加入播放列表。
     *
     * 原因：
     * HomeSidePanel 播放時需要 localVideoUri。
     * 如果把 localVideoUri undefined 的歌曲放進播放列表，
     * 後面 Video source 會沒有可播放路徑。
     */
    songDownloadQueueService.enqueue({
      songId: song._id,
      song,
      priority: mode === 'queue' ? 'normal' : 'high',
    });

    return null;
  },
};
