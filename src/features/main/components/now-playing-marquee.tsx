import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useNowPlayingQuery } from '@/src/features/playlist/hook/use-now-playing-query';
import { useNowPlayingSocket } from '@/src/features/playlist/hook/use-now-playing-socket';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

const MARQUEE_START_X = -1200;
const MARQUEE_END_X = 1000;
const MARQUEE_DURATION_MS = 25000;
const MARQUEE_PAUSE_MS = 3000;

function formatSongTitle(title?: string) {
  if (!title || title.trim().length === 0) {
    return '';
  }

  return formatDisplaySongTitle(title);
}

export const NowPlayingMarquee = memo(function NowPlayingMarquee() {
  const translateX = useRef(new Animated.Value(0)).current;

  useNowPlayingSocket();

  const { data } = useNowPlayingQuery();

  const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const nextPlaybackItem = usePlaybackQueueStore((state) => state.queue[0] ?? null);

  // const displayText = useMemo(() => {
  //   const currentTitle = formatSongTitle(data?.current?.title);
  //   const nextTitle = formatSongTitle(data?.next?.title);

  //   const currentText = currentTitle ? `目前：${currentTitle}` : '目前未播放歌曲';
  //   const nextText = nextTitle ? `下一首：${nextTitle}` : '下一首：尚未點歌';

  //   return `${currentText}     ${nextText}`;
  // }, [data?.current?.title, data?.next?.title]);

  const displayText = useMemo(() => {
    /**
     * 優先讀本機播放佇列。
     * API now-playing 只當 fallback。
     */
    const currentTitle = formatSongTitle(
      currentPlaybackItem?.title || data?.current?.title,
    );
  
    const nextTitle = formatSongTitle(
      nextPlaybackItem?.title || data?.next?.title,
    );
  
    const currentText = currentTitle ? `目前：${currentTitle}` : '目前未播放歌曲';
    const nextText = nextTitle ? `下一首：${nextTitle}` : '下一首：尚未點歌';
  
    return `${currentText}     ${nextText}`;
  }, [
    currentPlaybackItem?.title,
    nextPlaybackItem?.title,
    data?.current?.title,
    data?.next?.title,
  ]);
  

  useEffect(() => {
    let isMounted = true;
    let pauseTimer: ReturnType<typeof setTimeout> | null = null;
    let currentAnimation: Animated.CompositeAnimation | null = null;

    const runMarquee = () => {
      if (!isMounted) {
        return;
      }

      translateX.setValue(MARQUEE_START_X);

      currentAnimation = Animated.timing(translateX, {
        toValue: MARQUEE_END_X,
        duration: MARQUEE_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      currentAnimation.start(({ finished }) => {
        if (!finished || !isMounted) {
          return;
        }

        pauseTimer = setTimeout(() => {
          runMarquee();
        }, MARQUEE_PAUSE_MS);
      });
    };

    runMarquee();

    return () => {
      isMounted = false;

      if (pauseTimer) {
        clearTimeout(pauseTimer);
      }

      currentAnimation?.stop();
    };
  }, [displayText, translateX]);

  return (
    <View pointerEvents="none" style={styles.marqueeContainer}>
      <Animated.View
        style={[
          styles.marqueeContent,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Text style={styles.marqueeText} numberOfLines={1}>
          {displayText}
        </Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  marqueeContainer: {
    flex: 1,
    height: 38,
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    // backgroundColor: 'transpent',
  },

  marqueeContent: {
    width: 720,
  },

  marqueeText: {
    color: '#FFFFFF',
    // fontFamily: 'NotoSansTCVariable',
    fontSize: 18,
    fontWeight: '800',
    includeFontPadding: false,
  },
});
