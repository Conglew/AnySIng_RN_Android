import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { SongDownloadStatus } from '@/src/features/player/stores/song-download-status.store';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

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
    .map((artist) => String(artist))
    .filter(Boolean)
    .join('、');
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

function truncateText(value: string, maxLength: number) {
  const chars = Array.from(value);

  if (chars.length <= maxLength) {
    return value;
  }

  return `${chars.slice(0, maxLength).join('')}...`;
}

function getCategoryImageSource(categoryName: string) {
  return CATEGORY_IMAGES[categoryName];
}

const CATEGORY_IMAGES: Record<string, ReturnType<typeof require>> = {
  炒熱氣氛: require('@/assets/images/category/img-01.png'),
  當下最火: require('@/assets/images/category/img-02.png'),
  失戀情歌: require('@/assets/images/category/img-03.png'),
  雙人對唱: require('@/assets/images/category/img-04.png'),
  高音挑戰: require('@/assets/images/category/img-05.png'),
  影視金曲: require('@/assets/images/category/img-06.png'),
  抖音神曲: require('@/assets/images/category/img-07.png'),
  嘻哈饒舌: require('@/assets/images/category/img-08.png'),
  千禧世代: require('@/assets/images/category/img-09.png'),
  '90s': require('@/assets/images/category/img-10.png'),
  '80s': require('@/assets/images/category/img-11.png'),
  '70s': require('@/assets/images/category/img-12.png'),
};

export function CategoryPanel({ visible, onClose }: Props) {
  const songListRef = useRef<FlatList<SongDto>>(null);

  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);

  const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();

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

    requestAnimationFrame(() => {
      songListRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
    });
  }, []);

  // const handleBackToCategories = useCallback(() => {
  //   setSelectedCategory(null);
  // }, []);

  const handlePressBack = useCallback(() => {
    if (selectedCategory) {
      setSelectedCategory(null);
      return;
    }

    onClose();
  }, [onClose, selectedCategory]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedCategory(null);
  }, [visible]);

  if (!visible) {
    return null;
  }

  const isCategoryListMode = !selectedCategory;

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {isCategoryListMode ? (
          <View style={styles.categoryView}>
            <Text style={styles.title}>分類</Text>

            {isLoadingCategories ? (
              <View style={styles.centerContent}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>載入分類中</Text>
              </View>
            ) : (
              // <ScrollView
              //   contentContainerStyle={styles.categoryGridContent}
              //   showsVerticalScrollIndicator={false}
              // >
              //   {categories.length === 0 ? (
              //     <View style={styles.centerContent}>
              //       <Text style={styles.emptyText}>目前沒有分類資料</Text>
              //     </View>
              //   ) : (
              //     categories.map((item) => (
              //       <Pressable
              //         key={item._id}
              //         style={styles.categoryCard}
              //         onPress={() => handlePressCategory(item)}
              //       >
              //         <View style={styles.categoryImageBox}>
              //           {'imageUrl' in item && item.imageUrl ? (
              //             <Image
              //               source={{ uri: String(item.imageUrl) }}
              //               style={styles.categoryImage}
              //               resizeMode="cover"
              //             />
              //           ) : (
              //             <View style={styles.categoryPlaceholder}>
              //               <View style={styles.categoryPlaceholderHead} />
              //               <View style={styles.categoryPlaceholderBody} />
              //             </View>
              //           )}
              //         </View>

              //         <Text style={styles.categoryName} numberOfLines={1}>
              //           {truncateText(item.name, 5)}
              //         </Text>
              //       </Pressable>
              //     ))
              //   )}

              //   {isLoadingMoreCategories ? (
              //     <View style={styles.footerLoading}>
              //       <ActivityIndicator />
              //       <Text style={styles.loadingText}>載入更多分類</Text>
              //     </View>
              //   ) : null}
              // </ScrollView>

              <ScrollView
                contentContainerStyle={styles.categoryGridContent}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={({ nativeEvent }) => {
                  const paddingToBottom = 40;

                  const isCloseToBottom =
                    nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
                    nativeEvent.contentSize.height - paddingToBottom;

                  if (isCloseToBottom) {
                    handleLoadMoreCategories();
                  }
                }}
              >
                {categories.length === 0 ? (
                  <View style={styles.centerContent}>
                    <Text style={styles.emptyText}>目前沒有分類資料</Text>
                  </View>
                ) : (
                  categories.map((item) => {
                    const categoryImageSource = getCategoryImageSource(item.name);

                    return (
                      <Pressable
                        key={item._id}
                        style={styles.categoryCard}
                        onPress={() => handlePressCategory(item)}
                      >
                        <View style={styles.categoryImageBox}>
                          {categoryImageSource ? (
                            <Image
                              source={categoryImageSource}
                              style={styles.categoryImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.categoryPlaceholder}>
                              <View style={styles.categoryPlaceholderHead} />
                              <View style={styles.categoryPlaceholderBody} />
                            </View>
                          )}
                        </View>

                        <Text style={styles.categoryName} numberOfLines={1}>
                          {truncateText(item.name, 5)}
                        </Text>
                      </Pressable>
                    );
                  })
                )}

                {isLoadingMoreCategories ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>載入更多分類</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}

            <View style={styles.bottomBar}>
              {/* <Text style={styles.pageText}>1/998</Text> */}

              <Pressable style={styles.backButton} onPress={onClose}>
                <Text style={styles.backButtonText}>返回</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.songView}>
            <View style={styles.songHeader}>
              <Text style={styles.title}>{selectedCategory.name}</Text>

              <Pressable style={styles.searchButton}>
                <Text style={styles.searchIcon}>⌕</Text>
              </Pressable>
            </View>

            {isLoadingSongs ? (
              <View style={styles.centerContent}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>載入歌曲中</Text>
              </View>
            ) : (
              <FlatList
                ref={songListRef}
                data={songs}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.songListContent}
                onEndReached={handleLoadMoreSongs}
                onEndReachedThreshold={0.35}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.songRow,
                      pressed && styles.songRowPressed,
                      songActionStatusMap[item._id] && styles.songRowResolving,
                    ]}
                    onPress={() => insertSongNext(item)}
                  >
                    <View style={styles.songIconBox}>
                      <SongReadyIcon width={32} height={32} />
                    </View>

                    <Text style={styles.songTitle} numberOfLines={1}>
                      {truncateText(formatDisplaySongTitle(item.title), 16)}
                    </Text>

                    <Text style={styles.artistText} numberOfLines={1}>
                      {truncateText(formatArtists(item.artists), 10)}
                    </Text>

                    <Pressable style={styles.favoriteButton}>
                      {item.isCollected ? (
                        <SongLikedIcon width={42} height={42} />
                      ) : (
                        <SongLikeIcon width={42} height={42} />
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.insertButton}
                      disabled={Boolean(songActionStatusMap[item._id])}
                      onPress={(event) => {
                        event.stopPropagation();
                        insertSongNext(item);
                      }}
                    >
                      <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
                        {getInsertButtonText(songActionStatusMap[item._id])}
                      </Text>
                    </Pressable>
                  </Pressable>
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

            <View style={styles.bottomBar}>
              {/* <Text style={styles.pageText}>1/28</Text> */}

              <Pressable style={styles.backButton} onPress={handlePressBack}>
                <Text style={styles.backButtonText}>返回</Text>
              </Pressable>
            </View>
          </View>
        )}
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
    zIndex: 50,
    backgroundColor: 'transparent',
  },

  panel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: 'transparent',
  },

  categoryView: {
    flex: 1,
  },

  songView: {
    flex: 1,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },

  categoryGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },

  categoryGridRow: {
    gap: 15,
    marginBottom: 10,
  },

  categoryCard: {
    width: 150,
    height: 200,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    // backgroundColor: 'red',
  },

  categoryImageBox: {
    width: 150,
    height: 150,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  categoryImage: {
    width: '100%',
    height: '100%',
  },

  categoryPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2633',
  },

  categoryPlaceholderHead: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#A8A8A8',
  },

  categoryPlaceholderBody: {
    width: 74,
    height: 56,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#A8A8A8',
    marginTop: 8,
  },

  categoryName: {
    height: 50,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  songHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  searchButton: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  songListContent: {
    paddingBottom: 8,
  },

  songRow: {
    height: 42,
    borderRadius: 6,
    backgroundColor: 'rgba(62, 62, 62, 0.5)',
    marginBottom: 8,
    paddingHorizontal: 16,
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
    width: 285,
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

  bottomBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 24,
  },

  pageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  backButton: {
    width: 136,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  errorText: {
    color: '#FF7A7A',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
  },

  footerLoading: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
