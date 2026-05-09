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

import { useCategoriesInfiniteQuery } from '@/src/features/category/hooks/category-use-categories-infinite-query';
import { useCategorySongsInfiniteQuery } from '@/src/features/category/hooks/category-use-category-songs-infinite-query';
import { CategoryDto } from '@/src/services/category/category.types';
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

export function CategoryPanel({ visible, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    isFetchingNextPage: isLoadingMoreCategories,
    fetchNextPage: fetchNextCategoriesPage,
    hasNextPage: hasNextCategoriesPage,
    error: categoriesError,
  } = useCategoriesInfiniteQuery({
    enabled: visible,
    limit: PAGE_SIZE,
  });

  const categories = useMemo(() => {
    return categoriesData?.pages.flatMap((page) => page.categories) ?? [];
  }, [categoriesData]);

  const selectedCategoryId = selectedCategory?._id ?? '';

  const {
    data: categorySongsData,
    isLoading: isLoadingSongs,
    isFetchingNextPage: isLoadingMoreSongs,
    fetchNextPage: fetchNextSongsPage,
    hasNextPage: hasNextSongsPage,
    error: categorySongsError,
  } = useCategorySongsInfiniteQuery({
    categoryId: selectedCategoryId,
    enabled: visible && selectedCategoryId.length > 0,
    limit: PAGE_SIZE,
  });

  const songs = useMemo(() => {
    return categorySongsData?.pages.flatMap((page) => page.songs) ?? [];
  }, [categorySongsData]);

  const errorMessage = useMemo(() => {
    if (categoriesError instanceof Error) {
      return categoriesError.message;
    }

    if (categorySongsError instanceof Error) {
      return categorySongsError.message;
    }

    return '';
  }, [categoriesError, categorySongsError]);

  const handleLoadMoreCategories = useCallback(() => {
    if (!hasNextCategoriesPage || isLoadingMoreCategories) {
      return;
    }

    fetchNextCategoriesPage();
  }, [fetchNextCategoriesPage, hasNextCategoriesPage, isLoadingMoreCategories]);

  const handleLoadMoreSongs = useCallback(() => {
    if (!hasNextSongsPage || isLoadingMoreSongs) {
      return;
    }

    fetchNextSongsPage();
  }, [fetchNextSongsPage, hasNextSongsPage, isLoadingMoreSongs]);

  const handlePressCategory = useCallback((category: CategoryDto) => {
    setSelectedCategory(category);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedCategory(null);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>分類</Text>
              <Text style={styles.subtitle}>
                {selectedCategory ? selectedCategory.name : '請選擇歌曲分類'}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>關閉</Text>
            </Pressable>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.content}>
            <View style={styles.categoryColumn}>
              {isLoadingCategories ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>載入分類中</Text>
                </View>
              ) : (
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.listContent}
                  onEndReached={handleLoadMoreCategories}
                  onEndReachedThreshold={0.35}
                  renderItem={({ item }) => {
                    const isSelected = selectedCategory?._id === item._id;

                    return (
                      <Pressable
                        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                        onPress={() => handlePressCategory(item)}
                      >
                        <Text
                          style={[styles.categoryName, isSelected && styles.categoryNameSelected]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.centerContent}>
                      <Text style={styles.emptyText}>目前沒有分類資料</Text>
                    </View>
                  }
                  ListFooterComponent={
                    isLoadingMoreCategories ? (
                      <View style={styles.footerLoading}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>載入更多分類</Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>

            <View style={styles.songColumn}>
              {!selectedCategory ? (
                <View style={styles.centerContent}>
                  <Text style={styles.emptyText}>請先選擇左側分類</Text>
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
                  onEndReached={handleLoadMoreSongs}
                  onEndReachedThreshold={0.35}
                  renderItem={({ item }) => (
                    <View style={styles.songRow}>
                      <View style={styles.songIconBox}>
                        <Text style={styles.songIconText}>♪</Text>
                      </View>

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
                      <Text style={styles.emptyText}>此分類目前沒有歌曲</Text>
                    </View>
                  }
                  ListFooterComponent={
                    isLoadingMoreSongs ? (
                      <View style={styles.footerLoading}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>載入更多歌曲</Text>
                      </View>
                    ) : null
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
  categoryColumn: {
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
  categoryItem: {
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  categoryName: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 17,
    fontWeight: '700',
  },
  categoryNameSelected: {
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
  songIconBox: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
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
