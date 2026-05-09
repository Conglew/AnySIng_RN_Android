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

import { useSingerSongsQuery } from '@/src/features/singer/hook/singer-use-singer-songs-query';
import { useSingersInfiniteQuery } from '@/src/features/singer/hook/singer-use-singers-infinite-query';
import { SingerDto } from '@/src/services/singer/singer.types';
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

export function SingerPanel({ visible, onClose }: Props) {
  const [selectedSinger, setSelectedSinger] = useState<SingerDto | null>(null);

  const {
    data: singersData,
    isLoading: isLoadingSingers,
    isFetchingNextPage: isLoadingMoreSingers,
    fetchNextPage,
    hasNextPage,
    error: singersError,
  } = useSingersInfiniteQuery({
    enabled: visible,
    limit: PAGE_SIZE,
  });

  const singers = useMemo(() => {
    return singersData?.pages.flatMap((page) => page.artists) ?? [];
  }, [singersData]);

  const selectedSingerId = selectedSinger?._id ?? '';

  const {
    data: singerSongsData,
    isLoading: isLoadingSongs,
    error: singerSongsError,
  } = useSingerSongsQuery({
    singerId: selectedSingerId,
    enabled: visible && selectedSingerId.length > 0,
  });

  const songs = singerSongsData?.songs ?? [];

  const errorMessage = useMemo(() => {
    if (singersError instanceof Error) {
      return singersError.message;
    }

    if (singerSongsError instanceof Error) {
      return singerSongsError.message;
    }

    return '';
  }, [singerSongsError, singersError]);

  const handleLoadMoreSingers = useCallback(() => {
    if (!hasNextPage || isLoadingMoreSingers) {
      return;
    }

    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isLoadingMoreSingers]);

  const handlePressSinger = useCallback((singer: SingerDto) => {
    setSelectedSinger(singer);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedSinger(null);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>歌手</Text>
              <Text style={styles.subtitle}>
                {selectedSinger ? selectedSinger.name : '請選擇歌手'}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>關閉</Text>
            </Pressable>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.content}>
            <View style={styles.singerColumn}>
              {isLoadingSingers ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>載入歌手中</Text>
                </View>
              ) : (
                <FlatList
                  data={singers}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.listContent}
                  onEndReached={handleLoadMoreSingers}
                  onEndReachedThreshold={0.35}
                  renderItem={({ item }) => {
                    const isSelected = selectedSinger?._id === item._id;

                    return (
                      <Pressable
                        style={[styles.singerItem, isSelected && styles.singerItemSelected]}
                        onPress={() => handlePressSinger(item)}
                      >
                        <Text
                          style={[styles.singerName, isSelected && styles.singerNameSelected]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.centerContent}>
                      <Text style={styles.emptyText}>目前沒有歌手資料</Text>
                    </View>
                  }
                  ListFooterComponent={
                    isLoadingMoreSingers ? (
                      <View style={styles.footerLoading}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>載入更多歌手</Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>

            <View style={styles.songColumn}>
              {!selectedSinger ? (
                <View style={styles.centerContent}>
                  <Text style={styles.emptyText}>請先選擇左側歌手</Text>
                </View>
              ) : isLoadingSongs ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>載入歌曲中</Text>
                </View>
              ) : (
                <FlatList
                  data={songs}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }) => (
                    <View style={styles.songRow}>
                      <View style={styles.songInfo}>
                        <Text style={styles.songTitle} numberOfLines={1}>
                          {item.title}
                        </Text>

                        <Text style={styles.artistText} numberOfLines={1}>
                          {formatArtists(item.artists)}
                        </Text>
                      </View>

                      <Pressable style={styles.favoriteButton}>
                        <Text style={styles.favoriteText}>♡</Text>
                      </Pressable>

                      <Pressable style={styles.insertButton}>
                        <Text style={styles.insertText}>插播</Text>
                      </Pressable>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.centerContent}>
                      <Text style={styles.emptyText}>此歌手目前沒有歌曲</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
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
    maxWidth: 1040,
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
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  singerColumn: {
    width: 240,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    padding: 10,
  },
  songColumn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  singerItem: {
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  singerItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  singerName: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 17,
    fontWeight: '700',
  },
  singerNameSelected: {
    color: '#FFFFFF',
  },
  songRow: {
    minHeight: 74,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginBottom: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
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
  favoriteButton: {
    width: 64,
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
  centerContent: {
    flex: 1,
    minHeight: 160,
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
    fontWeight: '600',
  },
  footerLoading: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
