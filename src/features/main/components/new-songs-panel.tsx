import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

// import * as ExpoFileSystem from 'expo-file-system/legacy';

// import { songAssetResolverService } from '@/src/features/player/services/song-asset-resolver.service';
// import { songCacheService } from '@/src/features/player/services/song-cache.service';
// import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';

import { SongDownloadStatus } from '@/src/features/player/stores/song-download-status.store';

import { CustomKeyboard } from '@/src/features/main/components/custom-keyboard';
// import { getAccessToken } from '@/src/services/auth/auth-token-store';
// import { songClient } from '@/src/services/song/song-client';
import { useNewSongsCache } from '@/src/features/song/hook/use-new-songs-cache';
import { SongDto } from '@/src/services/song/song.types';

import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

const SONG_TITLE_BACKGROUND = require('@/assets/images/songPrefab/song-title-bg-slc.png');

type Props = {
  visible: boolean;
  onClose: () => void;
};

type LanguageTab = {
  label: string;
  value?: string;
};

// type SongActionStatus = {
//   phase: 'preparing' | 'downloading';
//   progress?: number;
// };

// type SongActionStatusMap = Record<string, SongActionStatus | undefined>;

const LANGUAGE_TABS: LanguageTab[] = [
  {
    label: '全部',
    value: undefined,
  },
  {
    label: '華語',
    value: 'zh',
  },
  {
    label: '粵語',
    value: 'yue',
  },
  {
    label: '馬來',
    value: 'ms',
  },
  {
    label: '日韓',
    value: 'ja',
  },
  {
    label: '英語',
    value: 'en',
  },
];

// const PAGE_SIZE = 20;

function formatArtists(artists: SongDto['artists']) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return '未知歌手';
  }

  const artistNames = artists
    .map((artist) => {
      if (typeof artist === 'string') {
        return artist;
      }

      if (artist && typeof artist === 'object') {
        const artistRecord = artist as Record<string, unknown>;

        if (typeof artistRecord.name === 'string') {
          return artistRecord.name;
        }

        if (typeof artistRecord.artistName === 'string') {
          return artistRecord.artistName;
        }

        if (typeof artistRecord.singerName === 'string') {
          return artistRecord.singerName;
        }
      }

      return '';
    })
    .filter(Boolean);

  if (artistNames.length === 0) {
    return '未知歌手';
  }

  return artistNames.join('、');
}

function truncateText(value: string, maxLength: number) {
  const chars = Array.from(value);

  if (chars.length <= maxLength) {
    return value;
  }

  return `${chars.slice(0, maxLength).join('')}...`;
}

// function getFileExtensionFromS3Key(key?: string) {
//   if (!key) {
//     return 'mkv';
//   }

//   const filename = key.split('/').pop() || '';
//   const extension = filename.split('.').pop();

//   if (!extension || extension.length > 8) {
//     return 'mkv';
//   }

//   return extension;
// }

// function calculateDownloadProgress(totalBytesWritten: number, totalBytesExpectedToWrite: number) {
//   if (totalBytesExpectedToWrite <= 0) {
//     return 0;
//   }

//   const progress = Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100);

//   return Math.max(0, Math.min(progress, 100));
// }

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

// function createPlaybackQueueItem({
//   song,
//   localVideoUri,
//   artistText,
// }: {
//   song: SongDto;
//   localVideoUri: string;
//   artistText?: string;
// }) {
//   return {
//     queueId: `${song._id}-${Date.now()}`,
//     songId: song._id,
//     song,
//     title: song.title,
//     artistText,
//     localVideoUri,
//     status: 'ready' as const,
//     createdAt: Date.now(),
//   };
// }

// function getTotalPages(total: number) {
//   if (total <= 0) {
//     return 1;
//   }

//   return Math.max(1, Math.ceil(total / PAGE_SIZE));
// }

export function NewSongsPanel({ visible, onClose }: Props) {
  const songListRef = useRef<FlatList<SongDto>>(null);
  // const isLoadingMoreRef = useRef(false);

  // const [songs, setSongs] = useState<SongDto[]>([]);
  // const [page, setPage] = useState(1);
  // const [total, setTotal] = useState(0);

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTab>(LANGUAGE_TABS[0]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

  const isSearchMode = debouncedSearchKeyword.length > 0;
  const isSearchLanguageFilterMode = isSearchMode && Boolean(selectedLanguage.value);

  // const enqueueNextSong = usePlaybackQueueStore((state) => state.enqueueNext);
  // const [songActionStatusMap, setSongActionStatusMap] = useState<SongActionStatusMap>({});
  // const songActionStatusMap = useSongDownloadStatusStore((state) => state.statusMap);
  // const setPreparing = useSongDownloadStatusStore((state) => state.setPreparing);
  // const setDownloading = useSongDownloadStatusStore((state) => state.setDownloading);
  // const clearDownloadStatus = useSongDownloadStatusStore((state) => state.clearStatus);

  const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();

  const queryClient = useQueryClient();

  const [favoriteActionStatusMap, setFavoriteActionStatusMap] = useState<Record<string, boolean>>(
    {},
  );

  const [favoriteStateMap, setFavoriteStateMap] = useState<Record<string, boolean>>({});

  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');

  // const [isInitialLoading, setIsInitialLoading] = useState(false);
  // const [isLoadingMore, setIsLoadingMore] = useState(false);
  // const [errorMessage, setErrorMessage] = useState('');

  // const totalPages = useMemo(() => getTotalPages(total), [total]);

  // const canLoadMore = useMemo(() => {
  //   if (total <= 0) {
  //     return false;
  //   }

  //   if (songs.length >= total) {
  //     return false;
  //   }

  //   if (page >= totalPages) {
  //     return false;
  //   }

  //   return true;
  // }, [page, songs.length, total, totalPages]);

  // const loadSongs = useCallback(
  //   async ({ targetPage, replace }: { targetPage: number; replace: boolean }) => {
  //     const token = await getAccessToken();

  //     if (!token) {
  //       throw new Error('Missing access token.');
  //     }

  //     const response = await songClient.getSongs({
  //       token,
  //       params: {
  //         page: targetPage,
  //         limit: PAGE_SIZE,

  //         /**
  //          * 新歌 API 排序邏輯：
  //          * 使用 createdAt 倒序，最新建立的歌曲排在最前面。
  //          */
  //         sortBy: 'createdAt',
  //         order: 'desc',
  //       },
  //     });

  //     setTotal(response.total);
  //     setPage(response.page);

  //     setSongs((previousSongs) => {
  //       if (replace) {
  //         return response.songs;
  //       }

  //       const existingIds = new Set(previousSongs.map((song) => song._id));
  //       const newSongs = response.songs.filter((song) => !existingIds.has(song._id));

  //       return [...previousSongs, ...newSongs];
  //     });
  //   },
  //   [],
  // );

  // const loadFirstPage = useCallback(async () => {
  //   try {
  //     setErrorMessage('');
  //     setIsInitialLoading(true);

  //     await loadSongs({
  //       targetPage: 1,
  //       replace: true,
  //     });
  //   } catch (error) {
  //     setErrorMessage(error instanceof Error ? error.message : String(error));
  //   } finally {
  //     setIsInitialLoading(false);
  //   }
  // }, [loadSongs]);

  // const loadNextPage = useCallback(async () => {
  //   if (isInitialLoading) {
  //     return;
  //   }

  //   if (!canLoadMore) {
  //     return;
  //   }

  //   if (isLoadingMoreRef.current) {
  //     return;
  //   }

  //   try {
  //     isLoadingMoreRef.current = true;

  //     setErrorMessage('');
  //     setIsLoadingMore(true);

  //     await loadSongs({
  //       targetPage: page + 1,
  //       replace: false,
  //     });
  //   } catch (error) {
  //     setErrorMessage(error instanceof Error ? error.message : String(error));
  //   } finally {
  //     isLoadingMoreRef.current = false;
  //     setIsLoadingMore(false);
  //   }
  // }, [canLoadMore, isInitialLoading, loadSongs, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchKeyword]);

  useEffect(() => {
    if (!debouncedSearchKeyword) {
      return;
    }

    setSelectedLanguage((currentTab) => {
      if (currentTab.label === LANGUAGE_TABS[0].label) {
        return currentTab;
      }

      return LANGUAGE_TABS[0];
    });
  }, [debouncedSearchKeyword]);

  const {
    songs,
    page,
    totalPages,

    isInitialLoading,
    isLoadingMore,
    errorMessage,

    loadFirstPage,
    loadNextPage,
  } = useNewSongsCache({
    languageValue: isSearchMode ? undefined : selectedLanguage.value,
    searchKeyword: debouncedSearchKeyword,
  });

  const handlePressLanguage = useCallback((tab: LanguageTab) => {
    songListRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });

    setSelectedLanguage((currentTab) => {
      if (currentTab.label === tab.label) {
        return currentTab;
      }

      return tab;
    });
  }, []);

  const handleToggleFavorite = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      if (!songId) {
        console.log('[NewSongsPanel] favorite ignored: missing songId', song);
        return;
      }

      if (favoriteActionStatusMap[songId]) {
        return;
      }

      setFavoriteActionStatusMap((previous) => ({
        ...previous,
        [songId]: true,
      }));

      try {
        setFavoriteErrorMessage('');

        const token = await getAccessToken();

        if (!token) {
          throw new Error('Missing access token.');
        }

        const currentIsCollected = favoriteStateMap[songId] ?? Boolean(song.isCollected);
        const nextIsCollected = !currentIsCollected;

        if (currentIsCollected) {
          await playlistClient.removeSongFromPlaylist({
            token,
            type: 'collect',
            songId,
          });

          console.log('[NewSongsPanel] removed favorite:', {
            songId,
            title: song.title,
          });
        } else {
          await playlistClient.addSongToPlaylist({
            token,
            type: 'collect',
            songId,
          });

          console.log('[NewSongsPanel] added favorite:', {
            songId,
            title: song.title,
          });
        }

        setFavoriteStateMap((previous) => ({
          ...previous,
          [songId]: nextIsCollected,
        }));

        queryClient.invalidateQueries({
          queryKey: ['songs'],
        });

        queryClient.invalidateQueries({
          queryKey: ['playlist'],
        });

        queryClient.invalidateQueries({
          queryKey: ['new-songs'],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.log('[NewSongsPanel] toggle favorite failed:', {
          songId,
          title: song.title,
          error: message,
        });

        setFavoriteErrorMessage(message);
      } finally {
        setFavoriteActionStatusMap((previous) => {
          const next = { ...previous };
          delete next[songId];
          return next;
        });
      }
    },
    [favoriteActionStatusMap, favoriteStateMap, queryClient],
  );

  // const handlePressInsert = useCallback(
  //   async (song: SongDto) => {
  //     const songId = song._id;

  //     try {
  //       setPreparing(songId);

  //       const cachedSong = await songCacheService.getCachedSong(songId);

  //       if (cachedSong?.videoUri) {
  //         enqueueNextSong(
  //           createPlaybackQueueItem({
  //             song,
  //             artistText: formatArtists(song.artists),
  //             localVideoUri: cachedSong.videoUri,
  //           }),
  //         );

  //         return;
  //       }

  //       const resolvedAssets = await songAssetResolverService.resolveFromS3Title({
  //         songId,
  //         title: song.title,
  //       });

  //       setDownloading(songId, 0);

  //       const songDir = await songCacheService.ensureSongDir(songId);
  //       const extension = getFileExtensionFromS3Key(resolvedAssets.s3Key);
  //       const targetUri = `${songDir}video.${extension}`;

  //       let lastProgress = -1;

  //       const downloadResumable = ExpoFileSystem.createDownloadResumable(
  //         resolvedAssets.videoUrl,
  //         targetUri,
  //         {},
  //         (downloadProgress) => {
  //           const progress = calculateDownloadProgress(
  //             downloadProgress.totalBytesWritten,
  //             downloadProgress.totalBytesExpectedToWrite,
  //           );

  //           if (progress === lastProgress) {
  //             return;
  //           }

  //           lastProgress = progress;

  //           setDownloading(songId, progress);
  //         },
  //       );

  //       const downloadResult = await downloadResumable.downloadAsync();

  //       if (!downloadResult?.uri) {
  //         throw new Error('Download failed: missing local uri.');
  //       }

  //       await songCacheService.saveCachedSong(songId, {
  //         songId,
  //         videoUri: downloadResult.uri,
  //         downloadedAt: Date.now(),
  //         totalBytes: resolvedAssets.size,
  //       });

  //       enqueueNextSong(
  //         createPlaybackQueueItem({
  //           song,
  //           artistText: formatArtists(song.artists),
  //           localVideoUri: downloadResult.uri,
  //         }),
  //       );
  //     } catch (error) {
  //       console.log('[NewSongsPanel] handlePressInsert failed:', error);
  //     } finally {
  //       clearDownloadStatus(songId);
  //     }
  //   },
  //   [clearDownloadStatus, enqueueNextSong, setDownloading, setPreparing],
  // );

  useEffect(() => {
    songListRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });
  }, [selectedLanguage.value, debouncedSearchKeyword]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    loadFirstPage();
  }, [loadFirstPage, visible]);

  if (!visible) {
    return null;
  }

  const displaySongs =
    isSearchMode && selectedLanguage.value
      ? songs.filter((song) => song.language === selectedLanguage.value)
      : songs;

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <View style={styles.leftArea}>
          <View style={styles.leftTopRow}>
            <View style={styles.titleAnchor} pointerEvents="box-none">
              <View style={styles.titleBackgroundImageWrapper} pointerEvents="none">
                <Image
                  source={SONG_TITLE_BACKGROUND}
                  style={styles.titleBackgroundImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>新歌</Text>
            </View>

            <View style={styles.languageTabs}>
              {LANGUAGE_TABS.map((tab) => {
                const isActive = selectedLanguage.label === tab.label;

                return (
                  <Pressable
                    key={tab.label}
                    style={[styles.languageTab, isActive && styles.languageTabActive]}
                    onPress={() => handlePressLanguage(tab)}
                  >
                    <Text
                      style={[styles.languageTabText, isActive && styles.languageTabTextActive]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.songListArea}>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {favoriteErrorMessage ? (
              <Text style={styles.errorText}>{favoriteErrorMessage}</Text>
            ) : null}

            {isInitialLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>載入新歌中</Text>
              </View>
            ) : (
              <FlatList
                ref={songListRef}
                // data={songs}
                data={displaySongs}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                // onEndReached={loadNextPage}
                onEndReached={isSearchLanguageFilterMode ? undefined : loadNextPage}
                onEndReachedThreshold={0.35}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.songRow,
                      pressed && styles.songRowPressed,
                      songActionStatusMap[item._id] && styles.songRowResolving,
                    ]}
                    onPress={() => {
                      console.log('[NewSongsPanel] pressed song:', {
                        songId: item._id,
                        title: item.title,
                      });

                      // handlePressInsert(item);
                      insertSongNext(item);
                    }}
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

                    <Pressable
                      style={styles.favoriteButton}
                      disabled={Boolean(favoriteActionStatusMap[item._id])}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleToggleFavorite(item);
                      }}
                    >
                      {(favoriteStateMap[item._id] ?? Boolean(item.isCollected)) ? (
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
                        // handlePressInsert(item);
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
                    <Text style={styles.emptyText}>目前沒有新歌資料</Text>
                  </View>
                }
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

          <View style={styles.leftFooter}>
            <Text style={styles.pageText}>
              {page}/{totalPages}
            </Text>

            <Pressable style={styles.backButton} onPress={onClose}>
              <Text style={styles.backButtonText}>返回</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.rightArea}>
          <CustomKeyboard
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onClose={onClose}
            placeholder="搜尋歌曲"
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
    paddingHorizontal: 26,
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

  leftTopRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },

  titleAnchor: {
    position: 'relative',
    marginRight: 28,
    justifyContent: 'center',
  },

  titleBackgroundImageWrapper: {
    position: 'absolute',
    left: -215,
    top: -229,
    width: 500,
    height: 500,
    zIndex: -1,
    elevation: -1,
  },

  titleBackgroundImage: {
    position: 'absolute',
    left: -215,
    top: -229,
    width: 500,
    height: 500,
    zIndex: 0,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    zIndex: 1,
  },

  languageTabs: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50,
    marginLeft: 20,
  },

  languageTab: {
    height: 44,
    justifyContent: 'center',
    // paddingHorizontal: 4,
  },

  languageTabActive: {},

  languageTabText: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '800',
  },

  languageTabTextActive: {
    color: '#FFFFFF',
  },

  songListArea: {
    height: 420,
  },

  listContent: {
    paddingBottom: 8,
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
    flex: 1.2,
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
    width: 90,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'visible',
  },

  insertText: {
    width: 90,
    flexShrink: 0,
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
    width: 200,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
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

  footerLoading: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  songRowResolving: {
    opacity: 0.55,
  },
});
