import * as FileSystem from 'expo-file-system/legacy';

import { nativeStorageService } from './native-storage.service';

const SONG_CACHE_ROOT = `${FileSystem.documentDirectory}songs/`;
const RESERVED_FREE_BYTES = 500 * 1024 * 1024;

export const storageManagerService = {
  /**
   * 取得歌曲快取根目錄。
   * 目前使用 documentDirectory，因為它比 cacheDirectory 更適合保存「已下載歌曲」。
   */
  getSongCacheRoot() {
    return SONG_CACHE_ROOT;
  },

  /**
   * 取得單首歌曲的本地資料夾。
   */
  getSongDirectory(songId: string) {
    return `${SONG_CACHE_ROOT}${songId}/`;
  },

  /**
   * 確保歌曲快取根目錄存在。
   */
  async ensureSongCacheRoot() {
    const info = await FileSystem.getInfoAsync(SONG_CACHE_ROOT);

    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(SONG_CACHE_ROOT, {
        intermediates: true,
      });
    }

    return SONG_CACHE_ROOT;
  },

  /**
   * 確保單首歌曲資料夾存在。
   */
  async ensureSongDirectory(songId: string) {
    await this.ensureSongCacheRoot();

    const songDirectory = this.getSongDirectory(songId);
    const info = await FileSystem.getInfoAsync(songDirectory);

    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(songDirectory, {
        intermediates: true,
      });
    }

    return songDirectory;
  },

  /**
   * 檢查目前可用空間。
   * Expo FileSystem 支援 getFreeDiskStorageAsync。
   */
  async getFreeDiskStorageBytes() {
    return FileSystem.getFreeDiskStorageAsync();
  },

  /**
   * 檢查總空間。
   */
  async getTotalDiskStorageBytes() {
    return FileSystem.getTotalDiskCapacityAsync();
  },

  /**
   * 下載前檢查空間是否足夠。
   * requiredBytes 建議由後端提供檔案大小；如果沒有，就先傳一個預估值。
   */
  async hasEnoughSpace(requiredBytes: number) {
    const freeBytes = await this.getFreeDiskStorageBytes();

    return freeBytes - RESERVED_FREE_BYTES > requiredBytes;
  },

  async getLargestNativeVolume() {
    const volumes = await nativeStorageService.getAvailableStorageVolumes();

    if (volumes.length === 0) {
      return null;
    }

    return volumes.reduce((largest, current) => {
      return current.freeBytes > largest.freeBytes ? current : largest;
    });
  },
};
