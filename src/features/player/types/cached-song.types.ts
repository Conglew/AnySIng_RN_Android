import { SongDto } from '@/src/services/song/song.types';

export type CachedSongAsset = {
  songId: string;
  videoUri?: string;
  vocalUri?: string;
  instrumentalUri?: string;
  downloadedAt: number;
  totalBytes?: number;
  song?: SongDto;
};
