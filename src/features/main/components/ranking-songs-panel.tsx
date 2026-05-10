import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as ExpoFileSystem from 'expo-file-system/legacy';

import {
  ResolvedSongAssets,
  songAssetResolverService,
} from '@/src/features/player/services/song-asset-resolver.service';
import { songCacheService } from '@/src/features/player/services/song-cache.service';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';
import { SongDto } from '@/src/services/song/song.types';

import SongLikeIcon from '@/assets/images/songPrefab/song-like-icon.svg';
import SongLikedIcon from '@/assets/images/songPrefab/song-liked-icon.svg';
import SongReadyIcon from '@/assets/images/songPrefab/song-ready-icon.svg';

const SONG_TITLE_BACKGROUND = require('@/assets/images/songPrefab/song-title-bg-slc.png');

import { CustomKeyboard } from '@/src/features/main/components/custom-keyboard';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type LanguageTab = {
  label: string;
  value?: string;
};

type SongActionStatus = {
  phase: 'preparing' | 'downloading';
  progress?: number;
};

type SongActionStatusMap = Record<string, SongActionStatus | undefined>;

const PAGE_SIZE = 20;

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

function formatArtists(artists: SongDto['artists']) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return '未知歌手';
  }

  return artists
    .map((artist) => {
      if (typeof artist === 'string') {
        return artist;
      }

      return artist.name;
    })
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

function getTotalPages(total: number) {
  if (total <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

function getFileExtensionFromS3Key(key?: string) {
  if (!key) {
    return 'mkv';
  }

  const filename = key.split('/').pop() || '';
  const extension = filename.split('.').pop();

  if (!extension || extension.length > 8) {
    return 'mkv';
  }

  return extension;
}

function calculateDownloadProgress(totalBytesWritten: number, totalBytesExpectedToWrite: number) {
  if (totalBytesExpectedToWrite <= 0) {
    return 0;
  }

  const progress = Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100);

  return Math.max(0, Math.min(progress, 100));
}

function getInsertButtonText(status?: SongActionStatus) {
  if (!status) {
    return '插播';
  }

  if (status.phase === 'preparing') {
    return '準備中';
  }

  if (status.phase === 'downloading') {
    const progress = status.progress ?? 0;
    return `下載中 ${progress}%`;
  }

  return '插播';
}

function createPlaybackQueueItem({
  song,
  localVideoUri,
  artistText,
}: {
  song: SongDto;
  localVideoUri: string;
  artistText?: string;
}) {
  return {
    queueId: `${song._id}-${Date.now()}`,
    songId: song._id,
    song,
    title: song.title,
    artistText,
    localVideoUri,
    status: 'ready' as const,
    createdAt: Date.now(),
  };
}

export function RankingSongsPanel({ visible, onClose }: Props) {
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTab>(LANGUAGE_TABS[0]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [resolvingSongId, setResolvingSongId] = useState<string | null>(null);
  const [resolvedSongAsset, setResolvedSongAsset] = useState<ResolvedSongAssets | null>(null);

  const enqueueSong = usePlaybackQueueStore((state) => state.enqueue);
  const enqueueNextSong = usePlaybackQueueStore((state) => state.enqueueNext);

  const [songActionStatusMap, setSongActionStatusMap] = useState<SongActionStatusMap>({});

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalPages = useMemo(() => getTotalPages(total), [total]);

  const hasMore = useMemo(() => {
    if (total === 0) {
      return false;
    }

    return songs.length < total;
  }, [songs.length, total]);

  const loadSongs = useCallback(
    async ({ targetPage, replace }: { targetPage: number; replace: boolean }) => {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Missing access token.');
      }

      const response = await songClient.getSongs({
        token,
        params: {
          page: targetPage,
          limit: PAGE_SIZE,
          sortBy: 'playCount',
          order: 'desc',

          // 後端 getSongs 使用 lan 過濾語系。
          // 如果你的後端語系代碼不是 zh / yue / ms / jp / en，請只改 LANGUAGE_TABS 的 value。
          lan: selectedLanguage.value,
        },
      });

      setTotal(response.total);
      setPage(response.page);

      setSongs((previousSongs) => {
        if (replace) {
          return response.songs;
        }

        const existingIds = new Set(previousSongs.map((song) => song._id));
        const newSongs = response.songs.filter((song) => !existingIds.has(song._id));

        return [...previousSongs, ...newSongs];
      });
    },
    [selectedLanguage.value],
  );

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage('');
      setIsInitialLoading(true);

      await loadSongs({
        targetPage: 1,
        replace: true,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsInitialLoading(false);
    }
  }, [loadSongs]);

  const loadNextPage = useCallback(async () => {
    if (isInitialLoading || isLoadingMore || !hasMore) {
      return;
    }

    try {
      setErrorMessage('');
      setIsLoadingMore(true);

      await loadSongs({
        targetPage: page + 1,
        replace: false,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isInitialLoading, isLoadingMore, loadSongs, page]);

  const handlePressLanguage = useCallback((tab: LanguageTab) => {
    setSelectedLanguage(tab);
  }, []);

  /*
    點擊歌曲
    ↓
    有 cache：直接加入播放隊列
    ↓
    沒 cache：下載完成後加入播放隊列
  */
  const handlePressSong = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      try {
        setErrorMessage('');

        setSongActionStatusMap((previous) => ({
          ...previous,
          [songId]: {
            phase: 'preparing',
          },
        }));

        const cachedSong = await songCacheService.getCachedSong(songId);

        if (cachedSong?.videoUri) {
          enqueueSong(
            createPlaybackQueueItem({
              song,
              artistText: formatArtists(song.artists),
              localVideoUri: cachedSong.videoUri,
            }),
          );

          return;
        }

        const resolvedAssets = await songAssetResolverService.resolveFromS3Title({
          songId,
          title: song.title,
        });

        setSongActionStatusMap((previous) => ({
          ...previous,
          [songId]: {
            phase: 'downloading',
            progress: 0,
          },
        }));

        const songDir = await songCacheService.ensureSongDir(songId);
        const extension = getFileExtensionFromS3Key(resolvedAssets.s3Key);
        const targetUri = `${songDir}video.${extension}`;

        let lastProgress = -1;

        const downloadResumable = ExpoFileSystem.createDownloadResumable(
          resolvedAssets.videoUrl,
          targetUri,
          {},
          (downloadProgress) => {
            const progress = calculateDownloadProgress(
              downloadProgress.totalBytesWritten,
              downloadProgress.totalBytesExpectedToWrite,
            );

            if (progress === lastProgress) {
              return;
            }

            lastProgress = progress;

            setSongActionStatusMap((previous) => ({
              ...previous,
              [songId]: {
                phase: 'downloading',
                progress,
              },
            }));
          },
        );

        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult?.uri) {
          throw new Error('Download failed: missing local uri.');
        }

        await songCacheService.saveCachedSong(songId, {
          songId,
          videoUri: downloadResult.uri,
          downloadedAt: Date.now(),
          totalBytes: resolvedAssets.size,
        });

        enqueueSong(
          createPlaybackQueueItem({
            song,
            artistText: formatArtists(song.artists),
            localVideoUri: downloadResult.uri,
          }),
        );
      } catch (error) {
        console.log('[RankingSongsPanel] handlePressSong failed:', error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setSongActionStatusMap((previous) => ({
          ...previous,
          [songId]: undefined,
        }));
      }
    },
    [enqueueSong],
  );

  const handlePressInsert = useCallback(
    async (song: SongDto) => {
      const songId = song._id;

      try {
        setErrorMessage('');

        setSongActionStatusMap((previous) => ({
          ...previous,
          [songId]: {
            phase: 'preparing',
          },
        }));

        console.log('[RankingSongsPanel] insert preparing:', {
          songId,
          title: song.title,
        });

        const cachedSong = await songCacheService.getCachedSong(songId);

        if (cachedSong?.videoUri) {
          console.log('[RankingSongsPanel] insert song already cached:', {
            songId,
            cachedSong,
          });

          enqueueNextSong(
            createPlaybackQueueItem({
              song,
              artistText: formatArtists(song.artists),
              localVideoUri: cachedSong.videoUri,
            }),
          );

          return;
        }

        const resolvedAssets = await songAssetResolverService.resolveFromS3Title({
          songId,
          title: song.title,
        });

        console.log('[RankingSongsPanel] insert resolved S3 signed url:', {
          songId,
          title: song.title,
          s3Key: resolvedAssets.s3Key,
          videoUrl: resolvedAssets.videoUrl,
        });

        setResolvedSongAsset(resolvedAssets);

        setSongActionStatusMap((previous) => ({
          ...previous,
          [songId]: {
            phase: 'downloading',
            progress: 0,
          },
        }));

        const songDir = await songCacheService.ensureSongDir(songId);
        const extension = getFileExtensionFromS3Key(resolvedAssets.s3Key);
        const targetUri = `${songDir}video.${extension}`;

        let lastProgress = -1;

        const downloadResumable = ExpoFileSystem.createDownloadResumable(
          resolvedAssets.videoUrl,
          targetUri,
          {},
          (downloadProgress) => {
            const progress = calculateDownloadProgress(
              downloadProgress.totalBytesWritten,
              downloadProgress.totalBytesExpectedToWrite,
            );

            if (progress === lastProgress) {
              return;
            }

            lastProgress = progress;

            setSongActionStatusMap((previous) => ({
              ...previous,
              [songId]: {
                phase: 'downloading',
                progress,
              },
            }));
          },
        );

        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult?.uri) {
          throw new Error('Download failed: missing local uri.');
        }

        await songCacheService.saveCachedSong(songId, {
          songId,
          videoUri: downloadResult.uri,
          downloadedAt: Date.now(),
          totalBytes: resolvedAssets.size,
        });

        console.log('[RankingSongsPanel] insert download completed:', {
          songId,
          localUri: downloadResult.uri,
        });

        enqueueNextSong(
          createPlaybackQueueItem({
            song,
            artistText: formatArtists(song.artists),
            localVideoUri: downloadResult.uri,
          }),
        );
      } catch (error) {
        console.log('[RankingSongsPanel] handlePressInsert failed:', error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setSongActionStatusMap((previous) => ({
          ...previous,
          [songId]: undefined,
        }));
      }
    },
    [enqueueNextSong],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSongs([]);
    setPage(1);
    setTotal(0);
    loadFirstPage();
  }, [loadFirstPage, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panelLayer}>
      <View style={styles.panel}>
        <View style={styles.leftArea}>
          <View style={styles.leftTopRow}>
            <View style={styles.titleAnchor}>
              <Image
                source={SONG_TITLE_BACKGROUND}
                style={styles.titleBackgroundImage}
                resizeMode="contain"
              />

              <Text style={styles.title}>排行</Text>
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

            {isInitialLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>載入排行榜中</Text>
              </View>
            ) : (
              <FlatList
                data={songs}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                onEndReached={loadNextPage}
                onEndReachedThreshold={0.35}
                renderItem={({ item }) => (
                  // <View style={styles.songRow}>
                  //   <View style={styles.songIconBox}>
                  //     <SongReadyIcon width={32} height={32} />
                  //   </View>
                  //   <Text style={styles.songTitle} numberOfLines={1}>
                  //     {truncateText(item.title, 11)}
                  //   </Text>

                  //   <Text style={styles.artistText} numberOfLines={1}>
                  //     {truncateText(formatArtists(item.artists), 5)}
                  //   </Text>

                  //   <Pressable style={styles.favoriteButton}>
                  //     {item.isCollected ? (
                  //       <SongLikedIcon width={42} height={42} />
                  //     ) : (
                  //       <SongLikeIcon width={42} height={42} />
                  //     )}
                  //   </Pressable>

                  //   <Pressable style={styles.insertButton}>
                  //     <Text style={styles.insertText}>插播</Text>
                  //   </Pressable>
                  // </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.songRow,
                      pressed && styles.songRowPressed,
                      songActionStatusMap[item._id] && styles.songRowResolving,
                    ]}
                    onPress={() => handlePressInsert(item)}
                  >
                    <View style={styles.songIconBox}>
                      <SongReadyIcon width={32} height={32} />
                    </View>

                    <Text style={styles.songTitle} numberOfLines={1}>
                      {truncateText(item.title, 11)}
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
                        handlePressInsert(item);
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
                    <Text style={styles.emptyText}>目前沒有歌曲資料</Text>
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
          <CustomKeyboard value={searchKeyword} onChangeText={setSearchKeyword} onClose={onClose} />
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
    // backgroundColor: 'red',
  },

  titleAnchor: {
    position: 'relative',
    marginRight: 28,
    justifyContent: 'center',
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
