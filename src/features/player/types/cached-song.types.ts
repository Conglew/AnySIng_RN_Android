export type CachedSongAsset = {
  songId: string;
  videoUri?: string;
  vocalUri?: string;
  instrumentalUri?: string;
  downloadedAt: number;
  totalBytes?: number;
};
