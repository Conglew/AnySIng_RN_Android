import { SongDto } from '@/src/services/song/song.types';

export type DownloadPriority = 'normal' | 'high';

export type SongDownloadTask = {
  taskId: string;
  songId: string;
  song: SongDto;
  mode: 'queue' | 'next';
  priority: 'normal' | 'high';
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  onCompleted?: (result: { song: SongDto; localVideoUri: string }) => Promise<void>;
};
