import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { Href, usePathname, useRouter } from 'expo-router';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';

import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';
import { useHomePanelStore } from '@/src/features/main/store/home-panel.store';
import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';

import FooterIcon1 from '@/assets/images/footer-icons-1.svg';
import FooterIcon2 from '@/assets/images/footer-icons-2.svg';
import FooterIcon3 from '@/assets/images/footer-icons-3.svg';
import FooterIcon4 from '@/assets/images/footer-icons-4.svg';
import FooterIcon5 from '@/assets/images/footer-icons-5.svg';
import FooterIcon6 from '@/assets/images/footer-icons-6.svg';
import FooterIcon7 from '@/assets/images/footer-icons-7.svg';
import FooterIcon8 from '@/assets/images/footer-icons-8.svg';
import FooterIcon9 from '@/assets/images/footer-icons-9.svg';

type FooterAction = 'navigate' | 'togglePause' | 'toggleAudioTrack' | 'skipSong' | 'restartSong';

type FooterItem = {
  label: string;
  route: Href;
  Icon: ComponentType<SvgProps>;
  action: FooterAction;
};

const FOOTER_ITEMS: FooterItem[] = [
  {
    label: '主頁',
    route: '/(tabs)/home',
    Icon: FooterIcon1,
    action: 'navigate',
  },
  {
    label: '點歌',
    route: '/(tabs)/two',
    Icon: FooterIcon2,
    action: 'navigate',
  },
  {
    label: '調音',
    route: '/(tabs)/tuning' as Href,
    Icon: FooterIcon3,
    action: 'navigate',
  },
  {
    label: '切歌',
    route: '/(tabs)/switch-song' as Href,
    Icon: FooterIcon4,
    action: 'skipSong',
  },
  {
    label: '暫停',
    route: '/(tabs)/pause' as Href,
    Icon: FooterIcon5,
    action: 'togglePause',
  },
  {
    label: '原唱',
    route: '/(tabs)/original' as Href,
    Icon: FooterIcon6,
    action: 'toggleAudioTrack',
  },
  {
    label: '重唱',
    route: '/(tabs)/restart' as Href,
    Icon: FooterIcon7,
    action: 'restartSong',
  },
  {
    label: '已點',
    route: '/(tabs)/queue' as Href,
    Icon: FooterIcon8,
    action: 'navigate',
  },
  {
    label: '錄製',
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

  return (
    <View style={styles.footer}>
      {FOOTER_ITEMS.map((item) => {
        const isActive = pathname === item.route;
        const Icon = item.Icon;

        return (
          <Pressable
            key={String(item.route)}
            style={({ pressed }) => [styles.footerItem, pressed && styles.footerItemPressed]}
            onPress={async () => {
              console.log('[MainFooter] pressed item:', item.label);
              console.log('[MainFooter] action:', item.action);

              if (item.label === '主頁') {
                closeHomePanel();
                resetMainBackgroundMode();
                closeFullscreen();

                router.replace('/(tabs)/home');
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
              if (item.action === 'navigate') {
                router.replace(item.route);
              }
            }}
          >
            <Icon
              width={28}
              height={28}
              color={isActive ? '#A78BFA' : '#FFFFFF'}
              fill={isActive ? '#A78BFA' : '#FFFFFF'}
            />

            <Text style={[styles.footerLabel, isActive && styles.footerLabelActive]}>
              {item.label}
            </Text>
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
