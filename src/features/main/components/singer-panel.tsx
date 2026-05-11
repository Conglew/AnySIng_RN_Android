import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CustomKeyboard } from '@/src/features/main/components/custom-keyboard';
import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { SongDownloadStatus } from '@/src/features/player/stores/song-download-status.store';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import { SongDto } from '@/src/services/song/song.types';

import { useSingerSongsInfiniteQuery } from '@/src/features/singer/hook/singer-use-singer-songs-infinite-query';
import { useSingersInfiniteQuery } from '@/src/features/singer/hook/singer-use-singers-infinite-query';
import { SingerDto } from '@/src/services/singer/singer.types';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

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

/**
 * 從 SingerDto 裡嘗試取圖片欄位。
 *
 * 因為我目前不知道你的 SingerDto 實際圖片欄位名稱，
 * 所以這裡先相容 imageUrl / avatarUrl / coverUrl / image_url / avatar_url / cover_url。
 */
function getSingerImageSource(singer: SingerDto): ImageSourcePropType | null {
  const record = singer as unknown as Record<string, unknown>;

  const imageUrl =
    record.imageUrl ??
    record.avatarUrl ??
    record.coverUrl ??
    record.image_url ??
    record.avatar_url ??
    record.cover_url;

  if (typeof imageUrl === 'string' && imageUrl.length > 0) {
    return {
      uri: imageUrl,
    };
  }

  return null;
}

function getSingerName(singer: SingerDto) {
  const record = singer as unknown as Record<string, unknown>;

  if (typeof record.name === 'string') {
    return record.name;
  }

  if (typeof record.singerName === 'string') {
    return record.singerName;
  }

  if (typeof record.artistName === 'string') {
    return record.artistName;
  }

  return '未知歌手';
}

function getSingerId(singer: SingerDto) {
  const record = singer as unknown as Record<string, unknown>;

  if (typeof record._id === 'string') {
    return record._id;
  }

  if (typeof record.id === 'string') {
    return record.id;
  }

  if (typeof record.singerId === 'string') {
    return record.singerId;
  }

  return getSingerName(singer);
}

export function SingerPanel({ visible, onClose }: Props) {
  const songListRef = useRef<FlatList<SongDto>>(null);

  const [selectedSinger, setSelectedSinger] = useState<SingerDto | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();

  const isSingerListMode = selectedSinger === null;
  const selectedSingerId = selectedSinger ? getSingerId(selectedSinger) : '';
  const selectedSingerName = selectedSinger ? getSingerName(selectedSinger) : '';

  /**
   * 第一層：歌手列表
   *
   * 如果你的 hook 支援 keyword，可以把 keyword 傳進去。
   * 如果不支援，保留目前寫法，下面會用前端 filter 做已載入資料搜尋。
   */
  const {
    data: singersData,
    isLoading: isLoadingSingers,
    isFetchingNextPage: isLoadingMoreSingers,
    fetchNextPage: fetchNextSingersPage,
    hasNextPage: hasNextSingersPage,
    error: singersError,
  } = useSingersInfiniteQuery({
    enabled: visible && isSingerListMode,
    limit: PAGE_SIZE,
  });

  const singers = useMemo(() => {
    return singersData?.pages.flatMap((page) => page.artists) ?? [];
  }, [singersData]);

  /**
   * 第二層：指定歌手底下的歌曲
   *
   * 如果你的 hook 支援 keyword，也可以把 keyword 傳進去。
   */
  const {
    data: singerSongsData,
    isLoading: isLoadingSongs,
    isFetchingNextPage: isLoadingMoreSongs,
    fetchNextPage: fetchNextSongsPage,
    hasNextPage: hasNextSongsPage,
    error: singerSongsError,
  } = useSingerSongsInfiniteQuery({
    singerId: selectedSingerId,
    enabled: visible && selectedSingerId.length > 0,
    limit: PAGE_SIZE,
  });

  const songs = useMemo(() => {
    return singerSongsData?.pages.flatMap((page) => page.songs) ?? [];
  }, [singerSongsData]);

  /**
   * 第一層搜尋：搜尋歌手
   *
   * 注意：
   * 這是前端過濾，只會過濾目前已載入的 singers。
   * 如果你要搜尋全部歌手，應該讓後端 API 支援 keyword。
   */
  const filteredSingers = useMemo(() => {
    const keyword = searchKeyword.trim();

    if (!isSingerListMode || keyword.length === 0) {
      return singers;
    }

    return singers.filter((singer) => getSingerName(singer).includes(keyword));
  }, [isSingerListMode, searchKeyword, singers]);

  /**
   * 第二層搜尋：搜尋該歌手底下歌曲
   *
   * 注意：
   * 這也是前端過濾，只會過濾目前已載入的 songs。
   */
  const filteredSongs = useMemo(() => {
    const keyword = searchKeyword.trim();

    if (isSingerListMode || keyword.length === 0) {
      return songs;
    }

    return songs.filter((song) => {
      const displayTitle = formatDisplaySongTitle(song.title);
      const artistText = formatArtists(song.artists);

      return displayTitle.includes(keyword) || artistText.includes(keyword);
    });
  }, [isSingerListMode, searchKeyword, songs]);

  const errorMessage = useMemo(() => {
    if (singersError instanceof Error) {
      return singersError.message;
    }

    if (singerSongsError instanceof Error) {
      return singerSongsError.message;
    }

    return '';
  }, [singerSongsError, singersError]);

  const singerPageText = useMemo(() => {
    const lastPage = singersData?.pages.at(-1);

    if (!lastPage) {
      return '1/1';
    }

    return `${lastPage.page}/${lastPage.totalPages}`;
  }, [singersData]);

  const songPageText = useMemo(() => {
    const lastPage = singerSongsData?.pages.at(-1);

    if (!lastPage) {
      return '1/1';
    }

    return `${lastPage.page}/${lastPage.totalPages}`;
  }, [singerSongsData]);

  const handleLoadMoreSingers = useCallback(() => {
    if (!hasNextSingersPage || isLoadingMoreSingers) {
      return;
    }

    fetchNextSingersPage();
  }, [fetchNextSingersPage, hasNextSingersPage, isLoadingMoreSingers]);

  const handleLoadMoreSongs = useCallback(() => {
    if (!hasNextSongsPage || isLoadingMoreSongs) {
      return;
    }

    fetchNextSongsPage();
  }, [fetchNextSongsPage, hasNextSongsPage, isLoadingMoreSongs]);

  const handlePressSinger = useCallback((singer: SingerDto) => {
    setSelectedSinger(singer);
    setSearchKeyword('');

    requestAnimationFrame(() => {
      songListRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
    });
  }, []);

  const handlePressBack = useCallback(() => {
    if (selectedSinger) {
      setSelectedSinger(null);
      setSearchKeyword('');
      return;
    }

    onClose();
  }, [onClose, selectedSinger]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedSinger(null);
    setSearchKeyword('');
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <View style={styles.leftArea}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {isSingerListMode ? (
            <View style={styles.singerView}>
              <Text style={styles.title}>歌手</Text>

              {isLoadingSingers ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>載入歌手中</Text>
                </View>
              ) : (
                <FlatList
                  key="singer-grid-list"
                  style={styles.listArea}
                  data={filteredSingers}
                  keyExtractor={(item) => getSingerId(item)}
                  numColumns={4}
                  contentContainerStyle={styles.singerGridContent}
                  columnWrapperStyle={styles.singerGridRow}
                  onEndReached={handleLoadMoreSingers}
                  onEndReachedThreshold={0.35}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const singerImageSource = getSingerImageSource(item);

                    return (
                      <Pressable style={styles.singerCard} onPress={() => handlePressSinger(item)}>
                        <View style={styles.singerImageBox}>
                          {singerImageSource ? (
                            <Image
                              source={singerImageSource}
                              style={styles.singerImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.singerPlaceholder}>
                              <View style={styles.singerPlaceholderHead} />
                              <View style={styles.singerPlaceholderBody} />
                            </View>
                          )}
                        </View>

                        <Text style={styles.singerName} numberOfLines={1}>
                          {truncateText(getSingerName(item), 10)}
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

              <View style={styles.leftFooter}>
                <Text style={styles.pageText}>{singerPageText}</Text>

                <Pressable style={styles.backButton} onPress={handlePressBack}>
                  <Text style={styles.backButtonText}>返回</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.songView}>
              <Text style={styles.title}>{selectedSingerName}</Text>

              {isLoadingSongs ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>載入歌曲中</Text>
                </View>
              ) : (
                <FlatList
                  key="singer-song-list"
                  ref={songListRef}
                  style={styles.listArea}
                  data={filteredSongs}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.songListContent}
                  onEndReached={handleLoadMoreSongs}
                  onEndReachedThreshold={0.35}
                  showsVerticalScrollIndicator={false}
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
                        {truncateText(formatDisplaySongTitle(item.title), 11)}
                      </Text>

                      <Text style={styles.artistText} numberOfLines={1}>
                        {truncateText(formatArtists(item.artists), 5)}
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
                      <Text style={styles.emptyText}>此歌手目前沒有歌曲</Text>
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

              <View style={styles.leftFooter}>
                {/* <Text style={styles.pageText}>{songPageText}</Text> */}

                <Pressable style={styles.backButton} onPress={handlePressBack}>
                  <Text style={styles.backButtonText}>返回</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.rightArea}>
          <CustomKeyboard
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onClose={handlePressBack}
          />
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
    zIndex: 50,
    backgroundColor: 'transparent',
  },

  panel: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 28,
  },

  leftArea: {
    width: '54%',
    minWidth: 560,
  },

  rightArea: {
    flex: 1,
  },

  singerView: {
    flex: 1,
  },

  songView: {
    flex: 1,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 10,
    lineHeight: 48,
  },

  listArea: {
    flex: 1,
    minHeight: 0,
  },

  singerGridContent: {
    flexGrow: 1,
    // height: 400,
    paddingBottom: 30,
    // backgroundColor: 'red',
  },

  songListContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  singerGridRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  singerCard: {
    width: 150,
    height: 200,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  singerImageBox: {
    width: 150,
    height: 150,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  singerImage: {
    width: '100%',
    height: '100%',
  },

  singerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2633',
  },

  singerPlaceholderHead: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#A8A8A8',
  },

  singerPlaceholderBody: {
    width: 80,
    height: 60,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: '#A8A8A8',
    marginTop: 8,
  },

  singerName: {
    height: 48,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 48,
    paddingHorizontal: 4,
  },

  // songListContent: {
  //   paddingBottom: 8,
  // },

  songRow: {
    height: 52,
    borderRadius: 6,
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

  leftFooter: {
    height: 62,
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
