import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';
import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

// import { authClient } from '@/src/services/auth/auth-client';
import { getAccessToken } from '@/src/services/auth/auth-token-store';

import { useSongListPreloadStore } from '@/src/features/song/store/song-list-preload.store';

import { songClient } from '@/src/services/song/song-client';
import { pingHealth } from '@/src/services/health/health-client';
// import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

import { HOME_COPY } from '@/src/features/main/i18n/home-copy';
import { useAppLanguageStore } from '@/src/shared/i18n/language.store';

import { CachedSongsPanel } from '@/src/features/main/components/cached-songs-panel';
import { CategoryPanel } from '@/src/features/main/components/category-panel';
import { HomeSidePanel } from '@/src/features/main/components/home-side-panel';
import { MySongsPanel } from '@/src/features/main/components/my-songs-panel';
import { NewSongsPanel } from '@/src/features/main/components/new-songs-panel';
import { RankingSongsPanel } from '@/src/features/main/components/ranking-songs-panel';
import { SingerPanel } from '@/src/features/main/components/singer-panel';
import { SettingsPanel } from '@/src/features/main/components/settings-panel';

import { useHomePanelStore } from '@/src/features/main/store/home-panel.store';

// type HomeCard = {
//   title: string;
//   image: ImageSourcePropType;
//   foregroundImage?: ImageSourcePropType;
//   foregroundStyle?: ViewStyle;
// };

type HomeCardId = 'singer' | 'category' | 'newsongs' | 'ranking';

type HomeCard = {
  id: HomeCardId;
  titleKey: keyof (typeof HOME_COPY)['zh-TW'];
  image: ImageSourcePropType;
  foregroundImage?: ImageSourcePropType;
  foregroundStyle?: ViewStyle;
};

// const HOME_CARDS: HomeCard[] = [
//   {
//     title: '歌手',
//     image: require('@/assets/images/home-singer-bg.png'),
//     foregroundImage: require('@/assets/images/payment-singer-front.png'),
//     foregroundStyle: {
//       left: -120,
//       bottom: -5,
//       width: 244,
//       height: 232,
//     },
//   },
//   {
//     title: '分類',
//     image: require('@/assets/images/home-categ-bg.png'),
//     foregroundImage: require('@/assets/images/home-categories-bg-front.png'),
//     foregroundStyle: {
//       left: -50,
//       bottom: -35,
//       width: 212,
//       height: 195,
//     },
//   },
//   {
//     title: '新歌',
//     image: require('@/assets/images/home-new-bg.png'),
//     foregroundImage: require('@/assets/images/home-new-bg-front.png'),
//     foregroundStyle: {
//       left: -29,
//       bottom: -15,
//       width: 179,
//       height: 269,
//     },
//   },
//   {
//     title: '排行榜',
//     image: require('@/assets/images/home-ranger-bg.png'),
//     foregroundImage: require('@/assets/images/home-ranger-bg-front.png'),
//     foregroundStyle: {
//       left: -40,
//       bottom: 0,
//       width: 264,
//       height: 264,
//     },
//   },
// ];

const HOME_CARDS: HomeCard[] = [
  {
    id: 'singer',
    titleKey: 'singer',
    image: require('@/assets/images/home-singer-bg.png'),
    foregroundImage: require('@/assets/images/payment-singer-front.png'),
    foregroundStyle: {
      left: -120,
      bottom: -5,
      width: 244,
      height: 232,
    },
  },
  {
    id: 'category',
    titleKey: 'category',
    image: require('@/assets/images/home-categ-bg.png'),
    foregroundImage: require('@/assets/images/home-categories-bg-front.png'),
    foregroundStyle: {
      left: -50,
      bottom: -35,
      width: 212,
      height: 195,
    },
  },
  {
    id: 'newsongs',
    titleKey: 'newSongs',
    image: require('@/assets/images/home-new-bg.png'),
    foregroundImage: require('@/assets/images/home-new-bg-front.png'),
    foregroundStyle: {
      left: -29,
      bottom: -15,
      width: 179,
      height: 269,
    },
  },
  {
    id: 'ranking',
    titleKey: 'ranking',
    image: require('@/assets/images/home-ranger-bg.png'),
    foregroundImage: require('@/assets/images/home-ranger-bg-front.png'),
    foregroundStyle: {
      left: -40,
      bottom: 0,
      width: 264,
      height: 264,
    },
  },
];

export default function HomeScreen() {
  const language = useAppLanguageStore((state) => state.language);
  const copy = HOME_COPY[language];

  const isCjkLanguage = language === 'zh-TW' || language === 'zh-CN';

  // const [isCategoryPanelVisible, setIsCategoryPanelVisible] = useState(false);
  // const [isNewSongsPanelVisible, setIsNewSongsPanelVisible] = useState(false);
  // const [isRankingSongsPanelVisible, setIsRankingSongsPanelVisible] = useState(false);
  // const [isSingerPanelVisible, setIsSingerPanelVisible] = useState(false);
  // const [isCachedSongsPanelVisible, setIsCachedSongsPanelVisible] = useState(false);
  // const [isMySongsPanelVisible, setIsMySongsPanelVisible] = useState(false);

  const activePanel = useHomePanelStore((state) => state.activePanel);
  const openPanel = useHomePanelStore((state) => state.openPanel);
  const closePanel = useHomePanelStore((state) => state.closePanel);

  const setMainBackgroundMode = useMainBackgroundStore((state) => state.setMode);
  const resetMainBackgroundMode = useMainBackgroundStore((state) => state.resetMode);

  // const isFullscreenVideoVisible = useFullscreenVideoStore((state) => state.isVisible);
  const isFullscreenVideoVisible = useFullscreenVideoStore((state) => state.mode === 'fullscreen');

  // const shouldHideHomeContent =
  //   isSingerPanelVisible ||
  //   isCategoryPanelVisible ||
  //   isNewSongsPanelVisible ||
  //   isRankingSongsPanelVisible ||
  //   isCachedSongsPanelVisible ||
  //   isMySongsPanelVisible;

  const shouldHideHomeContent = activePanel !== null;

  const setVideoBlockedByPanel = useFullscreenVideoStore((state) => state.setBlockedByPanel);

  const appStateRef = useRef(AppState.currentState);

  const NORMAL_POLLING_INTERVAL = 1000 * 60 * 1;
  const HEALTH_TIMEOUT_MS = 8000;

  useEffect(() => {
    setVideoBlockedByPanel(shouldHideHomeContent);

    return () => {
      setVideoBlockedByPanel(false);
    };
  }, [setVideoBlockedByPanel, shouldHideHomeContent]);

  useEffect(() => {
    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let failureCount = 0;
    let isHealthChecking = false;

    const clearRetryTimeout = () => {
      if (!retryTimeoutId) {
        return;
      }

      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    };

    const getRetryDelayMs = () => {
      if (failureCount === 1) {
        return 1000 * 10;
      }

      if (failureCount === 2) {
        return 1000 * 6;
      }

      if (failureCount <= 5) {
        return 1000 * 3;
      }

      return 1000 * 15;
    };

    async function warmUpHealth(reason: 'initial' | 'interval' | 'foreground' | 'retry') {
      if (isCancelled) {
        return;
      }

      if (isHealthChecking) {
        // useDebugLogStore.getState().addLog(
        //   'Home',
        //   'health warm-up skipped: already running',
        //   {
        //     reason,
        //   },
        //   'warning',
        // );
        return;
      }

      const currentAppState = AppState.currentState;

      if (currentAppState !== 'active') {
        // useDebugLogStore.getState().addLog(
        //   'Home',
        //   'health warm-up skipped: app not active',
        //   {
        //     reason,
        //     appState: currentAppState,
        //   },
        //   'warning',
        // );
        return;
      }

      isHealthChecking = true;

      try {
        // useDebugLogStore.getState().addLog(
        //   'Home',
        //   'health warm-up start',
        //   {
        //     reason,
        //     failureCount,
        //   },
        //   'info',
        // );

        const result = await pingHealth({
          timeoutMs: HEALTH_TIMEOUT_MS,
        });

        if (isCancelled) {
          return;
        }

        failureCount = 0;
        clearRetryTimeout();

        // useDebugLogStore.getState().addLog(
        //   'Home',
        //   'health warm-up success',
        //   {
        //     reason,
        //     ok: result.ok,
        //     now: result.now ?? result.t,
        //   },
        //   'success',
        // );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        failureCount += 1;

        const retryDelayMs = getRetryDelayMs();

        // useDebugLogStore.getState().addLog(
        //   'Home',
        //   'health warm-up failed',
        //   {
        //     reason,
        //     failureCount,
        //     retryDelayMs,
        //     error: error instanceof Error ? error.message : String(error),
        //   },
        //   'error',
        // );

        clearRetryTimeout();

        retryTimeoutId = setTimeout(() => {
          warmUpHealth('retry');
        }, retryDelayMs);

        // useDebugLogStore.getState().addLog(
        //   'Home',
        //   'health warm-up retry scheduled',
        //   {
        //     failureCount,
        //     retryDelayMs,
        //   },
        //   'warning',
        // );
      } finally {
        isHealthChecking = false;
      }
    }

    const startWarmUp = () => {
      if (intervalId) {
        return;
      }

      intervalId = setInterval(() => {
        warmUpHealth('interval');
      }, NORMAL_POLLING_INTERVAL);
    };

    const stopWarmUp = () => {
      if (!intervalId) {
        return;
      }

      clearInterval(intervalId);
      intervalId = null;
    };

    warmUpHealth('initial');
    startWarmUp();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // useDebugLogStore.getState().addLog(
      //   'Home',
      //   'app state changed',
      //   {
      //     previousAppState,
      //     appState: nextAppState,
      //   },
      //   'info',
      // );

      const didReturnToForeground = previousAppState !== 'active' && nextAppState === 'active';

      if (didReturnToForeground) {
        warmUpHealth('foreground');
        startWarmUp();
        return;
      }

      if (nextAppState !== 'active') {
        stopWarmUp();
        clearRetryTimeout();
      }
    });

    return () => {
      isCancelled = true;
      stopWarmUp();
      clearRetryTimeout();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function preloadHomeSongLists() {
      // useDebugLogStore.getState().addLog('Home', 'preload song lists start');

      try {
        const token = await getAccessToken();

        if (!token) {
          // useDebugLogStore.getState().addLog('Home', 'preload skipped: missing token');
          return;
        }

        const [rankingResult, newSongsResult] = await Promise.allSettled([
          songClient.getSongs({
            token,
            params: {
              page: 1,
              limit: 20,
              sortBy: 'playCount',
              order: 'desc',
            },
          }),
          songClient.getSongs({
            token,
            params: {
              page: 1,
              limit: 20,
              sortBy: 'createdAt',
              order: 'desc',
            },
          }),
        ]);

        if (isCancelled) {
          return;
        }

        const preloadStore = useSongListPreloadStore.getState();

        if (rankingResult.status === 'fulfilled') {
          preloadStore.setRankingSongsCache({
            songs: rankingResult.value.songs,
            page: rankingResult.value.page,
            limit: rankingResult.value.limit,
            total: rankingResult.value.total,
            cachedAt: Date.now(),
          });
        }

        if (newSongsResult.status === 'fulfilled') {
          preloadStore.setNewSongsCache({
            songs: newSongsResult.value.songs,
            page: newSongsResult.value.page,
            limit: newSongsResult.value.limit,
            total: newSongsResult.value.total,
            cachedAt: Date.now(),
          });
        }

        // useDebugLogStore.getState().addLog('Home', 'preload song lists finished', {
        //   rankingStatus: rankingResult.status,
        //   rankingCount:
        //     rankingResult.status === 'fulfilled' ? rankingResult.value.songs.length : undefined,
        //   rankingError:
        //     rankingResult.status === 'rejected'
        //       ? rankingResult.reason instanceof Error
        //         ? rankingResult.reason.message
        //         : String(rankingResult.reason)
        //       : undefined,
        //   newSongsStatus: newSongsResult.status,
        //   newSongsCount:
        //     newSongsResult.status === 'fulfilled' ? newSongsResult.value.songs.length : undefined,
        //   newSongsError:
        //     newSongsResult.status === 'rejected'
        //       ? newSongsResult.reason instanceof Error
        //         ? newSongsResult.reason.message
        //         : String(newSongsResult.reason)
        //       : undefined,
        // });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        // useDebugLogStore.getState().addLog('Home', 'preload song lists failed', {
        //   error: error instanceof Error ? error.message : String(error),
        // });
      }
    }

    preloadHomeSongLists();

    return () => {
      isCancelled = true;
    };
  }, []);

  // function handlePressHomeCard(title: string) {
  //   if (title === '歌手') {
  //     setMainBackgroundMode('singer');
  //     // setIsSingerPanelVisible(true);
  //     openPanel('singer');
  //     return;
  //   }

  //   if (title === '分類') {
  //     setMainBackgroundMode('category');
  //     // setIsCategoryPanelVisible(true);
  //     openPanel('category');
  //     return;
  //   }

  //   if (title === '新歌') {
  //     setMainBackgroundMode('newsongs');
  //     // setIsNewSongsPanelVisible(true);
  //     openPanel('newsongs');
  //     return;
  //   }

  //   if (title === '排行榜') {
  //     setMainBackgroundMode('ranking');
  //     // setIsRankingSongsPanelVisible(true);
  //     openPanel('ranking');
  //     return;
  //   }
  // }

  function handlePressHomeCard(cardId: HomeCardId) {
    if (cardId === 'singer') {
      setMainBackgroundMode('singer');
      openPanel('singer');
      return;
    }

    if (cardId === 'category') {
      setMainBackgroundMode('category');
      openPanel('category');
      return;
    }

    if (cardId === 'newsongs') {
      setMainBackgroundMode('newsongs');
      openPanel('newsongs');
      return;
    }

    if (cardId === 'ranking') {
      setMainBackgroundMode('ranking');
      openPanel('ranking');
      return;
    }
  }

  return (
    <View style={styles.page}>
      <View
        pointerEvents={shouldHideHomeContent ? 'none' : 'auto'}
        style={[styles.homeContentLayer, shouldHideHomeContent && styles.homeContentLayerHidden]}
      >
        <View
          pointerEvents={isFullscreenVideoVisible ? 'none' : 'auto'}
          style={[styles.cardSection, isFullscreenVideoVisible && styles.cardSectionHidden]}
        >
          {HOME_CARDS.map((item) => {
            const title = copy[item.titleKey];
            const titleParts = isCjkLanguage ? title.split('') : [title];

            return (
              <View key={item.id} style={styles.cardWrapper}>
                <Pressable
                  style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
                  onPress={() => handlePressHomeCard(item.id)}
                >
                  <ImageBackground
                    source={item.image}
                    style={styles.menuCardBackground}
                    imageStyle={styles.menuCardBackgroundImage}
                    resizeMode="cover"
                  >
                    <View style={styles.menuCardOverlay}>
                      <View
                        style={[
                          styles.verticalTitleGroup,
                          !isCjkLanguage && styles.verticalTitleGroupCompact,
                        ]}
                      >
                        {titleParts.map((text, index) => (
                          <Text
                            key={`${item.id}-${index}`}
                            style={[
                              styles.menuCardTitle,
                              !isCjkLanguage && styles.menuCardTitleCompact,
                            ]}
                          >
                            {text}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </ImageBackground>
                </Pressable>

                {item.foregroundImage ? (
                  <View
                    pointerEvents="none"
                    style={[styles.cardForegroundLayer, item.foregroundStyle]}
                  >
                    <Image
                      source={item.foregroundImage}
                      style={styles.cardForegroundImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.sidePanel}>
          {/* <HomeSidePanel
            videoAsset={require('@/assets/demo/video/Test.mkv')}
            onOpenMySongsPanel={() => {
              setMainBackgroundMode('category');
              setIsMySongsPanelVisible(true);
            }}
            onOpenCachedSongsPanel={() => {
              setMainBackgroundMode('category');
              setIsCachedSongsPanelVisible(true);
            }}
          /> */}
          <HomeSidePanel
            onOpenMySongsPanel={() => {
              setMainBackgroundMode('category');
              openPanel('mySongs');
            }}
            onOpenCachedSongsPanel={() => {
              setMainBackgroundMode('category');
              openPanel('cachedSongs');
            }}
            onOpenSettingsPanel={async () => {
              setMainBackgroundMode('category');
              openPanel('mySetting');

              // try {
              //   const token = await getAccessToken();

              //   if (!token) {
              //     console.log('[Home] missing access token');
              //     return;
              //   }

              //   const billing = await authClient.billingSummary(token);

              //   console.log(
              //     '[Home] billing summary:',
              //     JSON.stringify(billing, null, 2),
              //   );
              // } catch (error) {
              //   console.log('[Home] failed to fetch billing summary:', error);
              // }
            }}
          />
        </View>
      </View>

      <CategoryPanel
        // visible={isCategoryPanelVisible}
        // onClose={() => {
        //   setIsCategoryPanelVisible(false);
        //   resetMainBackgroundMode();
        // }}
        visible={activePanel === 'category'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      />

      <NewSongsPanel
        // visible={isNewSongsPanelVisible}
        // onClose={() => {
        //   setIsNewSongsPanelVisible(false);
        //   resetMainBackgroundMode();
        // }}
        visible={activePanel === 'newsongs'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      />

      <RankingSongsPanel
        // visible={isRankingSongsPanelVisible}
        // onClose={() => {
        //   setIsRankingSongsPanelVisible(false);
        //   resetMainBackgroundMode();
        // }}
        visible={activePanel === 'ranking'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      />

      <SingerPanel
        // visible={isSingerPanelVisible}
        // onClose={() => {
        //   resetMainBackgroundMode();
        //   setIsSingerPanelVisible(false);
        // }}
        visible={activePanel === 'singer'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      />

      <CachedSongsPanel
        // visible={isCachedSongsPanelVisible}
        // onClose={() => {
        //   setIsCachedSongsPanelVisible(false);
        //   resetMainBackgroundMode();
        // }}
        visible={activePanel === 'cachedSongs'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      />

      <MySongsPanel
        // visible={isMySongsPanelVisible}
        // onClose={() => {
        //   setIsMySongsPanelVisible(false);
        //   resetMainBackgroundMode();
        // }}
        visible={activePanel === 'mySongs'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      />

      <SettingsPanel
        visible={activePanel === 'mySetting'}
        onClose={() => {
          closePanel();
          resetMainBackgroundMode();
        }}
      ></SettingsPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    // flexDirection: 'row',
    // alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 32,
  },

  homeContentLayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  homeContentLayerHidden: {
    opacity: 0,
  },

  cardSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 60,
  },

  cardWrapper: {
    width: 150,
    height: 480,
    position: 'relative',
  },

  menuCard: {
    width: 150,
    height: 480,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  menuCardBackground: {
    width: '100%',
    height: '100%',
  },

  menuCardBackgroundImage: {
    borderRadius: 25,
  },

  menuCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  menuCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 26,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  verticalTitleGroup: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },

  verticalTitleGroupCompact: {
    rowGap: 0,
    maxWidth: 130,
  },

  menuCardTitleCompact: {
    paddingTop: 20,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },

  menuCardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },

  cardForegroundLayer: {
    position: 'absolute',
    zIndex: 10,
  },

  cardForegroundImage: {
    width: '100%',
    height: '100%',
  },

  sidePanel: {
    width: 358,
  },

  cardSectionHidden: {
    opacity: 0,
  },
});
