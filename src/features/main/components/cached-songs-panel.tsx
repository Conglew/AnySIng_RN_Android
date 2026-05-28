import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { songCacheService } from '@/src/features/player/services/song-cache.service';

import {
  SongDownloadStatus,
  useSongDownloadStatusStore,
} from '@/src/features/player/stores/song-download-status.store';

import { useSongFavoriteStatusStore } from '@/src/features/main/store/song-favorite-status.store';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

import { CachedSongAsset } from '@/src/features/player/types/cached-song.types';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import {
  CACHED_SONGS_PANEL_COPY,
  CachedSongsPanelCopy,
} from '@/src/features/main/i18n/cached-songs-panel-copy';
import { useAppLanguageStore } from '@/src/shared/i18n/language.store';

import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 1000;
const CACHED_SONG_ROW_HEIGHT = 70;

// function formatArtists(artists: CachedSongAsset['song'] extends infer T ? any : never) {
//   if (!Array.isArray(artists) || artists.length === 0) {
//     return '未知歌手';
//   }

//   return artists
//     .map((artist) => String(artist))
//     .filter(Boolean)
//     .join('、');
// }

function formatArtists(artists: unknown[] | undefined, unknownArtistText: string) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return unknownArtistText;
  }

  const names = artists
    .map((artist) => {
      if (typeof artist === 'string') {
        return artist;
      }

      if (artist && typeof artist === 'object' && 'name' in artist) {
        return String((artist as { name?: unknown }).name ?? '');
      }

      return '';
    })
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

function getInsertButtonText(status: SongDownloadStatus | undefined, copy: CachedSongsPanelCopy) {
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

type CachedSongRowProps = {
  item: CachedSongAsset;
  copy: CachedSongsPanelCopy;
  isEditing: boolean;
  isRemoving: boolean;
  onRemoveCachedSong: (songId: string) => void;
  onToggleFavorite: (song: NonNullable<CachedSongAsset['song']>) => void;
  onInsertSongNext: NonNullable<ReturnType<typeof useInsertSongPlayback>['insertSongNext']>;
  onEnqueueSongAfterDownload: NonNullable<
    ReturnType<typeof useInsertSongPlayback>['enqueueSongAfterDownload']
  >;
};

const CachedSongRow = memo(function CachedSongRow({
  item,
  copy,
  isEditing,
  isRemoving,
  onRemoveCachedSong,
  onToggleFavorite,
  onInsertSongNext,
  onEnqueueSongAfterDownload,
}: CachedSongRowProps) {
  const song = item.song;

  const songActionStatus = useSongDownloadStatusStore((state) => state.statusMap[item.songId]);

  const favoriteState = useSongFavoriteStatusStore((state) => state.favoriteStateMap[item.songId]);

  const isSongActionLoading = Boolean(songActionStatus);
  const isFavorite = favoriteState ?? Boolean(song?.isCollected);

  const displayTitle = useMemo(() => {
    const title = song?.title ? formatDisplaySongTitle(song.title) : item.songId;

    return truncateText(title, 18);
  }, [item.songId, song?.title]);

  const displayArtistText = useMemo(() => {
    const artistText = formatArtists(song?.artists, copy.unknownArtist);

    return truncateText(artistText, 16);
  }, [copy.unknownArtist, song?.artists]);

  const insertButtonText = useMemo(() => {
    return getInsertButtonText(songActionStatus, copy);
  }, [songActionStatus, copy]);

  const handleRemove = useCallback(() => {
    onRemoveCachedSong(item.songId);
  }, [item.songId, onRemoveCachedSong]);

  const handlePressRow = useCallback(() => {
    useDebugLogStore.getState().addLog('CachedSongsPanel', 'press cached row', {
      songId: item.songId,
      hasSong: Boolean(song),
      isEditing,
      isSongActionLoading,
      videoUri: item.videoUri,
      title: song?.title,
    });

    if (!song) {
      useDebugLogStore.getState().addLog('CachedSongsPanel', 'press ignored: missing song', {
        songId: item.songId,
        videoUri: item.videoUri,
      });
      return;
    }

    if (isEditing) {
      useDebugLogStore.getState().addLog('CachedSongsPanel', 'press ignored: editing mode', {
        songId: item.songId,
        title: song.title,
      });
      return;
    }

    useDebugLogStore.getState().addLog('CachedSongsPanel', 'enqueue cached song', {
      songId: item.songId,
      title: song.title,
    });

    onEnqueueSongAfterDownload(song);
  }, [isEditing, onEnqueueSongAfterDownload, song]);

  const isFavoriteActionLoading = useSongFavoriteStatusStore((state) =>
    Boolean(state.actionStatusMap[item.songId]),
  );

  const handlePressFavorite = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (!song) {
        return;
      }

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

      if (!song) {
        return;
      }

      if (isSongActionLoading) {
        return;
      }

      onInsertSongNext(song);
    },
    [isSongActionLoading, onInsertSongNext, song],
  );

  const renderRightActions = useCallback(() => {
    return (
      <Pressable style={styles.swipeRemoveButton} disabled={isRemoving} onPress={handleRemove}>
        <Text style={styles.swipeRemoveText}>{isRemoving ? copy.removing : copy.remove}</Text>
      </Pressable>
    );
  }, [copy.remove, copy.removing, handleRemove, isRemoving]);

  return (
    <Swipeable enabled={isEditing} renderRightActions={renderRightActions}>
      <Pressable
        style={({ pressed }) => [
          styles.songRow,
          pressed && styles.songRowPressed,
          isSongActionLoading && styles.songRowResolving,
        ]}
        disabled={!song}
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
          disabled={!song || isFavoriteActionLoading}
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
          disabled={!song || isSongActionLoading}
          onPress={handlePressInsert}
        >
          <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
            {insertButtonText}
          </Text>
        </Pressable>
      </Pressable>
    </Swipeable>
  );
});

export function CachedSongsPanel({ visible, onClose }: Props) {
  const language = useAppLanguageStore((state) => state.language);
  const copy = CACHED_SONGS_PANEL_COPY[language];

  const [cachedSongs, setCachedSongs] = useState<CachedSongAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');

  // const { songActionStatusMap, insertSongNext, enqueueSongAfterDownload } = useInsertSongPlayback();
  const { insertSongNext, enqueueSongAfterDownload } = useInsertSongPlayback();

  const [isEditing, setIsEditing] = useState(false);
  const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);
  const [removingSongIdMap, setRemovingSongIdMap] = useState<Record<string, boolean>>({});

  const totalPages = useMemo(() => {
    if (cachedSongs.length <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(cachedSongs.length / PAGE_SIZE));
  }, [cachedSongs.length]);

  const loadCachedSongs = useCallback(async () => {
    useDebugLogStore.getState().addLog('CachedSongsPanel', 'load cached songs start');

    try {
      setErrorMessage('');
      setIsLoading(true);

      const result = await songCacheService.getAllCachedSongs();

      useDebugLogStore.getState().addLog('CachedSongsPanel', 'load cached songs success', {
        count: result.length,
        missingSongCount: result.filter((item) => !item.song).length,
      });

      setCachedSongs(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      useDebugLogStore.getState().addLog('CachedSongsPanel', 'load cached songs failed', {
        error: message,
      });

      setErrorMessage(message);
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

  const handleRemoveCachedSong = useCallback(async (songId: string) => {
    if (!songId) {
      return;
    }

    let shouldRemove = false;

    setRemovingSongIdMap((previous) => {
      if (previous[songId]) {
        return previous;
      }

      shouldRemove = true;

      return {
        ...previous,
        [songId]: true,
      };
    });

    if (!shouldRemove) {
      return;
    }

    try {
      setErrorMessage('');

      await songCacheService.removeCachedSong(songId);

      setCachedSongs((previous) => previous.filter((item) => item.songId !== songId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRemovingSongIdMap((previous) => {
        if (!previous[songId]) {
          return previous;
        }

        const next = { ...previous };
        delete next[songId];
        return next;
      });
    }
  }, []);

  const handleToggleFavorite = useCallback(async (song: NonNullable<CachedSongAsset['song']>) => {
    const songId = song._id;

    if (!songId) {
      console.log('[CachedSongsPanel] favorite ignored: missing songId', song);
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

      console.log('[CachedSongsPanel] favorite decision:', {
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

        console.log('[CachedSongsPanel] removed favorite:', {
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

        console.log('[CachedSongsPanel] added favorite:', {
          songId,
          title: song.title,
          response,
        });
      }

      useSongFavoriteStatusStore.getState().setFavoriteState(songId, nextIsCollected);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.log('[CachedSongsPanel] toggle favorite failed:', {
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
        return;
      }

      setFavoriteErrorMessage(message);
    } finally {
      useSongFavoriteStatusStore.getState().clearFavoriteActionStatus(songId);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    loadCachedSongs();
  }, [loadCachedSongs, visible]);

  const keyExtractor = useCallback((item: CachedSongAsset) => {
    return item.songId;
  }, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<CachedSongAsset> | null | undefined, index: number) => {
      return {
        length: CACHED_SONG_ROW_HEIGHT,
        offset: CACHED_SONG_ROW_HEIGHT * index,
        index,
      };
    },
    [],
  );

  const renderCachedSongItem = useCallback(
    ({ item }: { item: CachedSongAsset }) => {
      return (
        <CachedSongRow
          item={item}
          copy={copy}
          isEditing={isEditing}
          isRemoving={Boolean(removingSongIdMap[item.songId])}
          onRemoveCachedSong={handleRemoveCachedSong}
          onToggleFavorite={handleToggleFavorite}
          onInsertSongNext={insertSongNext}
          onEnqueueSongAfterDownload={enqueueSongAfterDownload}
        />
      );
    },
    [
      copy,
      enqueueSongAfterDownload,
      handleRemoveCachedSong,
      handleToggleFavorite,
      insertSongNext,
      isEditing,
      removingSongIdMap,
    ],
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.panel}>
        {/* <View style={styles.headerRow}>
          <Text style={styles.title}>緩存下載</Text>

          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>編輯</Text>
          </Pressable>

          <Pressable style={styles.editButton} onPress={handleClearAllCachedSongs}>
            <Text style={styles.editButtonText}>清除</Text>
          </Pressable>
        </View> */}

        <View style={styles.headerRow}>
          <Text style={styles.title}>{copy.title}</Text>

          {isEditing ? (
            <View style={styles.editActionGroup}>
              <Pressable
                style={[styles.editActionButton, styles.removeAllButton]}
                onPress={() => {
                  setIsClearConfirmVisible(true);
                }}
              >
                <Text style={[styles.editButtonText, styles.removeAllText]}>{copy.removeAll}</Text>
              </Pressable>

              <Pressable
                style={styles.editActionButton}
                onPress={() => {
                  setIsEditing(false);
                  setIsClearConfirmVisible(false);
                }}
              >
                <Text style={styles.editButtonText}>{copy.done}</Text>
              </Pressable>

              <Pressable
                style={styles.editActionButton}
                onPress={() => {
                  setIsEditing(false);
                  setIsClearConfirmVisible(false);
                }}
              >
                <Text style={styles.editButtonText}>{copy.cancel}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.editButton}
              onPress={() => {
                setIsEditing(true);
              }}
            >
              <Text style={styles.editButtonText}>{copy.edit}</Text>
            </Pressable>
          )}
        </View>

        {/* {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null} */}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {favoriteErrorMessage ? <Text style={styles.errorText}>{favoriteErrorMessage}</Text> : null}

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>{copy.loadingCachedSongs}</Text>
          </View>
        ) : (
          // <FlatList
          //   data={cachedSongs}
          //   keyExtractor={(item) => item.songId}
          //   contentContainerStyle={styles.listContent}
          //   initialNumToRender={8}
          //   maxToRenderPerBatch={8}
          //   windowSize={5}
          //   removeClippedSubviews
          //   // renderItem={({ item }) => {
          //   //   // const song = item.song;
          //   //   // const title = song?.title ?? item.songId;
          //   //   // const artists = song?.artists;
          //   //   const song = item.song;
          //   //   const title = song?.title ? formatDisplaySongTitle(song.title) : item.songId;
          //   //   const artistText = formatArtists(song?.artists, copy.unknownArtist);

          //   //   return (
          //   //     <Swipeable
          //   //       enabled={isEditing}
          //   //       renderRightActions={() => (
          //   //         <Pressable
          //   //           style={styles.swipeRemoveButton}
          //   //           disabled={Boolean(removingSongIdMap[item.songId])}
          //   //           onPress={() => {
          //   //             handleRemoveCachedSong(item.songId);
          //   //           }}
          //   //         >
          //   //           <Text style={styles.swipeRemoveText}>
          //   //             {removingSongIdMap[item.songId] ? copy.removing : copy.remove}
          //   //           </Text>
          //   //         </Pressable>
          //   //       )}
          //   //     >
          //   //       <Pressable
          //   //         style={({ pressed }) => [
          //   //           styles.songRow,
          //   //           pressed && styles.songRowPressed,
          //   //           songActionStatusMap[item.songId] && styles.songRowResolving,
          //   //         ]}
          //   //         disabled={!song}
          //   //         onPress={() => {
          //   //           if (!song) {
          //   //             return;
          //   //           }

          //   //           if (isEditing) {
          //   //             return;
          //   //           }

          //   //           // insertSongNext(song);
          //   //           enqueueSongAfterDownload(song);
          //   //         }}
          //   //       >
          //   //         <View style={styles.songIconBox}>
          //   //           <SongReadyIcon width={32} height={32} />
          //   //         </View>

          //   //         <Text style={styles.songTitle} numberOfLines={1}>
          //   //           {truncateText(title, 18)}
          //   //         </Text>

          //   //         <Text style={styles.artistText} numberOfLines={1}>
          //   //           {truncateText(artistText, 16)}
          //   //         </Text>

          //   //         <Pressable style={styles.favoriteButton}>
          //   //           {song?.isCollected ? (
          //   //             <SongLikedIcon width={42} height={42} />
          //   //           ) : (
          //   //             <SongLikeIcon width={42} height={42} />
          //   //           )}
          //   //         </Pressable>

          //   //         <Pressable
          //   //           style={styles.insertButton}
          //   //           disabled={!song || Boolean(songActionStatusMap[item.songId])}
          //   //           onPress={(event) => {
          //   //             event.stopPropagation();

          //   //             if (!song) {
          //   //               return;
          //   //             }

          //   //             insertSongNext(song);
          //   //             // enqueueSongAfterDownload(song);
          //   //             console.log('isInsertSongNext');
          //   //           }}
          //   //         >
          //   //           <Text style={styles.insertText} numberOfLines={1} ellipsizeMode="clip">
          //   //             {getInsertButtonText(songActionStatusMap[item.songId], copy)}
          //   //           </Text>
          //   //         </Pressable>
          //   //       </Pressable>
          //   //     </Swipeable>
          //   //   );
          //   // }}

          //   renderItem={({ item }) => (
          //     <CachedSongRow
          //       item={item}
          //       copy={copy}
          //       isEditing={isEditing}
          //       isRemoving={Boolean(removingSongIdMap[item.songId])}
          //       onRemoveCachedSong={handleRemoveCachedSong}
          //       onToggleFavorite={handleToggleFavorite}
          //       onInsertSongNext={insertSongNext}
          //       onEnqueueSongAfterDownload={enqueueSongAfterDownload}
          //     />
          //   )}
          //   ListEmptyComponent={
          //     <View style={styles.centerContent}>
          //       <Text style={styles.emptyText}>{copy.emptyCachedSongs}</Text>
          //     </View>
          //   }
          // />

          <FlatList
            data={cachedSongs}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.listContent}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            renderItem={renderCachedSongItem}
            ListEmptyComponent={
              <View style={styles.centerContent}>
                <Text style={styles.emptyText}>{copy.emptyCachedSongs}</Text>
              </View>
            }
          />
        )}

        <View style={styles.footerRow}>
          {/* <Text style={styles.pageText}>1/{totalPages}</Text> */}

          <Pressable style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>{copy.back}</Text>
          </Pressable>
        </View>
      </View>

      {isClearConfirmVisible ? (
        <Pressable
          style={styles.confirmLayer}
          onPress={() => {
            // 點擊黑色遮罩時不做任何事
            // 目的：吃掉點擊事件，避免穿透到後面的 UI
          }}
        >
          <Pressable
            style={styles.confirmBox}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <Text style={styles.confirmText}>{copy.clearAllConfirm}</Text>

            <View style={styles.confirmButtonRow}>
              <Pressable
                style={styles.confirmCancelButton}
                onPress={() => {
                  setIsClearConfirmVisible(false);
                }}
              >
                <Text style={styles.confirmCancelText}>{copy.cancel}</Text>
              </Pressable>

              <Pressable
                style={styles.confirmClearButton}
                onPress={async () => {
                  await handleClearAllCachedSongs();
                  setIsEditing(false);
                  setIsClearConfirmVisible(false);
                }}
              >
                <Text style={styles.confirmClearText}>{copy.clear}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      ) : null}
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

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)',
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

  editActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  editActionButton: {
    height: 44,
    minWidth: 80,
    borderRadius: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 24, 58, 0.88)',
  },

  removeAllButton: {
    // minWidth: 160,
  },

  editActionText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  removeAllText: {
    color: '#FF4D4F',
  },

  swipeRemoveButton: {
    width: 96,
    height: 60,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
  },

  swipeRemoveText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  confirmLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },

  confirmBox: {
    width: 530,
    borderRadius: 18,
    paddingHorizontal: 44,
    paddingVertical: 34,
    backgroundColor: 'rgba(18, 28, 34, 0.96)',
  },

  confirmText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30,
  },

  confirmButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  confirmCancelButton: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  confirmClearButton: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7A00',
  },

  confirmCancelText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  confirmClearText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
});
