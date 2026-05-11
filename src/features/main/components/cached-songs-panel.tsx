import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { songCacheService } from '@/src/features/player/services/song-cache.service';
import { SongDownloadStatus } from '@/src/features/player/stores/song-download-status.store';
import { CachedSongAsset } from '@/src/features/player/types/cached-song.types';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 500;

function formatArtists(artists: CachedSongAsset['song'] extends infer T ? any : never) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return '未知歌手';
  }

  return artists
    .map((artist) => String(artist))
    .filter(Boolean)
    .join('、');
}

function truncateText(value: string, maxLength: number) {
  const chars = Array.from(value);

  if (chars.length <= maxLength) {
    return value;
  }

  return `${chars.slice(0, maxLength).join('')}...`;
}

function getInsertButtonText(status?: SongDownloadStatus) {
  if (!status) {
    return '插播';
  }

  if (status.phase === 'preparing') {
    return '準備中';
  }

  if (status.phase === 'downloading') {
    return `下載中 ${status.progress ?? 0}%`;
  }

  return '插播';
}

export function CachedSongsPanel({ visible, onClose }: Props) {
  const [cachedSongs, setCachedSongs] = useState<CachedSongAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();

  const totalPages = useMemo(() => {
    if (cachedSongs.length <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(cachedSongs.length / PAGE_SIZE));
  }, [cachedSongs.length]);

  const loadCachedSongs = useCallback(async () => {
    try {
      setErrorMessage('');
      setIsLoading(true);

      const result = await songCacheService.getAllCachedSongs();

      setCachedSongs(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearAllCachedSongs = useCallback(async () => {
    try {
      setErrorMessage('');
      setIsLoading(true);

      await songCacheService.clearAllCachedSongs();

      setCachedSongs([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    loadCachedSongs();
  }, [loadCachedSongs, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>緩存下載</Text>

          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>編輯</Text>
          </Pressable>

          {/* <Pressable style={styles.editButton} onPress={handleClearAllCachedSongs}>
            <Text style={styles.editButtonText}>清除</Text>
          </Pressable> */}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>讀取緩存歌曲中</Text>
          </View>
        ) : (
          <FlatList
            data={cachedSongs}
            keyExtractor={(item) => item.songId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const song = item.song;
              const title = song?.title ?? item.songId;
              const artists = song?.artists;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.songRow,
                    pressed && styles.songRowPressed,
                    songActionStatusMap[item.songId] && styles.songRowResolving,
                  ]}
                  disabled={!song}
                  onPress={() => {
                    if (!song) {
                      return;
                    }

                    insertSongNext(song);
                  }}
                >
                  <View style={styles.songIconBox}>
                    <SongReadyIcon width={32} height={32} />
                  </View>

                  <Text style={styles.songTitle} numberOfLines={1}>
                    {truncateText(formatDisplaySongTitle(title), 16)}
                  </Text>

                  <Text style={styles.artistText} numberOfLines={1}>
                    {truncateText(formatArtists(artists), 10)}
                  </Text>

                  <Pressable style={styles.favoriteButton}>
                    {song?.isCollected ? (
                      <SongLikedIcon width={42} height={42} />
                    ) : (
                      <SongLikeIcon width={42} height={42} />
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.insertButton}
                    disabled={!song || Boolean(songActionStatusMap[item.songId])}
                    onPress={(event) => {
                      event.stopPropagation();

                      if (!song) {
                        return;
                      }

                      insertSongNext(song);
                    }}
                  >
                    <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
                      {getInsertButtonText(songActionStatusMap[item.songId])}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centerContent}>
                <Text style={styles.emptyText}>目前沒有已緩存歌曲</Text>
              </View>
            }
          />
        )}

        <View style={styles.footerRow}>
          {/* <Text style={styles.pageText}>1/{totalPages}</Text> */}

          <Pressable style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>返回</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 60,
    backgroundColor: 'transparent',
  },

  panel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: 'transparent',
  },

  headerRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },

  editButton: {
    width: 80,
    height: 44,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  listContent: {
    paddingTop: 2,
    paddingBottom: 12,
  },

  songRow: {
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(62, 62, 62, 0.5)',
    marginBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  songRowPressed: {
    opacity: 0.82,
  },

  songRowResolving: {
    opacity: 0.55,
  },

  songIconBox: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 5,
  },

  songTitle: {
    width: 360,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  artistText: {
    flex: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 16,
  },

  favoriteButton: {
    width: 52,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insertButton: {
    width: 72,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insertText: {
    width: 90,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
  },

  footerRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 24,
  },

  pageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  backButton: {
    width: 160,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  errorText: {
    color: '#FF7A7A',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
  },

  centerContent: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },

  emptyText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 16,
    fontWeight: '700',
  },
});
