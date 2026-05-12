import { useEffect, useRef } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';

import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';

type Props = {
  onOpenMySongsPanel?: () => void;
  onOpenCachedSongsPanel?: () => void;
};

export function HomeSidePanel({ onOpenMySongsPanel, onOpenCachedSongsPanel }: Props) {
  const playerFrameRef = useRef<View>(null);

  const mode = useFullscreenVideoStore((state) => state.mode);
  const openFullscreen = useFullscreenVideoStore((state) => state.openFullscreen);
  const setMiniRect = useFullscreenVideoStore((state) => state.setMiniRect);

  const isFullscreenVideoVisible = mode === 'fullscreen';

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     const nodeHandle = findNodeHandle(playerFrameRef.current);

  //     if (!nodeHandle) {
  //       return;
  //     }

  //     UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
  //       setMiniRect({
  //         x,
  //         y,
  //         width,
  //         height,
  //       });
  //     });
  //   }, 0);

  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [setMiniRect]);

  const measurePlayerFrame = () => {
    const nodeHandle = findNodeHandle(playerFrameRef.current);

    if (!nodeHandle) {
      console.log('[HomeSidePanel] measure ignored: missing nodeHandle');
      return;
    }

    UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
      const rect = {
        x,
        y,
        width,
        height,
      };

      console.log('[HomeSidePanel] measured miniRect:', rect);

      setMiniRect(rect);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      measurePlayerFrame();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [setMiniRect]);

  const handleOpenFullscreenVideo = () => {
    const nodeHandle = findNodeHandle(playerFrameRef.current);

    if (!nodeHandle) {
      console.log('[HomeSidePanel] fullscreen ignored: missing nodeHandle');
      return;
    }

    UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
      const rect = {
        x,
        y,
        width,
        height,
      };

      console.log('[HomeSidePanel] open fullscreen rect:', rect);

      openFullscreen(rect);
    });
  };

  return (
    <View style={styles.sidePanel}>
      <View
        pointerEvents={isFullscreenVideoVisible ? 'none' : 'auto'}
        style={[styles.buttonGroup, isFullscreenVideoVisible && styles.buttonGroupHidden]}
      >
        <Pressable
          style={({ pressed }) => [styles.sideButton, pressed && styles.sideButtonPressed]}
        >
          <ImageBackground
            source={require('@/assets/images/home-setting-btn.png')}
            style={styles.sideButtonBackground}
            imageStyle={styles.sideButtonBackgroundImage}
            resizeMode="cover"
          >
            <Text style={styles.sideButtonText}>設定</Text>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.sideButton, pressed && styles.sideButtonPressed]}
          onPress={onOpenMySongsPanel}
        >
          <ImageBackground
            source={require('@/assets/images/home-setting-btn.png')}
            style={styles.sideButtonBackground}
            imageStyle={styles.sideButtonBackgroundImage}
            resizeMode="cover"
          >
            <Text style={styles.sideButtonText}>我的歌單</Text>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.sideButton,
            styles.cachedSongsButton,
            pressed && styles.sideButtonPressed,
          ]}
          onPress={onOpenCachedSongsPanel}
        >
          <ImageBackground
            source={require('@/assets/images/home-setting-btn.png')}
            style={styles.sideButtonBackground}
            imageStyle={styles.sideButtonBackgroundImage}
            resizeMode="cover"
          >
            <Text style={styles.sideButtonText}>緩存下載</Text>
          </ImageBackground>
        </Pressable>
      </View>

      <Pressable
        ref={playerFrameRef as any}
        style={({ pressed }) => [styles.playerFrame, pressed && styles.playerFramePressed]}
        onLayout={measurePlayerFrame}
        onPress={handleOpenFullscreenVideo}
      >
        <View pointerEvents="none" style={styles.videoPlaceholder} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidePanel: {
    width: 358,
    height: 480,
    justifyContent: 'center',
  },

  buttonGroup: {
    gap: 24,
    marginBottom: 32,
  },

  buttonGroupHidden: {
    opacity: 0,
  },

  sideButton: {
    width: 358,
    height: 67,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cachedSongsButton: {
    marginBottom: 10,
  },

  sideButtonBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideButtonBackgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  sideButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  sideButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },

  playerFrame: {
    width: 358,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },

  playerFramePressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
});
