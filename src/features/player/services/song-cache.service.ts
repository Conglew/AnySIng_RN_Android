import * as FileSystem from 'expo-file-system/legacy';

// import * as ExpoFileSystem from 'expo-file-system/legacy';

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

async function cleanupTemporarySongFiles() {
  const songsRootDir = `${FileSystem.documentDirectory}songs/`;

  try {
    const rootInfo = await FileSystem.getInfoAsync(songsRootDir);

    if (!rootInfo.exists) {
      return;
    }

    if (!rootInfo.isDirectory) {
      return;
    }

    const songDirNames = await FileSystem.readDirectoryAsync(songsRootDir);

    await Promise.all(
      songDirNames.map(async (songDirName) => {
        const songDir = `${songsRootDir}${songDirName}/`;
        const songDirInfo = await FileSystem.getInfoAsync(songDir);

        if (!songDirInfo.exists || !songDirInfo.isDirectory) {
          return;
        }

        const filenames = await FileSystem.readDirectoryAsync(songDir);

        const temporaryFiles = filenames.filter((filename) => filename.endsWith('.tmp'));

        await Promise.all(
          temporaryFiles.map((filename) =>
            FileSystem.deleteAsync(`${songDir}${filename}`, {
              idempotent: true,
            }),
          ),
        );
      }),
    );
  } catch (error) {
    console.log('[songCacheService] cleanupTemporarySongFiles failed:', error);
  }
}

async function clearAllCachedSongs() {
  try {
    const songsRootDir = `${FileSystem.documentDirectory}songs/`;

    const songsRootInfo = await FileSystem.getInfoAsync(songsRootDir);

    if (songsRootInfo.exists) {
      await FileSystem.deleteAsync(songsRootDir, {
        idempotent: true,
      });
    }

    await FileSystem.makeDirectoryAsync(songsRootDir, {
      intermediates: true,
    });

    await writeCacheIndex({});

    console.log('[songCacheService] cleared all cached songs');
  } catch (error) {
    console.log('[songCacheService] clearAllCachedSongs failed:', error);
    throw error;
  }
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

  async getAllCachedSongs() {
    const index = await readCacheIndex();
    const entries = Object.entries(index);

    const validCachedSongs: CachedSongAsset[] = [];

    for (const [songId, cached] of entries) {
      const hasVideo = await fileExists(cached.videoUri);
      const hasVocal = await fileExists(cached.vocalUri);
      const hasInstrumental = await fileExists(cached.instrumentalUri);

      if (!hasVideo || !hasVocal || !hasInstrumental) {
        delete index[songId];
        continue;
      }

      validCachedSongs.push(cached);
    }

    await writeCacheIndex(index);

    return validCachedSongs.sort((a, b) => {
      return (b.downloadedAt ?? 0) - (a.downloadedAt ?? 0);
    });
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

  cleanupTemporarySongFiles,

  clearAllCachedSongs,

  getSongCacheDir,
};
