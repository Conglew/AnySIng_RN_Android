import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { Href, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View, findNodeHandle, UIManager } from 'react-native';
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
  const resetMainBackgroundMode = useMainBackgroundStore((state) => state.resetMode);
  const closeFullscreen = useFullscreenVideoStore((state) => state.closeFullscreen);

  const videoMode = useFullscreenVideoStore((state) => state.mode);
  const setFooterMiniRect = useFullscreenVideoStore((state) => state.setFooterMiniRect);

  const recordSlotRef = useRef<View>(null);

  const measureRecordSlot = useCallback(() => {
    const nodeHandle = findNodeHandle(recordSlotRef.current);

    if (!nodeHandle) {
      console.log('[MainFooter] measure footer mini ignored: missing nodeHandle');
      return;
    }

    UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
      const rect = {
        x,
        y,
        width,
        height,
      };

      console.log('[MainFooter] measured footerMiniRect:', rect);

      setFooterMiniRect(rect);
    });
  }, [setFooterMiniRect]);

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

  return (
    <View style={styles.footer}>
      {FOOTER_ITEMS.map((item) => {
        const isActive = pathname === item.route;

        // const isPauseItem = item.action === 'togglePause';
        // const displayLabel = isPauseItem && isPaused ? '播放' : item.label;
        // const DisplayIcon = isPauseItem && isPaused ? FooterIcon5_2 : item.Icon;

        const isPauseItem = item.action === 'togglePause';
        const isAudioTrackItem = item.action === 'toggleAudioTrack';

        const displayLabel = (() => {
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

        const isRecordItem = item.labelKey === 'record';
        const shouldHideRecordItem = isRecordItem && videoMode === 'footerMini';

        return (
          <Pressable
            ref={isRecordItem ? (recordSlotRef as any) : undefined}
            key={String(item.route)}
            style={({ pressed }) => [styles.footerItem, pressed && styles.footerItemPressed]}
            onLayout={() => {
              if (isRecordItem) {
                measureRecordSlot();
              }
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

              if (item.action === 'togglePause') {
                console.log('[MainFooter] before toggle isPaused:', isPaused);
                console.log('[MainFooter] after toggle isPaused should be:', !isPaused);

                togglePause();
                return;
              }

              if (item.action === 'toggleAudioTrack') {
                const nextAudioTrackMode = audioTrackMode === 'vocal' ? 'accompaniment' : 'vocal';

                console.log('[MainFooter] before toggle audioTrackMode:', audioTrackMode);
                console.log(
                  '[MainFooter] after toggle audioTrackMode should be:',
                  nextAudioTrackMode,
                );

                toggleAudioTrackMode();
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
                console.log('[MainFooter] skip current song:', {
                  currentSongId: currentPlaybackItem?.songId,
                  currentTitle: currentPlaybackItem?.title,
                });

                try {
                  await skipCurrent();
                } catch (error) {
                  console.log('[MainFooter] skip current song failed:', error);
                }

                return;
              }

              if (item.action === 'restartSong') {
                console.log('[MainFooter] restart current song:', {
                  currentSongId: currentPlaybackItem?.songId,
                  currentTitle: currentPlaybackItem?.title,
                });

                restartCurrentSong();
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
              <>
                <DisplayIcon
                  width={28}
                  height={28}
                  color={isActive ? '#A78BFA' : '#FFFFFF'}
                  fill={isActive ? '#A78BFA' : '#FFFFFF'}
                />

                <Text style={[styles.footerLabel, isActive && styles.footerLabelActive]}>
                  {displayLabel}
                </Text>
              </>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 86,
    paddingHorizontal: 30,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },

  footerItem: {
    width: 130,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'red',
  },

  footerItemPressed: {
    opacity: 0.72,
  },

  footerLabel: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  footerLabelActive: {
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },
});
