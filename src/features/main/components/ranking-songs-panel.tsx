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

export function RankingSongsPanel({ visible, onClose }: Props) {
  const [songs, setSongs] = useState<SongDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTab>(LANGUAGE_TABS[0]);
  const [searchKeyword, setSearchKeyword] = useState('');

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
                  <View style={styles.songRow}>
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

                    <Pressable style={styles.insertButton}>
                      <Text style={styles.insertText}>插播</Text>
                    </Pressable>
                  </View>
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
    flex: 1.15,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  artistText: {
    flex: 0.72,
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
    width: 70,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insertText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
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
});
