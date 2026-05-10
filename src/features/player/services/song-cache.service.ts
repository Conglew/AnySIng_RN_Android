import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { storageManagerService } from './storage-manager.service';

import { CachedSongAsset } from '../types/cached-song.types';

const CACHE_INDEX_KEY = 'song-cache-index-v1';

function getSongCacheDir(songId: string) {
  return storageManagerService.getSongDirectory(songId);
}

async function readCacheIndex(): Promise<Record<string, CachedSongAsset>> {
  const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeCacheIndex(index: Record<string, CachedSongAsset>) {
  await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
}

export const songCacheService = {
  async getCachedSong(songId: string) {
    const index = await readCacheIndex();
    const cached = index[songId];

    if (!cached) {
      return null;
    }

    const videoExists = cached.videoUri ? await FileSystem.getInfoAsync(cached.videoUri) : null;

    if (cached.videoUri && !videoExists?.exists) {
      delete index[songId];
      await writeCacheIndex(index);
      return null;
    }

    return cached;
  },

  async ensureSongDir(songId: string) {
    return storageManagerService.ensureSongDirectory(songId);
  },

  async saveCachedSong(songId: string, cached: CachedSongAsset) {
    const index = await readCacheIndex();

    index[songId] = cached;

    await writeCacheIndex(index);
  },

  async removeCachedSong(songId: string) {
    const index = await readCacheIndex();
    const dir = getSongCacheDir(songId);

    delete index[songId];

    await writeCacheIndex(index);

    const info = await FileSystem.getInfoAsync(dir);

    if (info.exists) {
      await FileSystem.deleteAsync(dir, {
        idempotent: true,
      });
    }
  },

  getSongCacheDir,
};
