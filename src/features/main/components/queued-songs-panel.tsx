import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

import { useQueuedSongsPanelStore } from '@/src/features/main/store/queued-songs-panel.store';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { useSongDownloadStatusStore } from '@/src/features/player/stores/song-download-status.store';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { playlistClient } from '@/src/services/playlist/playlist-client';

import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';

type PanelTab = 'queued' | 'downloading';

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

  const { cancelSongDownload } = useInsertSongPlayback();

  const currentItem = usePlaybackQueueStore((state) => state.currentItem);
  const queue = usePlaybackQueueStore((state) => state.queue);
  const moveToNext = usePlaybackQueueStore((state) => state.moveToNext);

  const downloadStatusMap = useSongDownloadStatusStore((state) => state.statusMap);

  const [activeTab, setActiveTab] = useState<PanelTab>('queued');
  const [interjectingQueueIdMap, setInterjectingQueueIdMap] = useState<Record<string, boolean>>({});

  const displayQueue = currentItem ? [currentItem, ...queue] : queue;

  const downloadingItems = useMemo(() => {
    return Object.entries(downloadStatusMap)
      .map(([songId, status]) => ({
        songId,
        status,
      }))
      .filter((item) => Boolean(item.status))
      .sort((a, b) => {
        const aCreatedAt = a.status?.createdAt ?? 0;
        const bCreatedAt = b.status?.createdAt ?? 0;

        return aCreatedAt - bCreatedAt;
      });
  }, [downloadStatusMap]);

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

      {/* <View style={styles.panel}>
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
      </View> */}

      <View style={styles.panel}>
        <View style={styles.tabHeader}>
          <Pressable
            style={[styles.tabButton, activeTab === 'queued' && styles.tabButtonActive]}
            onPress={() => setActiveTab('queued')}
          >
            <Text style={[styles.tabText, activeTab === 'queued' && styles.tabTextActive]}>
              已點歌曲
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'downloading' && styles.tabButtonActive]}
            onPress={() => setActiveTab('downloading')}
          >
            <Text style={[styles.tabText, activeTab === 'downloading' && styles.tabTextActive]}>
              正在下載
            </Text>

            {downloadingItems.length > 0 ? (
              <View style={styles.downloadCountBadge}>
                <Text style={styles.downloadCountText}>{downloadingItems.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {activeTab === 'queued' ? (
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
                const isInterjecting = Boolean(interjectingQueueIdMap[item.queueId]);

                return (
                  <View
                    key={item.queueId}
                    style={[styles.songRow, isCurrent && styles.currentSongRow]}
                  >
                    <View style={styles.songIconBox}>
                      {isCurrent ? (
                        <Image
                          source={require('@/assets/images/songPrefab/playing/playing.webp')}
                          style={styles.playingIcon}
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

                    {!isCurrent ? (
                      <Pressable
                        style={[
                          styles.interjectButton,
                          isInterjecting && styles.interjectButtonDisabled,
                        ]}
                        disabled={isInterjecting}
                        onPress={() => handleInterjectQueueItem(item.queueId, item.songId)}
                      >
                        <Text style={styles.interjectButtonText}>
                          {isInterjecting ? '處理中' : '插播'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {downloadingItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>目前尚未下載的歌曲</Text>
              </View>
            ) : (
              downloadingItems.map(({ songId, status }) => {
                if (!status) {
                  return null;
                }

                const songTitle = truncateText(formatDisplaySongTitle(status.song.title), 14);
                const artistText = truncateText(
                  Array.isArray(status.song.artists)
                    ? status.song.artists
                        .map((artist) => {
                          if (typeof artist === 'string') {
                            return artist;
                          }

                          return artist?.name;
                        })
                        .filter(Boolean)
                        .join(' / ')
                    : '未知歌手',
                  17,
                );
                const progress = Math.max(0, Math.min(status.progress, 100));
                const statusText =
                  status.phase === 'preparing' ? '準備下載中' : `下載中 ${progress}%`;

                const speedText = status.speedText ?? '-- MB/s';
                // return (
                //   <View key={songId} style={styles.downloadRow}>
                //     <View style={styles.songIconBox}>
                //       <SongReadyIcon width={48} height={48} />
                //     </View>

                //     <View style={styles.downloadTextGroup}>
                //       <Text style={styles.songTitle} numberOfLines={1}>
                //         {songTitle}
                //       </Text>

                //       <Text style={styles.artistText} numberOfLines={1}>
                //         {artistText}
                //       </Text>

                //       <Text style={styles.downloadStatusText}>{statusText}</Text>

                //       <View style={styles.progressTrack}>
                //         <View style={[styles.progressFill, { width: `${progress}%` }]} />
                //       </View>
                //     </View>
                //   </View>
                // );

                return (
                  <View key={songId} style={styles.downloadRow}>
                    <View style={styles.songIconBox}>
                      <SongReadyIcon width={48} height={48} />
                    </View>

                    <View style={styles.downloadSongInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>
                        {songTitle}
                      </Text>

                      <Text style={styles.artistText} numberOfLines={1}>
                        {artistText}
                      </Text>
                    </View>

                    <View style={styles.downloadStatusGroup}>
                      <Text style={styles.downloadStatusText}>{statusText}</Text>

                      <Text style={styles.downloadSpeedText}>{speedText}</Text>
                    </View>

                    <Pressable
                      style={styles.cancelDownloadButton}
                      onPress={() => {
                        console.log('[QueuedSongsPanel] press cancel download:', songId);

                        cancelSongDownload(songId).catch((error) => {
                          console.log('[QueuedSongsPanel] cancel download failed:', {
                            songId,
                            error,
                          });
                        });
                      }}
                      hitSlop={10}
                    >
                      <Text style={styles.cancelDownloadButtonText}>×</Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
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
    paddingTop: 22,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(24, 24, 24, 0.95)',
    marginBottom: 70,
    overflow: 'hidden',
  },

  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    marginBottom: 18,
  },

  tabButton: {
    minHeight: 44,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  tabButtonActive: {
    borderBottomColor: '#FFFFFF',
  },

  tabText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 22,
    fontWeight: '900',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  downloadCountBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5A5F',
  },

  downloadCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
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

  playingIcon: {
    width: 48,
    height: 48,
  },

  songTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },

  downloadTextGroup: {
    flex: 1,
  },

  // downloadRow: {
  //   minHeight: 88,
  //   marginBottom: 12,
  //   paddingHorizontal: 16,
  //   paddingVertical: 14,
  //   borderRadius: 18,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: 14,
  //   backgroundColor: 'rgba(255, 255, 255, 0.08)',
  // },

  downloadSongInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  downloadStatusGroup: {
    minWidth: 96,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  // downloadStatusText: {
  //   color: '#FFFFFF',
  //   fontSize: 14,
  //   fontWeight: '900',
  // },

  downloadSpeedText: {
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 12,
    fontWeight: '700',
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

  interjectButton: {
    minWidth: 66,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#7C3AED',
  },

  interjectButtonDisabled: {
    opacity: 0.5,
  },

  interjectButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  currentBadge: {
    minWidth: 66,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  downloadRow: {
    height: 68,
    borderRadius: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  downloadStatusText: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  progressTrack: {
    marginTop: 9,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  cancelDownloadButton: {
    width: 34,
    height: 34,
    marginLeft: 10,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
  
  cancelDownloadButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    transform: [{ translateY: -1 }],
  },
});
