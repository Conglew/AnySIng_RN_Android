import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

import { CustomKeyboard, CustomKeyboardMode } from '@/src/features/main/components/custom-keyboard';

import { useSearchSingersQuery } from '@/src/features/singer/hook/singer-use-search-singers-query';

import { useQuery } from '@tanstack/react-query';

import { songClient } from '@/src/services/song/song-client';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';

import {
  SongDownloadStatus,
  useSongDownloadStatusStore,
} from '@/src/features/player/stores/song-download-status.store';

import { useSongFavoriteStatusStore } from '@/src/features/main/store/song-favorite-status.store';

import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import { SongDto } from '@/src/services/song/song.types';

import { useSingerSongsInfiniteQuery } from '@/src/features/singer/hook/singer-use-singer-songs-infinite-query';
import { useSingersInfiniteQuery } from '@/src/features/singer/hook/singer-use-singers-infinite-query';
import { SingerDto } from '@/src/services/singer/singer.types';

import { useAppLanguageStore } from '@/src/shared/i18n/language.store';
import { SINGER_PANEL_COPY, SingerPanelCopy } from '@/src/features/main/i18n/singer-panel-copy';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 20;
const SINGER_SONG_ROW_HEIGHT = 62;

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

function getInsertButtonText(status: SongDownloadStatus | undefined, copy: SingerPanelCopy) {
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

function formatSongArtistText(song: SongDto, fallbackArtistName: string) {
  const record = song as unknown as Record<string, unknown>;
  const artists = record.artists;

  if (Array.isArray(artists)) {
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

    if (artistNames.length > 0) {
      return artistNames.join('、');
    }
  }

  if (typeof record.artistName === 'string') {
    return record.artistName;
  }

  if (typeof record.singerName === 'string') {
    return record.singerName;
  }

  return fallbackArtistName || '未知歌手';
}

type SingerSongRowProps = {
  song: SongDto;
  copy: SingerPanelCopy;
  selectedSingerName: string;
  onToggleFavorite: (song: SongDto) => void;
  onAddSongToQueue: (song: SongDto) => void;
};

const SingerSongRow = memo(function SingerSongRow({
  song,
  copy,
  selectedSingerName,
  onToggleFavorite,
  onAddSongToQueue,
}: SingerSongRowProps) {
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
    return truncateText(formatSongArtistText(song, selectedSingerName), 5);
  }, [selectedSingerName, song]);

  const insertButtonText = useMemo(() => {
    return getInsertButtonText(songActionStatus, copy);
  }, [copy, songActionStatus]);

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

type ArtistSearchMode = 'name' | 'initials' | 'zhuyin';
type SongSearchMode = 'title' | 'initials' | 'zhuyin';

function getArtistSearchMode(keyboardMode: CustomKeyboardMode): ArtistSearchMode {
  if (keyboardMode === 'zhuyin') {
    return 'zhuyin';
  }

  if (keyboardMode === 'pinyin') {
    return 'initials';
  }

  return 'name';
}

function getSongSearchMode(keyboardMode: CustomKeyboardMode): SongSearchMode {
  if (keyboardMode === 'zhuyin') {
    return 'zhuyin';
  }

  if (keyboardMode === 'pinyin') {
    return 'initials';
  }

  return 'title';
}

export function SingerPanel({ visible, onClose }: Props) {
  const songListRef = useRef<FlatList<SongDto>>(null);

  const language = useAppLanguageStore((state) => state.language);
  const copy = SINGER_PANEL_COPY[language];

  const [selectedSinger, setSelectedSinger] = useState<SingerDto | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

  const [keyboardMode, setKeyboardMode] = useState<CustomKeyboardMode>('zhuyin');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchKeyword]);

  // const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();
  const { enqueueSongAfterDownload } = useInsertSongPlayback();

  const isSingerListMode = selectedSinger === null;

  const isSearchMode = debouncedSearchKeyword.length > 0;

  const artistSearchMode = useMemo(() => {
    return getArtistSearchMode(keyboardMode);
  }, [keyboardMode]);

  const songSearchMode = useMemo(() => {
    return getSongSearchMode(keyboardMode);
  }, [keyboardMode]);

  const selectedSingerId = selectedSinger ? getSingerId(selectedSinger) : '';
  const selectedSingerName = selectedSinger ? getSingerName(selectedSinger) : '';

  const queryClient = useQueryClient();

  // const [favoriteActionStatusMap, setFavoriteActionStatusMap] = useState<Record<string, boolean>>(
  //   {},
  // );

  // const [favoriteStateMap, setFavoriteStateMap] = useState<Record<string, boolean>>({});

  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');

  /**
   * 第一層：歌手列表
   *
   * 如果你的 hook 支援 keyword，可以把 keyword 傳進去。
   * 如果不支援，保留目前寫法，下面會用前端 filter 做已載入資料搜尋。
   */
  // const {
  //   data: singersData,
  //   isLoading: isLoadingSingers,
  //   isFetchingNextPage: isLoadingMoreSingers,
  //   fetchNextPage: fetchNextSingersPage,
  //   hasNextPage: hasNextSingersPage,
  //   error: singersError,
  // } = useSingersInfiniteQuery({
  //   enabled: visible && isSingerListMode,
  //   limit: PAGE_SIZE,
  // });

  const {
    data: singersData,
    isLoading: isLoadingSingers,
    isFetchingNextPage: isLoadingMoreSingers,
    fetchNextPage: fetchNextSingersPage,
    hasNextPage: hasNextSingersPage,
    error: singersError,
  } = useSingersInfiniteQuery({
    enabled: visible && isSingerListMode && !isSearchMode,
    limit: PAGE_SIZE,
  });

  const {
    data: searchSingersData,
    isLoading: isSearchingSingers,
    error: searchSingersError,
  } = useSearchSingersQuery(
    {
      q: debouncedSearchKeyword,
      page: 1,
      limit: PAGE_SIZE,
      mode: artistSearchMode,
    },
    visible && isSingerListMode && isSearchMode,
  );

  // const singers = useMemo(() => {
  //   return singersData?.pages.flatMap((page) => page.artists) ?? [];
  // }, [singersData]);

  const singers = useMemo(() => {
    if (isSingerListMode && isSearchMode) {
      return searchSingersData?.artists ?? [];
    }

    return singersData?.pages.flatMap((page) => page.artists) ?? [];
  }, [isSearchMode, isSingerListMode, searchSingersData, singersData]);

  /**
   * 第二層：指定歌手底下的歌曲
   *
   * 如果你的 hook 支援 keyword，也可以把 keyword 傳進去。
   */
  // const {
  //   data: singerSongsData,
  //   isLoading: isLoadingSongs,
  //   isFetchingNextPage: isLoadingMoreSongs,
  //   fetchNextPage: fetchNextSongsPage,
  //   hasNextPage: hasNextSongsPage,
  //   error: singerSongsError,
  // } = useSingerSongsInfiniteQuery({
  //   singerId: selectedSingerId,
  //   enabled: visible && selectedSingerId.length > 0,
  //   limit: PAGE_SIZE,
  // });

  const {
    data: singerSongsData,
    isLoading: isLoadingSongs,
    isFetchingNextPage: isLoadingMoreSongs,
    fetchNextPage: fetchNextSongsPage,
    hasNextPage: hasNextSongsPage,
    error: singerSongsError,
  } = useSingerSongsInfiniteQuery({
    singerId: selectedSingerId,
    enabled: visible && selectedSingerId.length > 0 && !isSearchMode,
    limit: PAGE_SIZE,
  });

  const {
    data: searchSingerSongsData,
    isLoading: isSearchingSingerSongs,
    error: searchSingerSongsError,
  } = useQuery({
    queryKey: [
      'songs',
      'search-by-singer',
      selectedSingerId,
      debouncedSearchKeyword,
      songSearchMode,
    ],
    enabled: visible && !isSingerListMode && selectedSingerId.length > 0 && isSearchMode,
    queryFn: async () => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      return songClient.searchSongs({
        token,
        params: {
          q: debouncedSearchKeyword,
          page: 1,
          limit: PAGE_SIZE,
          artistId: selectedSingerId,
          mode: songSearchMode,
        },
      });
    },
  });

  // const songs = useMemo(() => {
  //   return singerSongsData?.pages.flatMap((page) => page.songs) ?? [];
  // }, [singerSongsData]);

  const songs = useMemo(() => {
    if (!isSingerListMode && isSearchMode) {
      return searchSingerSongsData?.songs ?? [];
    }

    return singerSongsData?.pages.flatMap((page) => page.songs) ?? [];
  }, [isSearchMode, isSingerListMode, searchSingerSongsData, singerSongsData]);

  /**
   * 第一層搜尋：搜尋歌手
   *
   * 注意：
   * 這是前端過濾，只會過濾目前已載入的 singers。
   * 如果你要搜尋全部歌手，應該讓後端 API 支援 keyword。
   */
  // const filteredSingers = useMemo(() => {
  //   const keyword = debouncedSearchKeyword;

  //   if (!isSingerListMode || keyword.length === 0) {
  //     return singers;
  //   }

  //   return singers.filter((singer) => {
  //     const singerName = getSingerName(singer);
  //     return singerName.toLowerCase().includes(keyword.toLowerCase());
  //   });
  // }, [debouncedSearchKeyword, isSingerListMode, singers]);
  const filteredSingers = singers;

  /**
   * 第二層搜尋：搜尋該歌手底下歌曲
   *
   * 注意：
   * 這也是前端過濾，只會過濾目前已載入的 songs。
   */
  // const filteredSongs = useMemo(() => {
  //   const keyword = debouncedSearchKeyword;

  //   if (isSingerListMode || keyword.length === 0) {
  //     return songs;
  //   }

  //   return songs.filter((song) => {
  //     const displayTitle = formatDisplaySongTitle(song.title);
  //     const artistText = formatArtists(song.artists);
  //     const normalizedKeyword = keyword.toLowerCase();

  //     return (
  //       displayTitle.toLowerCase().includes(normalizedKeyword) ||
  //       artistText.toLowerCase().includes(normalizedKeyword)
  //     );
  //   });
  // }, [debouncedSearchKeyword, isSingerListMode, songs]);

  const filteredSongs = songs;

  const errorMessage = useMemo(() => {
    if (singersError instanceof Error) {
      return singersError.message;
    }

    if (searchSingersError instanceof Error) {
      return searchSingersError.message;
    }

    if (singerSongsError instanceof Error) {
      return singerSongsError.message;
    }

    if (searchSingerSongsError instanceof Error) {
      return searchSingerSongsError.message;
    }

    return '';
  }, [searchSingerSongsError, searchSingersError, singerSongsError, singersError]);

  const isCurrentSingerLoading = isSingerListMode
    ? isSearchMode
      ? isSearchingSingers
      : isLoadingSingers
    : false;

  const isCurrentSongLoading = !isSingerListMode
    ? isSearchMode
      ? isSearchingSingerSongs
      : isLoadingSongs
    : false;

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

    setDebouncedSearchKeyword('');

    setKeyboardMode('zhuyin');

    requestAnimationFrame(() => {
      songListRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
    });
  }, []);

  // const handleToggleFavorite = useCallback(
  //   async (song: SongDto) => {
  //     const songId = song._id;

  //     if (!songId) {
  //       console.log('[NewSongsPanel] favorite ignored: missing songId', song);
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
  //       setFavoriteErrorMessage('');

  //       const token = await getAccessToken();

  //       if (!token) {
  //         throw new Error('Missing access token.');
  //       }

  //       const currentIsCollected = favoriteStateMap[songId] ?? Boolean(song.isCollected);
  //       const nextIsCollected = !currentIsCollected;

  //       if (currentIsCollected) {
  //         await playlistClient.removeSongFromPlaylist({
  //           token,
  //           type: 'collect',
  //           songId,
  //         });

  //         console.log('[NewSongsPanel] removed favorite:', {
  //           songId,
  //           title: song.title,
  //         });
  //       } else {
  //         await playlistClient.addSongToPlaylist({
  //           token,
  //           type: 'collect',
  //           songId,
  //         });

  //         console.log('[NewSongsPanel] added favorite:', {
  //           songId,
  //           title: song.title,
  //         });
  //       }

  //       setFavoriteStateMap((previous) => ({
  //         ...previous,
  //         [songId]: nextIsCollected,
  //       }));

  //       queryClient.invalidateQueries({
  //         queryKey: ['songs'],
  //       });

  //       queryClient.invalidateQueries({
  //         queryKey: ['playlist'],
  //       });

  //       queryClient.invalidateQueries({
  //         queryKey: ['new-songs'],
  //       });
  //     } catch (error) {
  //       const message = error instanceof Error ? error.message : String(error);

  //       console.log('[NewSongsPanel] toggle favorite failed:', {
  //         songId,
  //         title: song.title,
  //         error: message,
  //       });

  //       setFavoriteErrorMessage(message);
  //     } finally {
  //       setFavoriteActionStatusMap((previous) => {
  //         const next = { ...previous };
  //         delete next[songId];
  //         return next;
  //       });
  //     }
  //   },
  //   [favoriteActionStatusMap, favoriteStateMap, queryClient],
  // );

  const handleToggleFavorite = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      if (!songId) {
        console.log('[SingerPanel] favorite ignored: missing songId', song);
        return;
      }

      const favoriteStore = useSongFavoriteStatusStore.getState();

      if (favoriteStore.actionStatusMap[songId]) {
        return;
      }

      favoriteStore.setFavoriteActionLoading(songId, true);

      let favoriteAction: 'add' | 'remove' | null = null;

      try {
        setFavoriteErrorMessage('');

        const token = await getAccessToken();

        if (!token) {
          throw new Error('Missing access token.');
        }

        const currentFavoriteState = useSongFavoriteStatusStore.getState().favoriteStateMap[songId];
        const currentIsCollected = currentFavoriteState ?? Boolean(song.isCollected);
        const nextIsCollected = !currentIsCollected;

        // console.log('[SingerPanel] favorite decision:', {
        //   songId,
        //   title: song.title,
        //   storeFavoriteState: currentFavoriteState,
        //   songIsCollected: song.isCollected,
        //   currentIsCollected,
        //   nextIsCollected,
        // });

        if (currentIsCollected) {
          favoriteAction = 'remove';

          const response = await playlistClient.removeSongFromPlaylist({
            token,
            type: 'collect',
            songId,
          });

          // console.log('[SingerPanel] removed favorite:', {
          //   songId,
          //   title: song.title,
          //   response,
          // });
        } else {
          favoriteAction = 'add';

          const response = await playlistClient.addSongToPlaylist({
            token,
            type: 'collect',
            songId,
          });

          // console.log('[SingerPanel] added favorite:', {
          //   songId,
          //   title: song.title,
          //   response,
          // });
        }

        useSongFavoriteStatusStore.getState().setFavoriteState(songId, nextIsCollected);

        queryClient.invalidateQueries({
          queryKey: ['playlist'],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.log('[SingerPanel] toggle favorite failed:', {
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

        setFavoriteErrorMessage(message);
      } finally {
        useSongFavoriteStatusStore.getState().clearFavoriteActionStatus(songId);
      }
    },
    [queryClient],
  );

  const handlePressBack = useCallback(() => {
    if (selectedSinger) {
      setSelectedSinger(null);
      setSearchKeyword('');
      setDebouncedSearchKeyword('');
      setKeyboardMode('zhuyin');
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
    setDebouncedSearchKeyword('');
  }, [visible]);

  const singerSongKeyExtractor = useCallback((item: SongDto) => {
    return item._id;
  }, []);

  const getSingerSongItemLayout = useCallback(
    (_data: ArrayLike<SongDto> | null | undefined, index: number) => {
      return {
        length: SINGER_SONG_ROW_HEIGHT,
        offset: SINGER_SONG_ROW_HEIGHT * index,
        index,
      };
    },
    [],
  );

  const renderSingerSongItem = useCallback(
    ({ item }: { item: SongDto }) => {
      return (
        <SingerSongRow
          song={item}
          copy={copy}
          selectedSingerName={selectedSingerName}
          onToggleFavorite={handleToggleFavorite}
          onAddSongToQueue={enqueueSongAfterDownload}
        />
      );
    },
    [copy, handleToggleFavorite, enqueueSongAfterDownload, selectedSingerName],
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <View style={styles.leftArea}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {favoriteErrorMessage ? (
            <Text style={styles.errorText}>{favoriteErrorMessage}</Text>
          ) : null}

          {isSingerListMode ? (
            <View style={styles.singerView}>
              <Text style={styles.title}>{copy.title}</Text>

              {isCurrentSingerLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>{copy.loadingSingers}</Text>
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
                  // onEndReached={handleLoadMoreSingers}
                  onEndReached={isSearchMode ? undefined : handleLoadMoreSingers}
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
                      <Text style={styles.emptyText}>{copy.emptySingers}</Text>
                    </View>
                  }
                  ListFooterComponent={
                    !isSearchMode && isLoadingMoreSingers ? (
                      <View style={styles.footerLoading}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>{copy.loadingMoreSingers}</Text>
                      </View>
                    ) : null
                  }
                />
              )}

              <View style={styles.leftFooter}>
                <Text style={styles.pageText}>{singerPageText}</Text>

                <Pressable style={styles.backButton} onPress={handlePressBack}>
                  <Text style={styles.backButtonText}>{copy.back}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.songView}>
              <Text style={styles.title}>{selectedSingerName}</Text>

              {isCurrentSongLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>{copy.loadingSongs}</Text>
                </View>
              ) : (
                // <FlatList
                //   key="singer-song-list"
                //   ref={songListRef}
                //   style={styles.listArea}
                //   data={filteredSongs}
                //   keyExtractor={(item) => item._id}
                //   contentContainerStyle={styles.songListContent}
                //   // onEndReached={handleLoadMoreSongs}
                //   onEndReached={isSearchMode ? undefined : handleLoadMoreSongs}
                //   onEndReachedThreshold={0.35}
                //   showsVerticalScrollIndicator={false}
                //   initialNumToRender={8}
                //   maxToRenderPerBatch={8}
                //   windowSize={5}
                //   removeClippedSubviews
                //   renderItem={({ item }) => (
                //     // <Pressable
                //     //   style={({ pressed }) => [
                //     //     styles.songRow,
                //     //     pressed && styles.songRowPressed,
                //     //     songActionStatusMap[item._id] && styles.songRowResolving,
                //     //   ]}
                //     //   onPress={() => insertSongNext(item)}
                //     // >
                //     //   <View style={styles.songIconBox}>
                //     //     <SongReadyIcon width={32} height={32} />
                //     //   </View>

                //     //   <Text style={styles.songTitle} numberOfLines={1}>
                //     //     {truncateText(formatDisplaySongTitle(item.title), 11)}
                //     //   </Text>

                //     //   <Text style={styles.artistText} numberOfLines={1}>
                //     //     {/* {truncateText(formatArtists(item.artists), 5)} */}
                //     //     {truncateText(formatSongArtistText(item, selectedSingerName), 5)}
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
                //     //       insertSongNext(item);
                //     //     }}
                //     //   >
                //     //     <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
                //     //       {getInsertButtonText(songActionStatusMap[item._id], copy)}
                //     //     </Text>
                //     //   </Pressable>
                //     // </Pressable>

                //     <SingerSongRow
                //       song={item}
                //       copy={copy}
                //       selectedSingerName={selectedSingerName}
                //       onToggleFavorite={handleToggleFavorite}
                //       onInsertSongNext={insertSongNext}
                //     />
                //   )}
                //   ListEmptyComponent={
                //     <View style={styles.centerContent}>
                //       <Text style={styles.emptyText}>{copy.emptySongs}</Text>
                //     </View>
                //   }
                //   ListFooterComponent={
                //     isLoadingMoreSongs ? (
                //       <View style={styles.footerLoading}>
                //         <ActivityIndicator />
                //       </View>
                //     ) : null
                //   }
                // />

                <FlatList
                  key="singer-song-list"
                  ref={songListRef}
                  style={styles.listArea}
                  data={filteredSongs}
                  keyExtractor={singerSongKeyExtractor}
                  getItemLayout={getSingerSongItemLayout}
                  contentContainerStyle={styles.songListContent}
                  onEndReached={isSearchMode ? undefined : handleLoadMoreSongs}
                  onEndReachedThreshold={0.35}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={8}
                  maxToRenderPerBatch={6}
                  updateCellsBatchingPeriod={50}
                  windowSize={5}
                  removeClippedSubviews
                  keyboardShouldPersistTaps="handled"
                  renderItem={renderSingerSongItem}
                  ListEmptyComponent={
                    <View style={styles.centerContent}>
                      <Text style={styles.emptyText}>{copy.emptySongs}</Text>
                    </View>
                  }
                  ListFooterComponent={
                    isLoadingMoreSongs ? (
                      <View style={styles.footerLoading}>
                        <ActivityIndicator />
                      </View>
                    ) : null
                  }
                />
              )}

              <View style={styles.leftFooter}>
                {/* <Text style={styles.pageText}>{songPageText}</Text> */}

                <Pressable style={styles.backButton} onPress={handlePressBack}>
                  <Text style={styles.backButtonText}>{copy.back}</Text>
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
            placeholder={isSingerListMode ? '搜尋歌手' : '搜尋歌曲'}
            onModeChange={setKeyboardMode}
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
