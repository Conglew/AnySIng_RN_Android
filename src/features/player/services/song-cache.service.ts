import * as FileSystem from 'expo-file-system/legacy';

import { storageManagerService } from './storage-manager.service';

import { CachedSongAsset } from '../types/cached-song.types';

const CACHE_INDEX_URI = `${FileSystem.documentDirectory}song-cache-index-v1.json`;

function getSongCacheDir(songId: string) {
  return storageManagerService.getSongDirectory(songId);
}

async function fileExists(uri?: string) {
  if (!uri) {
    return true;
  }

  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}

async function readCacheIndex(): Promise<Record<string, CachedSongAsset>> {
  const info = await FileSystem.getInfoAsync(CACHE_INDEX_URI);

  if (!info.exists) {
    return {};
  }

  try {
    const raw = await FileSystem.readAsStringAsync(CACHE_INDEX_URI);

    if (!raw) {
      return {};
    }

    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeCacheIndex(index: Record<string, CachedSongAsset>) {
  await FileSystem.writeAsStringAsync(CACHE_INDEX_URI, JSON.stringify(index));
}

export const songCacheService = {
  async getCachedSong(songId: string) {
    const index = await readCacheIndex();
    const cached = index[songId];

    if (!cached) {
      return null;
    }

    const hasVideo = await fileExists(cached.videoUri);
    const hasVocal = await fileExists(cached.vocalUri);
    const hasInstrumental = await fileExists(cached.instrumentalUri);

    if (!hasVideo || !hasVocal || !hasInstrumental) {
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
