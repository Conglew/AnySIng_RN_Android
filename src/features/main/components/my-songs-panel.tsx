import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { SongDownloadStatus } from '@/src/features/player/stores/song-download-status.store';
import { useCollectedSongsQuery } from '@/src/features/playlist/hook/use-collected-songs-query';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';
import { SongDto } from '@/src/services/song/song.types';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_SIZE = 50;

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

export function MySongsPanel({ visible, onClose }: Props) {
  const {
    data: songs = [],
    isLoading,
    error,
  } = useCollectedSongsQuery({
    enabled: visible,
  });

  const { songActionStatusMap, insertSongNext } = useInsertSongPlayback();

  const totalPages = useMemo(() => {
    if (songs.length <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  }, [songs.length]);

  const queryClient = useQueryClient();

  const [favoriteActionStatusMap, setFavoriteActionStatusMap] = useState<Record<string, boolean>>(
    {},
  );

  const [favoriteStateMap, setFavoriteStateMap] = useState<Record<string, boolean>>({});

  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');

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

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <Text style={styles.title}>我的歌單</Text>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        {favoriteErrorMessage ? <Text style={styles.errorText}>{favoriteErrorMessage}</Text> : null}

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>載入我的歌單中</Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
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
                  {truncateText(formatDisplaySongTitle(item.title), 16)}
                </Text>

                <Text style={styles.artistText} numberOfLines={1}>
                  {truncateText(formatArtists(item.artists), 10)}
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
                <Text style={styles.emptyText}>目前沒有收藏歌曲</Text>
              </View>
            }
          />
        )}

        <View style={styles.footerRow}>
          <Text style={styles.pageText}>1/{totalPages}</Text>

          <Pressable style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>返回</Text>
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
});
