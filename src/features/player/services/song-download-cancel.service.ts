import * as ExpoFileSystem from 'expo-file-system/legacy';

const activeDownloads = new Map<string, ExpoFileSystem.DownloadResumable>();
const cancelledSongIds = new Set<string>();

export const songDownloadCancelService = {
  register(songId: string, downloadResumable: ExpoFileSystem.DownloadResumable) {
    activeDownloads.set(songId, downloadResumable);
  },

  unregister(songId: string) {
    activeDownloads.delete(songId);
    cancelledSongIds.delete(songId);
  },

  async cancel(songId: string) {
    cancelledSongIds.add(songId);

    const downloadResumable = activeDownloads.get(songId);

    if (!downloadResumable) {
      return;
    }

    try {
      await downloadResumable.pauseAsync();
    } catch (error) {
      console.log('[SongDownloadCancelService] cancel failed:', {
        songId,
        error,
      });
    } finally {
      activeDownloads.delete(songId);
    }
  },

  isCancelled(songId: string) {
    return cancelledSongIds.has(songId);
  },

  clearCancelled(songId: string) {
    cancelledSongIds.delete(songId);
  },
};