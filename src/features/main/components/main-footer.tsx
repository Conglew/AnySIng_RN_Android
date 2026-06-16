import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { Href, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';

import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';
import { useHomePanelStore } from '@/src/features/main/store/home-panel.store';
import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';

import { useQueuedSongsPanelStore } from '@/src/features/main/store/queued-songs-panel.store';

import { useSongRequestQrPanelStore } from '@/src/features/main/store/song-request-qr-panel.store';

import { useAppLanguageStore } from '@/src/shared/i18n/language.store';
import { MAIN_FOOTER_COPY } from '@/src/features/main/i18n/main-footer-copy';

import FooterIcon1 from '@/assets/images/footer-icons-1.svg';
import FooterIcon2 from '@/assets/images/footer-icons-2.svg';
import FooterIcon3 from '@/assets/images/footer-icons-3.svg';
import FooterIcon4 from '@/assets/images/footer-icons-4.svg';
import FooterIcon5_1 from '@/assets/images/footer-icons-5-1.svg';
import FooterIcon5_2 from '@/assets/images/footer-icons-5-2.svg';
import FooterIcon6_1 from '@/assets/images/footer-icons-6-1.svg';
import FooterIcon6_2 from '@/assets/images/footer-icons-6-2.svg';
import FooterIcon7 from '@/assets/images/footer-icons-7.svg';
import FooterIcon8 from '@/assets/images/footer-icons-8.svg';
import FooterIcon9 from '@/assets/images/footer-icons-9.svg';
import ToolBarBg from '@/assets/images/footerBar/Tool-bar-BG.svg';
import ToolBarProgressDefault from '@/assets/images/footerBar/Tool-bar-prosee-default.svg';
import ToolBarProgress from '@/assets/images/footerBar/Tool-bar-prosee.svg';

type FooterAction = 'navigate' | 'togglePause' | 'toggleAudioTrack' | 'skipSong' | 'restartSong';

// type FooterItem = {
//   label: string;
//   route: Href;
//   Icon: ComponentType<SvgProps>;
//   action: FooterAction;
// };

type FooterLabelKey =
  | 'home'
  | 'songRequest'
  | 'skipSong'
  | 'pause'
  | 'vocal'
  | 'restart'
  | 'queued'
  | 'record';

type FooterItem = {
  labelKey: FooterLabelKey;
  route: Href;
  Icon: ComponentType<SvgProps>;
  action: FooterAction;
};

// const FOOTER_ITEMS: FooterItem[] = [
//   {
//     label: '主頁',
//     route: '/(tabs)/home',
//     Icon: FooterIcon1,
//     action: 'navigate',
//   },
//   {
//     label: '點歌',
//     route: '/(tabs)/two',
//     Icon: FooterIcon2,
//     action: 'navigate',
//   },
//   // {
//   //   label: '調音',
//   //   route: '/(tabs)/tuning' as Href,
//   //   Icon: FooterIcon3,
//   //   action: 'navigate',
//   // },
//   {
//     label: '切歌',
//     route: '/(tabs)/switch-song' as Href,
//     Icon: FooterIcon4,
//     action: 'skipSong',
//   },
//   {
//     label: '暫停',
//     route: '/(tabs)/pause' as Href,
//     Icon: FooterIcon5_1,
//     action: 'togglePause',
//   },
//   {
//     label: '原唱',
//     route: '/(tabs)/original' as Href,
//     Icon: FooterIcon6_2,
//     action: 'toggleAudioTrack',
//   },
//   {
//     label: '重唱',
//     route: '/(tabs)/restart' as Href,
//     Icon: FooterIcon7,
//     action: 'restartSong',
//   },
//   {
//     label: '已點',
//     route: '/(tabs)/queue' as Href,
//     Icon: FooterIcon8,
//     action: 'navigate',
//   },
//   {
//     label: '錄製',
//     route: '/(tabs)/record' as Href,
//     Icon: FooterIcon9,
//     action: 'navigate',
//   },
// ];

const FOOTER_ITEMS: FooterItem[] = [
  {
    labelKey: 'home',
    route: '/(tabs)/home',
    Icon: FooterIcon1,
    action: 'navigate',
  },
  {
    labelKey: 'songRequest',
    route: '/(tabs)/two',
    Icon: FooterIcon2,
    action: 'navigate',
  },
  {
    labelKey: 'skipSong',
    route: '/(tabs)/switch-song' as Href,
    Icon: FooterIcon4,
    action: 'skipSong',
  },
  {
    labelKey: 'pause',
    route: '/(tabs)/pause' as Href,
    Icon: FooterIcon5_1,
    action: 'togglePause',
  },
  {
    labelKey: 'vocal',
    route: '/(tabs)/original' as Href,
    Icon: FooterIcon6_2,
    action: 'toggleAudioTrack',
  },
  {
    labelKey: 'restart',
    route: '/(tabs)/restart' as Href,
    Icon: FooterIcon7,
    action: 'restartSong',
  },
  {
    labelKey: 'queued',
    route: '/(tabs)/queue' as Href,
    Icon: FooterIcon8,
    action: 'navigate',
  },
  {
    labelKey: 'record',
    route: '/(tabs)/record' as Href,
    Icon: FooterIcon9,
    action: 'navigate',
  },
];

export function MainFooter() {
  const pathname = usePathname();

  const [isSkipping, setIsSkipping] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isTogglingAudioTrack, setIsTogglingAudioTrack] = useState(false);
  const [footerWidth, setFooterWidth] = useState(0);

  const progressClipWidth = useRef(new Animated.Value(0)).current;

  const isSkippingRef = useRef(false);
  const isRestartingRef = useRef(false);
  const isTogglingAudioTrackRef = useRef(false);

  const isPaused = usePlayerControlStore((state) => state.isPaused);
  const audioTrackMode = usePlayerControlStore((state) => state.audioTrackMode);
  const togglePause = usePlayerControlStore((state) => state.togglePause);
  const toggleAudioTrackMode = usePlayerControlStore((state) => state.toggleAudioTrackMode);

  // const finishCurrentSong = usePlaybackQueueStore((state) => state.finishCurrent);
  // const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const { skipCurrent } = usePlaybackQueueActions();

  const restartCurrentSong = usePlayerControlStore((state) => state.restartCurrentSong);

  const router = useRouter();

  const closeHomePanel = useHomePanelStore((state) => state.closePanel);
  const activeHomePanel = useHomePanelStore((state) => state.activePanel);

  const resetMainBackgroundMode = useMainBackgroundStore((state) => state.resetMode);
  const closeFullscreen = useFullscreenVideoStore((state) => state.closeFullscreen);
  const showHomeMini = useFullscreenVideoStore((state) => state.showHomeMini);
  const setBlockedByPanel = useFullscreenVideoStore((state) => state.setBlockedByPanel);

  const videoMode = useFullscreenVideoStore((state) => state.mode);
  const setFooterMiniRect = useFullscreenVideoStore((state) => state.setFooterMiniRect);
  const playbackProgress = useFullscreenVideoStore((state) => state.playbackProgress);
  const isFullscreenChromeVisible = useFullscreenVideoStore(
    (state) => state.isFullscreenChromeVisible,
  );
  const showFullscreenChrome = useFullscreenVideoStore((state) => state.showFullscreenChrome);
  const restartFullscreenChromeAutoHideTimer = useFullscreenVideoStore(
    (state) => state.restartFullscreenChromeAutoHideTimer,
  );

  const recordSlotRef = useRef<View>(null);

  const measureFooterMiniTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFooterMiniRectRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const isSameMeasuredRect = useCallback(
    (
      a: { x: number; y: number; width: number; height: number } | null,
      b: { x: number; y: number; width: number; height: number },
    ) => {
      if (!a) {
        return false;
      }

      return (
        Math.round(a.x) === Math.round(b.x) &&
        Math.round(a.y) === Math.round(b.y) &&
        Math.round(a.width) === Math.round(b.width) &&
        Math.round(a.height) === Math.round(b.height)
      );
    },
    [],
  );

  const measureRecordSlot = useCallback(() => {
    if (measureFooterMiniTimerRef.current) {
      clearTimeout(measureFooterMiniTimerRef.current);
    }

    measureFooterMiniTimerRef.current = setTimeout(() => {
      const nodeHandle = findNodeHandle(recordSlotRef.current);

      if (!nodeHandle) {
        return;
      }

      UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
        const rect = {
          x,
          y,
          width,
          height,
        };

        if (isSameMeasuredRect(lastFooterMiniRectRef.current, rect)) {
          return;
        }

        lastFooterMiniRectRef.current = rect;
        setFooterMiniRect(rect);
      });

      measureFooterMiniTimerRef.current = null;
    }, 120);
  }, [isSameMeasuredRect, setFooterMiniRect]);

  useEffect(() => {
    return () => {
      if (measureFooterMiniTimerRef.current) {
        clearTimeout(measureFooterMiniTimerRef.current);
        measureFooterMiniTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      measureRecordSlot();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [measureRecordSlot]);

  const openQueuedSongsPanel = useQueuedSongsPanelStore((state) => state.openPanel);

  const openSongRequestQrPanel = useSongRequestQrPanelStore((state) => state.openPanel);

  const language = useAppLanguageStore((state) => state.language);
  const copy = MAIN_FOOTER_COPY[language];

  const shouldShowFooterBar = videoMode === 'fullscreen' && isFullscreenChromeVisible;

  const handleFooterTouchStart = useCallback(() => {
    if (videoMode !== 'fullscreen') {
      return;
    }

    if (!isFullscreenChromeVisible) {
      showFullscreenChrome();
      return;
    }

    restartFullscreenChromeAutoHideTimer();
  }, [
    isFullscreenChromeVisible,
    restartFullscreenChromeAutoHideTimer,
    showFullscreenChrome,
    videoMode,
  ]);

  // const progressBarWidth = footerWidth * playbackProgress;

  useEffect(() => {
    if (!shouldShowFooterBar) {
      return;
    }

    if (footerWidth <= 0) {
      progressClipWidth.setValue(0);
      return;
    }

    Animated.timing(progressClipWidth, {
      toValue: footerWidth * playbackProgress,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [footerWidth, playbackProgress, progressClipWidth, shouldShowFooterBar]);

  return (
    <View
      style={styles.footer}
      onTouchStart={handleFooterTouchStart}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);

        setFooterWidth((currentWidth) => {
          if (Math.round(currentWidth) === nextWidth) {
            return currentWidth;
          }

          return nextWidth;
        });
      }}
    >
      {shouldShowFooterBar ? (
        <View pointerEvents="none" style={styles.footerBarLayer}>
          <ToolBarBg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={styles.footerBarBgLayer}
          />

          <ToolBarProgressDefault
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={styles.footerBarProgressDefaultLayer}
          />

          {footerWidth > 0 ? (
            <Animated.View style={[styles.footerProgressClip, { width: progressClipWidth }]}>
              <ToolBarProgress width={footerWidth} height="100%" preserveAspectRatio="none" />
            </Animated.View>
          ) : null}
        </View>
      ) : null}
      {FOOTER_ITEMS.map((item) => {
        const isActive = pathname === item.route;

        // const isPauseItem = item.action === 'togglePause';
        // const displayLabel = isPauseItem && isPaused ? '播放' : item.label;
        // const DisplayIcon = isPauseItem && isPaused ? FooterIcon5_2 : item.Icon;

        const isPauseItem = item.action === 'togglePause';
        const isAudioTrackItem = item.action === 'toggleAudioTrack';

        const isRecordItem = item.labelKey === 'record';
        const hasOpenedHomePanel = activeHomePanel !== null;
        const isBackItem = isRecordItem && (videoMode === 'fullscreen' || hasOpenedHomePanel);
        // const shouldHideRecordItem = isRecordItem && videoMode === 'footerMini';
        const shouldHideRecordItem = false;

        const shouldHideFooterItemContent =
          videoMode === 'fullscreen' && !isFullscreenChromeVisible;

        // const displayLabel = (() => {
        //   if (isRecordItem && videoMode === 'fullscreen') {
        //     return '返回';
        //   }

        //   if (isPauseItem) {
        //     return isPaused ? copy.resume : copy.pause;
        //   }

        //   if (isAudioTrackItem) {
        //     return audioTrackMode === 'vocal' ? copy.accompaniment : copy.vocal;
        //   }

        //   return copy[item.labelKey];
        // })();
        const displayLabel = (() => {
          if (isBackItem) {
            return '返回';
          }

          if (isPauseItem) {
            return isPaused ? copy.resume : copy.pause;
          }

          if (isAudioTrackItem) {
            return audioTrackMode === 'vocal' ? copy.accompaniment : copy.vocal;
          }

          return copy[item.labelKey];
        })();

        const DisplayIcon = (() => {
          if (isPauseItem) {
            return isPaused ? FooterIcon5_2 : FooterIcon5_1;
          }

          if (isAudioTrackItem) {
            return audioTrackMode === 'vocal' ? FooterIcon6_2 : FooterIcon6_1;
          }

          return item.Icon;
        })();

        const isItemDisabled =
          shouldHideRecordItem ||
          shouldHideFooterItemContent ||
          (item.action === 'skipSong' && isSkipping) ||
          (item.action === 'restartSong' && isRestarting) ||
          (item.action === 'toggleAudioTrack' && isTogglingAudioTrack);

        const iconColor = isItemDisabled
          ? 'rgba(255, 255, 255, 0.32)'
          : isActive
            ? '#A78BFA'
            : '#FFFFFF';

        return (
          <Pressable
            ref={isRecordItem ? (recordSlotRef as any) : undefined}
            key={String(item.route)}
            disabled={isItemDisabled}
            style={({ pressed }) => [
              styles.footerItem,
              pressed && !isItemDisabled && styles.footerItemPressed,
              isItemDisabled && styles.footerItemDisabled,
            ]}
            onLayout={() => {
              // if (isRecordItem) {
              //   measureRecordSlot();
              // }
            }}
            onPress={async () => {
              console.log('[MainFooter] pressed item:', item.labelKey);
              console.log('[MainFooter] action:', item.action);

              if (item.labelKey === 'home') {
                closeHomePanel();
                resetMainBackgroundMode();
                closeFullscreen();

                router.replace('/(tabs)/home');
                return;
              }

              if (item.labelKey === 'songRequest') {
                openSongRequestQrPanel();
                return;
              }

              if (item.labelKey === 'queued') {
                openQueuedSongsPanel();
                return;
              }

              // if (item.labelKey === 'record' && videoMode === 'fullscreen') {
              //   closeFullscreen();
              //   return;
              // }
              if (isBackItem) {
                console.log('[MainFooter] action: back', {
                  pathname,
                  videoMode,
                  activeHomePanel,
                });

                if (videoMode === 'fullscreen') {
                  closeFullscreen();
                  return;
                }

                if (activeHomePanel) {
                  closeHomePanel();
                  resetMainBackgroundMode();

                  /**
                   * 因為你目前先停用 footerMini，
                   * 所以關閉 HomePanel 後要強制回 homeMini。
                   */
                  setBlockedByPanel(false);
                  showHomeMini();

                  return;
                }

                return;
              }

              if (item.action === 'togglePause') {
                console.log('[MainFooter] before toggle isPaused:', isPaused);
                console.log('[MainFooter] after toggle isPaused should be:', !isPaused);

                togglePause();
                return;
              }

              if (item.action === 'toggleAudioTrack') {
                if (isTogglingAudioTrackRef.current) {
                  console.log('[MainFooter] toggle audio track ignored: already toggling');
                  return;
                }

                isTogglingAudioTrackRef.current = true;
                setIsTogglingAudioTrack(true);

                // const nextAudioTrackMode = audioTrackMode === 'vocal' ? 'accompaniment' : 'vocal';

                // console.log('[MainFooter] before toggle audioTrackMode:', audioTrackMode);
                // console.log(
                //   '[MainFooter] after toggle audioTrackMode should be:',
                //   nextAudioTrackMode,
                // );

                toggleAudioTrackMode();

                setTimeout(() => {
                  isTogglingAudioTrackRef.current = false;
                  setIsTogglingAudioTrack(false);
                }, 500);

                return;
              }

              // if (item.action === 'skipSong') {
              //   console.log('[MainFooter] skip current song:', {
              //     currentSongId: currentPlaybackItem?.songId,
              //     currentTitle: currentPlaybackItem?.title,
              //   });

              //   finishCurrentSong();
              //   return;
              // }

              if (item.action === 'skipSong') {
                if (isSkippingRef.current) {
                  console.log('[MainFooter] skip current song skipped: already skipping');
                  return;
                }

                isSkippingRef.current = true;
                setIsSkipping(true);

                // console.log('[MainFooter] skip current song:', {
                //   currentSongId: currentPlaybackItem?.songId,
                //   currentTitle: currentPlaybackItem?.title,
                // });

                try {
                  await skipCurrent();
                } catch (error) {
                  console.log('[MainFooter] skip current song failed:', error);
                } finally {
                  setTimeout(() => {
                    isSkippingRef.current = false;
                    setIsSkipping(false);
                  }, 500);
                }

                return;
              }

              if (item.action === 'restartSong') {
                if (isRestartingRef.current) {
                  console.log('[MainFooter] restart ignored: already restarting');
                  return;
                }

                isRestartingRef.current = true;
                setIsRestarting(true);

                // console.log('[MainFooter] restart current song:', {
                //   currentSongId: currentPlaybackItem?.songId,
                //   currentTitle: currentPlaybackItem?.title,
                // });

                restartCurrentSong();

                setTimeout(() => {
                  isRestartingRef.current = false;
                  setIsRestarting(false);
                }, 300);

                return;
              }

              // router.replace(item.route);
            }}
          >
            {/* <Icon
              width={28}
              height={28}
              color={isActive ? '#A78BFA' : '#FFFFFF'}
              fill={isActive ? '#A78BFA' : '#FFFFFF'}
            />

            <Text style={[styles.footerLabel, isActive && styles.footerLabelActive]}>
              {item.label}
            </Text> */}

            {!shouldHideRecordItem ? (
              <View
                pointerEvents={shouldHideFooterItemContent ? 'none' : 'auto'}
                style={[
                  styles.footerItemContent,
                  shouldHideFooterItemContent && styles.footerItemContentHidden,
                ]}
              >
                <DisplayIcon width={28} height={28} color={iconColor} fill={iconColor} />

                <Text
                  style={[
                    styles.footerLabel,
                    isActive && !isItemDisabled && styles.footerLabelActive,
                    isItemDisabled && styles.footerLabelDisabled,
                  ]}
                >
                  {displayLabel}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // footer: {
  //   height: 86,
  //   paddingHorizontal: 30,
  //   paddingVertical: 20,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   backgroundColor: 'transparent',
  // },

  footer: {
    height: 86,
    paddingHorizontal: 30,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },

  footerBarLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  footerBarBgLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  footerBarProgressDefaultLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  footerProgressClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 2,
  },

  footerItem: {
    width: 130,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    // backgroundColor: 'red',
  },

  footerItemPressed: {
    opacity: 0.72,
  },

  footerLabel: {
    marginTop: 6,
    color: '#FFFFFF',
    // fontFamily: 'NotoSansTCVariable',
    fontSize: 12,
    fontWeight: '500',
  },

  footerLabelActive: {
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },

  footerItemDisabled: {
    opacity: 0.45,
  },

  footerLabelDisabled: {
    color: 'rgba(255, 255, 255, 0.32)',
    textDecorationLine: 'none',
  },

  footerItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerItemContentHidden: {
    opacity: 0,
  },
});
