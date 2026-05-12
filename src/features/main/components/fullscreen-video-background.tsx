import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';

const SCREEN = Dimensions.get('window');

export function FullscreenVideoBackground() {
  const progress = useRef(new Animated.Value(0)).current;

  const isVisible = useFullscreenVideoStore((state) => state.isVisible);
  const videoUri = useFullscreenVideoStore((state) => state.videoUri);
  const originRect = useFullscreenVideoStore((state) => state.originRect);
  const hideFullscreenVideo = useFullscreenVideoStore((state) => state.hideFullscreenVideo);

  const isDefaultVideo = useFullscreenVideoStore((state) => state.isDefaultVideo);

  const isPaused = usePlayerControlStore((state) => state.isPaused);

  const animatedStyle = useMemo(() => {
    const startX = originRect?.x ?? 0;
    const startY = originRect?.y ?? 0;
    const startWidth = originRect?.width ?? SCREEN.width;
    const startHeight = originRect?.height ?? SCREEN.height;

    return {
      left: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [startX, 0],
      }),
      top: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [startY, 0],
      }),
      width: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [startWidth, SCREEN.width],
      }),
      height: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [startHeight, SCREEN.height],
      }),
      borderRadius: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
      }),
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1],
      }),
    };
  }, [originRect, progress]);

  useEffect(() => {
    if (!videoUri || !originRect) {
      return;
    }

    if (isVisible) {
      progress.setValue(0);

      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        useNativeDriver: false,
      }).start();

      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [isVisible, originRect, progress, videoUri]);

  if (!videoUri || !originRect) {
    return null;
  }

  return (
    <View pointerEvents={isVisible ? 'auto' : 'none'} style={styles.layer}>
      <Animated.View style={[styles.animatedFrame, animatedStyle]}>
        <Pressable style={styles.touchArea} onPress={hideFullscreenVideo}>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="contain"
            controls={false}
            repeat={isDefaultVideo}
            paused={isPaused}
            muted={false}
            onLoad={(payload) => {
              console.log('[FullscreenVideoBackground] onLoad:', payload);
            }}
            onError={(error) => {
              console.log('[FullscreenVideoBackground] error:', error);
            }}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },

  animatedFrame: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },

  touchArea: {
    flex: 1,
  },

  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
});
