import { SongDto } from '@/src/services/song/song.types';

export type DownloadPriority = 'normal' | 'high';

export type SongDownloadTask = {
  taskId: string;
  songId: string;
  song: SongDto;
  priority: DownloadPriority;
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
};
