import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
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

import { useCollectedSongsQuery } from '@/src/features/playlist/hook/use-collected-songs-query';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';
import { SongDto } from '@/src/services/song/song.types';

import {
  MY_SONGS_PANEL_COPY,
  type MySongsPanelCopy,
} from '@/src/features/main/i18n/my-songs-panel-copy';
import { useAppLanguageStore } from '@/src/shared/i18n/language.store';

// import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 1000;
const MY_SONG_ROW_HEIGHT = 62;

function formatArtists(artists: SongDto['artists'], unknownArtistText: string) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return unknownArtistText;
  }

  const names = artists
    .map((artist) => String(artist))
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return unknownArtistText;
  }

  return names.join('、');
}

function truncateText(value: string, maxLength: number) {
  const chars = Array.from(value);

  if (chars.length <= maxLength) {
    return value;
  }

  return `${chars.slice(0, maxLength).join('')}...`;
}

function getInsertButtonText(status: SongDownloadStatus | undefined, copy: MySongsPanelCopy) {
  if (!status) {
    return copy.insert;
  }

  if (status.phase === 'preparing') {
    return copy.preparing;
  }

  if (status.phase === 'downloading') {
    return copy.downloading(status.progress ?? 0);
  }

  return copy.insert;
}

type MySongRowProps = {
  song: SongDto;
  copy: MySongsPanelCopy;
  onToggleFavorite: (song: SongDto) => void;
  onInsertSongNext: (song: SongDto) => void;
};

const MySongRow = memo(function MySongRow({
  song,
  copy,
  onToggleFavorite,
  onInsertSongNext,
}: MySongRowProps) {
  const songActionStatus = useSongDownloadStatusStore((state) => state.statusMap[song._id]);

  const isFavoriteActionLoading = useSongFavoriteStatusStore((state) =>
    Boolean(state.actionStatusMap[song._id]),
  );

  const favoriteState = useSongFavoriteStatusStore((state) => state.favoriteStateMap[song._id]);

  const isSongActionLoading = Boolean(songActionStatus);
  const isFavorite = favoriteState ?? Boolean(song.isCollected);

  const displayTitle = useMemo(() => {
    return truncateText(formatDisplaySongTitle(song.title), 16);
  }, [song.title]);

  const displayArtistText = useMemo(() => {
    return truncateText(formatArtists(song.artists, copy.unknownArtist), 10);
  }, [copy.unknownArtist, song.artists]);

  const insertButtonText = useMemo(() => {
    return getInsertButtonText(songActionStatus, copy);
  }, [songActionStatus, copy]);

  const handlePressRow = useCallback(() => {
    // useDebugLogStore.getState().addLog('MySongsPanel', 'press row', {
    //   songId: song._id,
    //   title: song.title,
    //   isSongActionLoading,
    // });

    if (isSongActionLoading) {
      // useDebugLogStore.getState().addLog('MySongsPanel', 'press ignored: song action loading', {
      //   songId: song._id,
      //   title: song.title,
      // });
      return;
    }

    // useDebugLogStore.getState().addLog('MySongsPanel', 'enqueue song', {
    //   songId: song._id,
    //   title: song.title,
    // });

    onInsertSongNext(song);
  }, [isSongActionLoading, onInsertSongNext, song]);

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

      // useDebugLogStore.getState().addLog('MySongsPanel', 'press insert', {
      //   songId: song._id,
      //   title: song.title,
      //   isSongActionLoading,
      // });

      if (isSongActionLoading) {
        // useDebugLogStore.getState().addLog('MySongsPanel', 'insert ignored: song action loading', {
        //   songId: song._id,
        //   title: song.title,
        // });
        return;
      }

      // useDebugLogStore.getState().addLog('MySongsPanel', 'insert song', {
      //   songId: song._id,
      //   title: song.title,
      // });

      onInsertSongNext(song);
    },
    [isSongActionLoading, onInsertSongNext, song],
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

export function MySongsPanel({ visible, onClose }: Props) {
  const language = useAppLanguageStore((state) => state.language);
  const copy = MY_SONGS_PANEL_COPY[language];

  const {
    data: songs = [],
    isLoading,
    error,
  } = useCollectedSongsQuery({
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    // useDebugLogStore.getState().addLog('MySongsPanel', 'state changed', {
    //   songsCount: songs.length,
    //   isLoading,
    //   error: error instanceof Error ? error.message : undefined,
    // });
  }, [error, isLoading, songs.length, visible]);

  // const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();
  const { enqueueSongAfterDownload } = useInsertSongPlayback();

  const totalPages = useMemo(() => {
    if (songs.length <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  }, [songs.length]);

  const queryClient = useQueryClient();

  // const [favoriteActionStatusMap, setFavoriteActionStatusMap] = useState<Record<string, boolean>>(
  //   {},
  // );

  // const [favoriteStateMap, setFavoriteStateMap] = useState<Record<string, boolean>>({});

  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');

  // const handleToggleFavorite = useCallback(
  //   async (song: SongDto) => {
  //     const songId = song._id;

  //     if (!songId) {
  //       console.log('[MySongsPanel] favorite ignored: missing songId', song);
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

  //         console.log('[MySongsPanel] removed favorite:', {
  //           songId,
  //           title: song.title,
  //         });
  //       } else {
  //         await playlistClient.addSongToPlaylist({
  //           token,
  //           type: 'collect',
  //           songId,
  //         });

  //         console.log('[MySongsPanel] added favorite:', {
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

  //       console.log('[MySongsPanel] toggle favorite failed:', {
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
        console.log('[MySongsPanel] favorite ignored: missing songId', song);
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

        // console.log('[MySongsPanel] favorite decision:', {
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

          // console.log('[MySongsPanel] removed favorite:', {
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

          // console.log('[MySongsPanel] added favorite:', {
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

        console.log('[MySongsPanel] toggle favorite failed:', {
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

  const keyExtractor = useCallback((item: SongDto) => {
    return item._id;
  }, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<SongDto> | null | undefined, index: number) => {
      return {
        length: MY_SONG_ROW_HEIGHT,
        offset: MY_SONG_ROW_HEIGHT * index,
        index,
      };
    },
    [],
  );

  const renderMySongItem = useCallback(
    ({ item }: { item: SongDto }) => {
      return (
        <MySongRow
          song={item}
          copy={copy}
          onToggleFavorite={handleToggleFavorite}
          onInsertSongNext={enqueueSongAfterDownload}
        />
      );
    },
    [copy, handleToggleFavorite, enqueueSongAfterDownload],
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <Text style={styles.title}>{copy.title}</Text>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        {favoriteErrorMessage ? <Text style={styles.errorText}>{favoriteErrorMessage}</Text> : null}

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>{copy.loadingMySongs}</Text>
          </View>
        ) : (
          // <FlatList
          //   data={songs}
          //   keyExtractor={(item) => item._id}
          //   contentContainerStyle={styles.listContent}
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
          //     //     {truncateText(formatDisplaySongTitle(item.title), 16)}
          //     //   </Text>

          //     //   <Text style={styles.artistText} numberOfLines={1}>
          //     //     {truncateText(formatArtists(item.artists, copy.unknownArtist), 10)}
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

          //     <MySongRow
          //       song={item}
          //       copy={copy}
          //       onToggleFavorite={handleToggleFavorite}
          //       onInsertSongNext={insertSongNext}
          //     />
          //   )}
          //   ListEmptyComponent={
          //     <View style={styles.centerContent}>
          //       <Text style={styles.emptyText}>{copy.emptyMySongs}</Text>
          //     </View>
          //   }
          // />

          <FlatList
            data={songs}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            renderItem={renderMySongItem}
            ListEmptyComponent={
              <View style={styles.centerContent}>
                <Text style={styles.emptyText}>{copy.emptyMySongs}</Text>
              </View>
            }
          />
        )}

        <View style={styles.footerRow}>
          <Text style={styles.pageText}>1/{totalPages}</Text>

          <Pressable style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>{copy.back}</Text>
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

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 10,
  },

  listContent: {
    paddingBottom: 12,
  },

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
    width: 360,
    minWidth: 0,
    color: '#FFFFFF',
    // fontFamily: 'NotoSansTCVariable',
    fontSize: 20,
    fontWeight: '700',
  },

  artistText: {
    flex: 1,
    minWidth: 0,
    color: '#FFFFFF',
    // fontFamily: 'NotoSansTCVariable',
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
    // fontFamily: 'NotoSansTCVariable',
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
    // fontFamily: 'NotoSansTCVariable',
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
    // fontFamily: 'NotoSansTCVariable',
    fontSize: 18,
    fontWeight: '800',
  },

  errorText: {
    color: '#FF7A7A',
    marginBottom: 8,
    // fontFamily: 'NotoSansTCVariable',
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
    // fontFamily: 'NotoSansTCVariable',
    fontSize: 14,
  },

  emptyText: {
    color: 'rgba(255, 255, 255, 0.72)',
    // fontFamily: 'NotoSansTCVariable',
    fontSize: 16,
    fontWeight: '700',
  },
});
