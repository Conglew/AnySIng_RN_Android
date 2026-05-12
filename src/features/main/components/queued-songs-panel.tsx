import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

import { useQueuedSongsPanelStore } from '@/src/features/main/store/queued-songs-panel.store';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

function truncateText(text: string, maxLength: number) {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export function QueuedSongsPanel() {
  const isVisible = useQueuedSongsPanelStore((state) => state.isVisible);
  const closePanel = useQueuedSongsPanelStore((state) => state.closePanel);

  const currentItem = usePlaybackQueueStore((state) => state.currentItem);
  const queue = usePlaybackQueueStore((state) => state.queue);

  const moveToNext = usePlaybackQueueStore((state) => state.moveToNext);

  const [interjectingQueueIdMap, setInterjectingQueueIdMap] = useState<Record<string, boolean>>({});

  const displayQueue = currentItem ? [currentItem, ...queue] : queue;

  const handleInterjectQueueItem = useCallback(
    async (queueId: string, songId: string) => {
      if (!queueId || !songId) {
        console.log('[QueuedSongsPanel] interject ignored: missing ids', {
          queueId,
          songId,
        });
        return;
      }

      if (currentItem?.queueId === queueId) {
        return;
      }

      if (interjectingQueueIdMap[queueId]) {
        return;
      }

      setInterjectingQueueIdMap((previous) => ({
        ...previous,
        [queueId]: true,
      }));

      try {
        const token = await getAccessToken();

        if (!token) {
          throw new Error('Missing access token.');
        }

        await playlistClient.interjectSongNext({
          token,
          songId,
        });

        moveToNext(queueId);
      } catch (error) {
        console.log('[QueuedSongsPanel] interject failed:', {
          queueId,
          songId,
          error,
        });
      } finally {
        setInterjectingQueueIdMap((previous) => {
          const next = { ...previous };
          delete next[queueId];
          return next;
        });
      }
    },
    [currentItem?.queueId, interjectingQueueIdMap, moveToNext],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={closePanel} />

      <View style={styles.panel}>
        <Text style={styles.title}>已點歌曲</Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {displayQueue.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>目前尚未點歌</Text>
            </View>
          ) : (
            displayQueue.map((item) => {
              const songTitle = truncateText(formatDisplaySongTitle(item.title), 14);
              const artistText = truncateText(item.artistText ?? '未知歌手', 17);
              const isCurrent = item.queueId === currentItem?.queueId;

              return (
                <View
                  key={item.queueId}
                  style={[styles.songRow, isCurrent && styles.currentSongRow]}
                >
                  <View style={styles.songIconBox}>
                    {isCurrent ? (
                      <Image
                        source={require('@/assets/images/songPrefab/playing/playing.webp')}
                        style={{
                          width: 48,
                          height: 48,
                        }}
                        contentFit="contain"
                      />
                    ) : (
                      <SongReadyIcon width={48} height={48} />
                    )}
                  </View>

                  <View style={styles.songTextGroup}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {songTitle}
                    </Text>

                    <Text style={styles.artistText} numberOfLines={1}>
                      {artistText}
                    </Text>
                  </View>

                  {isCurrent ? (
                    <Text style={styles.statusText} />
                  ) : (
                    <Pressable
                      disabled={Boolean(interjectingQueueIdMap[item.queueId])}
                      onPress={() => {
                        handleInterjectQueueItem(item.queueId, item.songId);
                      }}
                    >
                      <Text style={styles.statusText}>
                        {interjectingQueueIdMap[item.queueId] ? '處理中' : '插播'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 30,
    backgroundColor: 'transparent',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  panel: {
    width: 474,
    height: 600,
    borderRadius: 10,
    paddingTop: 32,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(24, 24, 24, 0.95)',
    marginBottom: 70,
    overflow: 'hidden',
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 28,
    gap: 10,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },

  emptyBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 18,
    fontWeight: '600',
  },

  songRow: {
    height: 68,
    borderRadius: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 44, 44, 0.62)',
  },

  currentSongRow: {
    borderWidth: 2,
    borderColor: '#6C47FF',
    backgroundColor: '#FF6B1A',
  },

  songIconBox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    // backgroundColor: 'red'
  },

  songTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },

  songTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    includeFontPadding: false,
  },

  artistText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.92,
    marginTop: 4,
    includeFontPadding: false,
  },

  statusText: {
    width: 64,
    textAlign: 'right',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
