import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';

import {
  SongDownloadStatus,
  useSongDownloadStatusStore,
} from '@/src/features/player/stores/song-download-status.store';

import { useSongFavoriteStatusStore } from '@/src/features/main/store/song-favorite-status.store';

import { useRankingSongsCache } from '@/src/features/song/hook/use-ranking-songs-cache';

import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import { SongDto } from '@/src/services/song/song.types';

import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

import { useAppLanguageStore } from '@/src/shared/i18n/language.store';
import {
  RANKING_PANEL_COPY,
  RankingSongsPanelCopy,
} from '@/src/features/main/i18n/ranking-songs-panel-copy';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

const SONG_TITLE_BACKGROUND = require('@/assets/images/songPrefab/song-title-bg-slc.png');

import { CustomKeyboard, CustomKeyboardMode } from '@/src/features/main/components/custom-keyboard';

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

type RankingSongSearchMode = 'title' | 'initials' | 'zhuyin';

function getRankingSongSearchMode(keyboardMode: CustomKeyboardMode): RankingSongSearchMode {
  if (keyboardMode === 'zhuyin') {
    return 'zhuyin';
  }

  if (keyboardMode === 'pinyin') {
    return 'initials';
  }

  return 'title';
}

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
const RANKING_SONG_ROW_HEIGHT = 70;

function formatArtists(artists: SongDto['artists']) {
  if (!Array.isArray(artists)) {
    return '未知歌手';
  }

  const artistNames = artists
    .map((artist) => {
      if (typeof artist === 'string') {
        return artist;
      }

      if (artist && typeof artist === 'object') {
        const record = artist as Record<string, unknown>;

        if (typeof record.name === 'string') {
          return record.name;
        }

        if (typeof record.artistName === 'string') {
          return record.artistName;
        }

        if (typeof record.singerName === 'string') {
          return record.singerName;
        }
      }

      return '';
    })
    .filter(Boolean);

  return artistNames.length > 0 ? artistNames.join(' , ') : '未知歌手';
}

function truncateText(value: string, maxLength: number) {
  const chars = Array.from(value);

  if (chars.length <= maxLength) {
    return value;
  }

  return `${chars.slice(0, maxLength).join('')}...`;
}

function getInsertButtonText(status: SongDownloadStatus | undefined, copy: RankingSongsPanelCopy) {
  if (!status) {
    return copy.insert;
  }

  if (status.phase === 'queued') {
    return '等待中';
  }

  if (status.phase === 'preparing') {
    return copy.preparing;
  }

  if (status.phase === 'downloading') {
    return copy.downloading(status.progress ?? 0);
  }

  return copy.insert;
}

type RankingSongRowProps = {
  song: SongDto;
  copy: RankingSongsPanelCopy;
  onToggleFavorite: (song: SongDto) => void;
  onAddSongToQueue: (song: SongDto) => void;
};

const RankingSongRow = memo(function RankingSongRow({
  song,
  copy,
  onToggleFavorite,
  onAddSongToQueue,
}: RankingSongRowProps) {
  const songActionStatus = useSongDownloadStatusStore((state) => state.statusMap[song._id]);

  const isFavoriteActionLoading = useSongFavoriteStatusStore((state) =>
    Boolean(state.actionStatusMap[song._id]),
  );

  const favoriteState = useSongFavoriteStatusStore((state) => state.favoriteStateMap[song._id]);

  const isSongActionLoading = Boolean(songActionStatus);
  const isFavorite = favoriteState ?? Boolean(song.isCollected);

  const displayTitle = useMemo(() => {
    return truncateText(formatDisplaySongTitle(song.title), 11);
  }, [song.title]);

  const displayArtistText = useMemo(() => {
    return truncateText(formatArtists(song.artists), 8);
  }, [song.artists]);

  const insertButtonText = useMemo(() => {
    return getInsertButtonText(songActionStatus, copy);
  }, [songActionStatus, copy]);

  const handlePressRow = useCallback(() => {
    if (isSongActionLoading) {
      return;
    }

    onAddSongToQueue(song);
  }, [isSongActionLoading, onAddSongToQueue, song]);

  const handlePressFavorite = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (isFavoriteActionLoading) {
        return;
      }

      onToggleFavorite(song);
    },
    [isFavoriteActionLoading, onToggleFavorite, song],
  );

  const handlePressInsert = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (isSongActionLoading) {
        return;
      }

      onAddSongToQueue(song);
    },
    [isSongActionLoading, onAddSongToQueue, song],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.songRow,
        pressed && styles.songRowPressed,
        isSongActionLoading && styles.songRowResolving,
      ]}
      onPress={handlePressRow}
    >
      <View style={styles.songIconBox}>
        <SongReadyIcon width={32} height={32} />
      </View>

      <Text style={styles.songTitle} numberOfLines={1}>
        {displayTitle}
      </Text>

      <Text style={styles.artistText} numberOfLines={1}>
        {displayArtistText}
      </Text>

      <Pressable
        style={styles.favoriteButton}
        disabled={isFavoriteActionLoading}
        onPress={handlePressFavorite}
      >
        {isFavorite ? (
          <SongLikedIcon width={42} height={42} />
        ) : (
          <SongLikeIcon width={42} height={42} />
        )}
      </Pressable>

      <Pressable
        style={styles.insertButton}
        disabled={isSongActionLoading}
        onPress={handlePressInsert}
      >
        <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
          {insertButtonText}
        </Text>
      </Pressable>
    </Pressable>
  );
});

export function RankingSongsPanel({ visible, onClose }: Props) {
  const songListRef = useRef<FlatList<SongDto>>(null);

  const lastLoadKeyRef = useRef('');
  const canLoadMoreRef = useRef(false);

  const language = useAppLanguageStore((state) => state.language);
  const setLanguage = useAppLanguageStore((state) => state.setLanguage);
  const copy = RANKING_PANEL_COPY[language];

  const [keyboardMode, setKeyboardMode] = useState<CustomKeyboardMode>('pinyin');
  const songSearchMode = getRankingSongSearchMode(keyboardMode);

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTab>(LANGUAGE_TABS[0]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

  const isSearchMode = debouncedSearchKeyword.length > 0;

  const isSearchLanguageFilterMode = isSearchMode && Boolean(selectedLanguage.value);

  // const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();
  const { enqueueSongAfterDownload } = useInsertSongPlayback();

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
    canLoadMore,
    errorMessage,
    setErrorMessage,

    loadFirstPage,
    loadNextPage,
  } = useRankingSongsCache({
    /**
     * 搜尋模式：
     * 不把語系帶進 API。
     * API 只負責取得全部搜尋結果。
     *
     * 非搜尋模式：
     * 才依照 selectedLanguage.value 打語系 API。
     */
    languageValue: isSearchMode ? undefined : selectedLanguage.value,
    searchKeyword: debouncedSearchKeyword,
    searchMode: songSearchMode,
  });

  const queryClient = useQueryClient();

  // const [favoriteActionStatusMap, setFavoriteActionStatusMap] = useState<Record<string, boolean>>(
  //   {},
  // );

  // const [favoriteStateMap, setFavoriteStateMap] = useState<Record<string, boolean>>({});

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

  // const handleToggleFavorite = useCallback(
  //   async (song: SongDto) => {
  //     const songId = song._id;

  //     if (!songId) {
  //       console.log('[RankingSongsPanel] favorite ignored: missing songId', song);
  //       return;
  //     }

  //     if (favoriteActionStatusMap[songId]) {
  //       return;
  //     }

  //     setFavoriteActionStatusMap((previous) => ({
  //       ...previous,
  //       [songId]: true,
  //     }));

  //     try {
  //       setErrorMessage('');

  //       const token = await getAccessToken();

  //       if (!token) {
  //         throw new Error('Missing access token.');
  //       }

  //       // if (song.isCollected) {
  //       //   await playlistClient.removeSongFromPlaylist({
  //       //     token,
  //       //     type: 'collect',
  //       //     songId,
  //       //   });

  //       //   console.log('[RankingSongsPanel] removed favorite:', {
  //       //     songId,
  //       //     title: song.title,
  //       //   });
  //       // } else {
  //       //   await playlistClient.addSongToPlaylist({
  //       //     token,
  //       //     type: 'collect',
  //       //     songId,
  //       //   });

  //       //   console.log('[RankingSongsPanel] added favorite:', {
  //       //     songId,
  //       //     title: song.title,
  //       //   });
  //       // }
  //       const currentIsCollected = favoriteStateMap[songId] ?? Boolean(song.isCollected);
  //       const nextIsCollected = !currentIsCollected;

  //       if (currentIsCollected) {
  //         await playlistClient.removeSongFromPlaylist({
  //           token,
  //           type: 'collect',
  //           songId,
  //         });

  //         console.log('[RankingSongsPanel] removed favorite:', {
  //           songId,
  //           title: song.title,
  //         });
  //       } else {
  //         await playlistClient.addSongToPlaylist({
  //           token,
  //           type: 'collect',
  //           songId,
  //         });

  //         console.log('[RankingSongsPanel] added favorite:', {
  //           songId,
  //           title: song.title,
  //         });
  //       }

  //       setFavoriteStateMap((previous) => ({
  //         ...previous,
  //         [songId]: nextIsCollected,
  //       }));

  //       /**
  //        * 讓排行榜歌曲列表重新取得 isCollected 狀態。
  //        *
  //        * 如果 useRankingSongsCache 有自己的 refetch / mutate 方法，
  //        * 之後可以改成精準更新；目前先用 invalidateQueries 讓資料重新同步。
  //        */
  //       queryClient.invalidateQueries({
  //         queryKey: ['ranking-songs'],
  //       });

  //       queryClient.invalidateQueries({
  //         queryKey: ['songs'],
  //       });

  //       queryClient.invalidateQueries({
  //         queryKey: ['playlist'],
  //       });
  //     } catch (error) {
  //       const message = error instanceof Error ? error.message : String(error);

  //       console.log('[RankingSongsPanel] toggle favorite failed:', {
  //         songId,
  //         title: song.title,
  //         error: message,
  //       });

  //       setErrorMessage(message);
  //     } finally {
  //       setFavoriteActionStatusMap((previous) => {
  //         const next = { ...previous };
  //         delete next[songId];
  //         return next;
  //       });
  //     }
  //   },
  //   [favoriteActionStatusMap, favoriteStateMap, queryClient, setErrorMessage],
  // );

  const handleToggleFavorite = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      if (!songId) {
        console.log('[RankingSongsPanel] favorite ignored: missing songId', song);
        return;
      }

      const favoriteStore = useSongFavoriteStatusStore.getState();

      if (favoriteStore.actionStatusMap[songId]) {
        return;
      }

      favoriteStore.setFavoriteActionLoading(songId, true);

      let favoriteAction: 'add' | 'remove' | null = null;

      try {
        setErrorMessage('');

        const token = await getAccessToken();

        if (!token) {
          throw new Error('Missing access token.');
        }

        const currentFavoriteState = useSongFavoriteStatusStore.getState().favoriteStateMap[songId];
        const currentIsCollected = currentFavoriteState ?? Boolean(song.isCollected);
        const nextIsCollected = !currentIsCollected;

        console.log('[RankingSongsPanel] favorite decision:', {
          songId,
          title: song.title,
          storeFavoriteState: currentFavoriteState,
          songIsCollected: song.isCollected,
          currentIsCollected,
          nextIsCollected,
        });

        if (currentIsCollected) {
          favoriteAction = 'remove';

          const response = await playlistClient.removeSongFromPlaylist({
            token,
            type: 'collect',
            songId,
          });

          console.log('[RankingSongsPanel] removed favorite:', {
            songId,
            title: song.title,
            response,
          });
        } else {
          favoriteAction = 'add';

          const response = await playlistClient.addSongToPlaylist({
            token,
            type: 'collect',
            songId,
          });

          console.log('[RankingSongsPanel] added favorite:', {
            songId,
            title: song.title,
            response,
          });
        }

        useSongFavoriteStatusStore.getState().setFavoriteState(songId, nextIsCollected);

        queryClient.invalidateQueries({
          queryKey: ['playlist'],
        });
      } catch (error) {
        const message =
          error instanceof Error && error.message === 'API request timeout.'
            ? '新歌資料載入逾時，請確認網路或稍後再試。'
            : error instanceof Error
              ? error.message
              : String(error);

        console.log('[RankingSongsPanel] toggle favorite failed:', {
          songId,
          title: song.title,
          error: message,
          favoriteAction,
        });

        if (
          favoriteAction === 'remove' &&
          (message === 'server error' ||
            message.includes('不在此歌单中') ||
            message.includes('不在此歌單中'))
        ) {
          useSongFavoriteStatusStore.getState().setFavoriteState(songId, false);

          queryClient.invalidateQueries({
            queryKey: ['playlist'],
          });

          return;
        }

        setErrorMessage(message);
      } finally {
        useSongFavoriteStatusStore.getState().clearFavoriteActionStatus(songId);
      }
    },
    [queryClient, setErrorMessage],
  );

  /*
    點擊歌曲
    ↓
    有 cache：直接加入播放隊列
    ↓
    沒 cache：下載完成後加入播放隊
  */
  // const handlePressInsert = useCallback(
  //   async (song: SongDto) => {
  //     const songId = song._id;

  //     try {
  //       setErrorMessage('');

  //       setSongActionStatusMap((previous) => ({
  //         ...previous,
  //         [songId]: {
  //           phase: 'preparing',
  //         },
  //       }));

  //       console.log('[RankingSongsPanel] insert preparing:', {
  //         songId,
  //         title: song.title,
  //       });

  //       const cachedSong = await songCacheService.getCachedSong(songId);

  //       if (cachedSong?.videoUri) {
  //         console.log('[RankingSongsPanel] insert song already cached:', {
  //           songId,
  //           cachedSong,
  //         });

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

  //       console.log('[RankingSongsPanel] insert resolved S3 signed url:', {
  //         songId,
  //         title: song.title,
  //         s3Key: resolvedAssets.s3Key,
  //         videoUrl: resolvedAssets.videoUrl,
  //       });

  //       setResolvedSongAsset(resolvedAssets);

  //       setSongActionStatusMap((previous) => ({
  //         ...previous,
  //         [songId]: {
  //           phase: 'downloading',
  //           progress: 0,
  //         },
  //       }));

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

  //           setSongActionStatusMap((previous) => ({
  //             ...previous,
  //             [songId]: {
  //               phase: 'downloading',
  //               progress,
  //             },
  //           }));
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

  //       console.log('[RankingSongsPanel] insert download completed:', {
  //         songId,
  //         localUri: downloadResult.uri,
  //       });

  //       enqueueNextSong(
  //         createPlaybackQueueItem({
  //           song,
  //           artistText: formatArtists(song.artists),
  //           localVideoUri: downloadResult.uri,
  //         }),
  //       );
  //     } catch (error) {
  //       console.log('[RankingSongsPanel] handlePressInsert failed:', error);
  //       setErrorMessage(error instanceof Error ? error.message : String(error));
  //     } finally {
  //       setSongActionStatusMap((previous) => ({
  //         ...previous,
  //         [songId]: undefined,
  //       }));
  //     }
  //   },
  //   [enqueueNextSong],
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

    const loadKey = JSON.stringify({
      languageValue: isSearchMode ? undefined : selectedLanguage.value,
      searchKeyword: debouncedSearchKeyword,
      searchMode: songSearchMode,
    });

    if (lastLoadKeyRef.current === loadKey) {
      useDebugLogStore.getState().addLog('RankingSongsPanel', 'skip duplicate first page load', {
        loadKey,
      });
      return;
    }

    lastLoadKeyRef.current = loadKey;

    useDebugLogStore.getState().addLog('RankingSongsPanel', 'visible: load first page start', {
      languageValue: isSearchMode ? undefined : selectedLanguage.value,
      searchKeyword: debouncedSearchKeyword,
      searchMode: songSearchMode,
    });

    loadFirstPage();
  }, [
    debouncedSearchKeyword,
    isSearchMode,
    loadFirstPage,
    selectedLanguage.value,
    songSearchMode,
    visible,
  ]);

  useEffect(() => {
    if (!isSearchMode) {
      return;
    }

    setSelectedLanguage(LANGUAGE_TABS[0]);
  }, [isSearchMode]);

  const displaySongs = useMemo(() => {
    if (isSearchMode && selectedLanguage.value) {
      return songs.filter((song) => song.language === selectedLanguage.value);
    }

    return songs;
  }, [isSearchMode, selectedLanguage.value, songs]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    useDebugLogStore.getState().addLog('RankingSongsPanel', 'state changed', {
      songsCount: songs.length,
      displaySongsCount: displaySongs.length,
      page,
      totalPages,
      isInitialLoading,
      isLoadingMore,
      errorMessage,
    });
  }, [
    displaySongs.length,
    errorMessage,
    isInitialLoading,
    isLoadingMore,
    page,
    songs.length,
    totalPages,
    visible,
  ]);

  const keyExtractor = useCallback((item: SongDto) => {
    return item._id;
  }, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<SongDto> | null | undefined, index: number) => {
      return {
        length: RANKING_SONG_ROW_HEIGHT,
        offset: RANKING_SONG_ROW_HEIGHT * index,
        index,
      };
    },
    [],
  );

  const renderRankingSongItem = useCallback(
    ({ item }: { item: SongDto }) => {
      return (
        <RankingSongRow
          song={item}
          copy={copy}
          onToggleFavorite={handleToggleFavorite}
          onAddSongToQueue={enqueueSongAfterDownload}
        />
      );
    },
    [copy, handleToggleFavorite, enqueueSongAfterDownload],
  );

  const handleEndReached = useCallback(() => {
    if (!canLoadMoreRef.current) {
      useDebugLogStore
        .getState()
        .addLog('RankingSongsPanel', 'skip load more: momentum not started', {
          page,
          totalPages,
        });
      return;
    }

    if (isInitialLoading || isLoadingMore || page >= totalPages) {
      useDebugLogStore.getState().addLog('RankingSongsPanel', 'skip load more: blocked', {
        page,
        totalPages,
        isInitialLoading,
        isLoadingMore,
      });
      return;
    }

    canLoadMoreRef.current = false;

    useDebugLogStore.getState().addLog('RankingSongsPanel', 'load next page', {
      nextPage: page + 1,
      currentPage: page,
      totalPages,
    });

    loadNextPage();
  }, [isInitialLoading, isLoadingMore, loadNextPage, page, totalPages]);

  if (!visible) {
    return null;
  }

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

              <Text style={styles.title} numberOfLines={1} ellipsizeMode="clip">
                {copy.title}
              </Text>
            </View>

            <View style={styles.languageTabs}>
              {LANGUAGE_TABS.map((tab) => {
                const isActive = selectedLanguage.label === tab.label;

                return (
                  <Pressable
                    key={tab.label}
                    style={[styles.languageTab, isActive && styles.languageTabActive]}
                    onPress={() => {
                      console.log('[RankingSongsPanel] press language tab:', {
                        label: tab.label,
                        value: tab.value,
                      });
                      handlePressLanguage(tab);
                    }}
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

            {isInitialLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>{copy.loading}</Text>
              </View>
            ) : (
              // <FlatList
              //   ref={songListRef}
              //   // data={songs}
              //   data={displaySongs}
              //   keyExtractor={(item) => item._id}
              //   contentContainerStyle={styles.listContent}
              //   // onEndReached={loadNextPage}
              //   onEndReached={isSearchLanguageFilterMode ? undefined : loadNextPage}
              //   onEndReachedThreshold={0.35}
              //   initialNumToRender={8}
              //   maxToRenderPerBatch={8}
              //   windowSize={5}
              //   removeClippedSubviews
              //   keyboardShouldPersistTaps="handled"
              //   renderItem={({ item }) => (
              //     // <View style={styles.songRow}>
              //     //   <View style={styles.songIconBox}>
              //     //     <SongReadyIcon width={32} height={32} />
              //     //   </View>
              //     //   <Text style={styles.songTitle} numberOfLines={1}>
              //     //     {truncateText(item.title, 11)}
              //     //   </Text>

              //     //   <Text style={styles.artistText} numberOfLines={1}>
              //     //     {truncateText(formatArtists(item.artists), 5)}
              //     //   </Text>

              //     //   <Pressable style={styles.favoriteButton}>
              //     //     {item.isCollected ? (
              //     //       <SongLikedIcon width={42} height={42} />
              //     //     ) : (
              //     //       <SongLikeIcon width={42} height={42} />
              //     //     )}
              //     //   </Pressable>

              //     //   <Pressable style={styles.insertButton}>
              //     //     <Text style={styles.insertText}>插播</Text>
              //     //   </Pressable>
              //     // </View>

              //     // <Pressable
              //     //   style={({ pressed }) => [
              //     //     styles.songRow,
              //     //     pressed && styles.songRowPressed,
              //     //     songActionStatusMap[item._id] && styles.songRowResolving,
              //     //   ]}
              //     //   onPress={() => {
              //     //     // handlePressInsert(item);
              //     //     insertSongNext(item);
              //     //   }}
              //     // >
              //     //   <View style={styles.songIconBox}>
              //     //     <SongReadyIcon width={32} height={32} />
              //     //   </View>

              //     //   <Text style={styles.songTitle} numberOfLines={1}>
              //     //     {truncateText(formatDisplaySongTitle(item.title), 11)}
              //     //   </Text>

              //     //   <Text style={styles.artistText} numberOfLines={1}>
              //     //     {truncateText(formatArtists(item.artists), 8)}
              //     //   </Text>

              //     //   <Pressable
              //     //     style={styles.favoriteButton}
              //     //     disabled={Boolean(favoriteActionStatusMap[item._id])}
              //     //     onPress={(event) => {
              //     //       event.stopPropagation();
              //     //       handleToggleFavorite(item);
              //     //     }}
              //     //   >
              //     //     {(favoriteStateMap[item._id] ?? Boolean(item.isCollected)) ? (
              //     //       <SongLikedIcon width={42} height={42} />
              //     //     ) : (
              //     //       <SongLikeIcon width={42} height={42} />
              //     //     )}
              //     //   </Pressable>

              //     //   <Pressable
              //     //     style={styles.insertButton}
              //     //     disabled={Boolean(songActionStatusMap[item._id])}
              //     //     onPress={(event) => {
              //     //       event.stopPropagation();
              //     //       // handlePressInsert(item);
              //     //       insertSongNext(item);
              //     //     }}
              //     //   >
              //     //     <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
              //     //       {getInsertButtonText(songActionStatusMap[item._id], copy)}
              //     //     </Text>
              //     //   </Pressable>
              //     // </Pressable>

              //     <RankingSongRow
              //       song={item}
              //       copy={copy}
              //       onToggleFavorite={handleToggleFavorite}
              //       onInsertSongNext={insertSongNext}
              //     />
              //   )}
              //   ListEmptyComponent={
              //     <View style={styles.centerContent}>
              //       <Text style={styles.emptyText}>目前沒有歌曲資料</Text>
              //     </View>
              //   }
              //   ListFooterComponent={
              //     !isSearchLanguageFilterMode && isLoadingMore && canLoadMore ? (
              //       <View style={styles.footerLoading}>
              //         <ActivityIndicator />
              //         <Text style={styles.loadingText}>載入更多</Text>
              //       </View>
              //     ) : null
              //   }
              // />

              <FlatList
                ref={songListRef}
                data={displaySongs}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                contentContainerStyle={styles.listContent}
                onMomentumScrollBegin={() => {
                  canLoadMoreRef.current = true;
                }}
                onEndReached={isSearchLanguageFilterMode ? undefined : handleEndReached}
                onEndReachedThreshold={0.2}
                initialNumToRender={8}
                maxToRenderPerBatch={6}
                updateCellsBatchingPeriod={50}
                windowSize={5}
                removeClippedSubviews
                keyboardShouldPersistTaps="handled"
                renderItem={renderRankingSongItem}
                ListEmptyComponent={
                  <View style={styles.centerContent}>
                    <Text style={styles.emptyText}>目前沒有歌曲資料</Text>
                  </View>
                }
                ListFooterComponent={
                  !isSearchLanguageFilterMode && isLoadingMore && canLoadMore ? (
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
              <Text style={styles.backButtonText}>{copy.back}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.rightArea}>
          <CustomKeyboard
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onClose={onClose}
            onModeChange={setKeyboardMode}
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
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: 26,
    // paddingTop: 26,
    paddingBottom: 18,
    gap: 28,
  },

  leftArea: {
    width: '54%',
    minWidth: 560,
  },

  rightArea: {
    flex: 1,
    // paddingTop: 54,
  },

  leftTopRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 30,
    elevation: 30,
    overflow: 'visible',
  },

  titleAnchor: {
    position: 'relative',
    marginRight: 28,
    justifyContent: 'center',
    zIndex: 1,
    elevation: 1,
    flexShrink: 0,
    overflow: 'visible',
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
    width: '100%',
    height: '100%',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    zIndex: 2,
    elevation: 2,
    width: 80,
    flexWrap: 'nowrap',
  },

  languageTabs: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    marginLeft: 20,
    elevation: 50,
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

  songIconBox: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 5,
  },

  songIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  songTitle: {
    // flex: 1.15,
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

  favoriteText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
  },

  insertButton: {
    width: 90,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'visible',
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
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

  songRowPressed: {
    opacity: 0.82,
  },

  songRowResolving: {
    opacity: 0.55,
  },
});
