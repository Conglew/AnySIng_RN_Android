import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';
import { SongDto } from '@/src/services/song/song.types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 20;

function formatArtists(artists: SongDto['artists']) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return '未知歌手';
  }

  return artists
    .map((artist) => {
      if (typeof artist === 'string') {
        return artist;
      }

      return artist.name;
    })
    .filter(Boolean)
    .join('、');
}

function getRankLabel(index: number) {
  const rank = index + 1;

  if (rank === 1) {
    return '1';
  }

  if (rank === 2) {
    return '2';
  }

  if (rank === 3) {
    return '3';
  }

  return String(rank);
}

export function RankingSongsPanel({ visible, onClose }: Props) {
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasMore = useMemo(() => {
    if (total === 0) {
      return true;
    }

    return songs.length < total;
  }, [songs.length, total]);

  const loadSongs = useCallback(
    async ({ targetPage, replace }: { targetPage: number; replace: boolean }) => {
      console.log('[RankingSongsPanel] loadSongs:', {
        targetPage,
        replace,
        sortBy: 'playCount',
        order: 'desc',
      });

      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      const response = await songClient.getSongs({
        token,
        params: {
          page: targetPage,
          limit: PAGE_SIZE,
          sortBy: 'playCount',
          order: 'desc',
        },
      });

      console.log('[RankingSongsPanel] API response:', {
        page: response.page,
        limit: response.limit,
        total: response.total,
        count: response.songs.length,
      });

      setTotal(response.total);
      setPage(response.page);

      setSongs((previousSongs) => {
        if (replace) {
          return response.songs;
        }

        const existingIds = new Set(previousSongs.map((song) => song._id));
        const newSongs = response.songs.filter((song) => !existingIds.has(song._id));

        return [...previousSongs, ...newSongs];
      });
    },
    [],
  );

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage('');
      setIsInitialLoading(true);

      await loadSongs({
        targetPage: 1,
        replace: true,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsInitialLoading(false);
    }
  }, [loadSongs]);

  const loadNextPage = useCallback(async () => {
    if (isInitialLoading || isLoadingMore || !hasMore) {
      return;
    }

    try {
      setErrorMessage('');
      setIsLoadingMore(true);

      await loadSongs({
        targetPage: page + 1,
        replace: false,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isInitialLoading, isLoadingMore, loadSongs, page]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSongs([]);
    setPage(1);
    setTotal(0);
    loadFirstPage();
  }, [loadFirstPage, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>排行榜</Text>
              <Text style={styles.subtitle}>依播放次數由高到低排序</Text>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>關閉</Text>
            </Pressable>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {isInitialLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>載入排行榜中</Text>
            </View>
          ) : (
            <FlatList
              data={songs}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              onEndReached={loadNextPage}
              onEndReachedThreshold={0.35}
              renderItem={({ item, index }) => (
                <View style={styles.songRow}>
                  <View style={[styles.rankBox, index < 3 && styles.topRankBox]}>
                    <Text style={[styles.rankText, index < 3 && styles.topRankText]}>
                      {getRankLabel(index)}
                    </Text>
                  </View>

                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <Text style={styles.artistText} numberOfLines={1}>
                      {formatArtists(item.artists)}
                    </Text>
                  </View>

                  <View style={styles.playCountBox}>
                    <Text style={styles.playCountLabel}>播放</Text>
                    <Text style={styles.playCountText}>{item.playCount ?? 0}</Text>
                  </View>

                  <Pressable style={styles.favoriteButton}>
                    <Text style={styles.favoriteText}>♡</Text>
                  </Pressable>

                  <Pressable style={styles.insertButton}>
                    <Text style={styles.insertText}>插播</Text>
                  </Pressable>
                </View>
              )}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>載入更多</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 920,
    height: '82%',
    borderRadius: 16,
    backgroundColor: '#071323',
    padding: 16,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF7A7A',
    marginBottom: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  songRow: {
    minHeight: 74,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topRankBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  topRankText: {
    fontSize: 20,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  artistText: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 15,
    fontWeight: '500',
  },
  playCountBox: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  playCountLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '500',
  },
  playCountText: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  favoriteButton: {
    width: 56,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '400',
  },
  insertButton: {
    minWidth: 72,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insertText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  footerLoading: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
