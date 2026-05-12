import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useNowPlayingQuery } from '@/src/features/playlist/hook/use-now-playing-query';
import { useNowPlayingSocket } from '@/src/features/playlist/hook/use-now-playing-socket';
import { formatDisplaySongTitle } from '@/src/features/song/utils/song-title-format';

function formatSongTitle(title?: string) {
  if (!title || title.trim().length === 0) {
    return '';
  }

  return formatDisplaySongTitle(title);
}

export function NowPlayingMarquee() {
  const translateX = useRef(new Animated.Value(0)).current;

  useNowPlayingSocket();

  const { data } = useNowPlayingQuery();

  useEffect(() => {
    console.log('[NowPlayingMarquee] data:', {
      current: data?.current?.title,
      next: data?.next?.title,
      index: data?.index,
      raw: data,
    });
  }, [data]);

  const displayText = useMemo(() => {
    const currentTitle = formatSongTitle(data?.current?.title);
    const nextTitle = formatSongTitle(data?.next?.title);

    const currentText = currentTitle ? `目前播放：${currentTitle}` : '目前未播放歌曲';
    const nextText = nextTitle ? `下一首：${nextTitle}` : '下一首：尚未點歌';

    return `${currentText}     ${nextText}`;
  }, [data?.current?.title, data?.next?.title]);

  useEffect(() => {
    translateX.setValue(260);

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -520,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [displayText, translateX]);

  return (
    <View style={styles.marqueeContainer}>
      <Animated.View
        style={[
          styles.marqueeContent,
          {
            transform: [
              {
                translateX,
              },
            ],
          },
        ]}
      >
        <Text style={styles.marqueeText} numberOfLines={1}>
          {displayText}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  marqueeContainer: {
    flex: 1,
    height: 38,
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },

  marqueeContent: {
    width: 720,
  },

  marqueeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    includeFontPadding: false,
  },
});
