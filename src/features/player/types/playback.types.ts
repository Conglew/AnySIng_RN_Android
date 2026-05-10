import { SongDto } from '@/src/services/song/song.types';

export type QueueInsertMode = 'queue' | 'priority' | 'interrupt';

export type PlaybackQueueItem = {
  queueId: string;
  songId: string;
  song: SongDto;
  localVideoUri?: string;
  localVocalUri?: string;
  localInstrumentalUri?: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'failed';
  createdAt: number;
};
