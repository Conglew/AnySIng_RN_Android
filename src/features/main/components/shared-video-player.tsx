/**
 *  1. 全 App 唯一 Video
    2. mini / fullscreen 動畫
    3. default video 載入
    4. currentPlaybackItem 播放
    5. 音軌切換
    6. 播完後 skipCurrent
    7. onError 後 fallback finishCurrent
 */

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Video, { SelectedTrackType, type SelectedTrack } from 'react-native-video';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';
import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';

const SCREEN = Dimensions.get('window');

const DEFAULT_LOCAL_VIDEO_ASSET = require('@/assets/demo/video/Test.mkv');

/**
 * 依照你的 MKV 音軌順序調整。
 *
 * 注意：
 * 這裡是 react-native-video onLoad 回傳的 audioTracks 陣列 index。
 */
const DEFAULT_VOCAL_TRACK_INDEX = 0;
const DEFAULT_ACCOMPANIMENT_TRACK_INDEX = 1;

export function SharedVideoPlayer() {
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<any>(null);
  const isFinishingPlaybackRef = useRef(false);

  const [resolvedDefaultVideoUri, setResolvedDefaultVideoUri] = useState<string | null>(null);

  const mode = useFullscreenVideoStore((state) => state.mode);
  const homeMiniRect = useFullscreenVideoStore((state) => state.homeMiniRect);
  const footerMiniRect = useFullscreenVideoStore((state) => state.footerMiniRect);
  const openFullscreen = useFullscreenVideoStore((state) => state.openFullscreen);
  const closeFullscreen = useFullscreenVideoStore((state) => state.closeFullscreen);

  const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const finishCurrentPlaybackItem = usePlaybackQueueStore((state) => state.finishCurrent);

  const { skipCurrent } = usePlaybackQueueActions();

  const isPaused = usePlayerControlStore((state) => state.isPaused);
  const audioTrackMode = usePlayerControlStore((state) => state.audioTrackMode);
  const vocalAudioTrackIndex = usePlayerControlStore((state) => state.vocalAudioTrackIndex);
  const accompanimentAudioTrackIndex = usePlayerControlStore(
    (state) => state.accompanimentAudioTrackIndex,
  );
  const setAudioTrackIndexes = usePlayerControlStore((state) => state.setAudioTrackIndexes);
  const resetAudioTrackIndexes = usePlayerControlStore((state) => state.resetAudioTrackIndexes);

  const isFullscreen = mode === 'fullscreen';
  const activeMiniRect = mode === 'footerMini' ? footerMiniRect : homeMiniRect;

  const handleToggleFullscreen = () => {
    console.log('[SharedVideoPlayer] press video:', {
      mode,
      activeMiniRect,
    });

    if (!activeMiniRect) {
      console.log('[SharedVideoPlayer] toggle ignored: missing activeMiniRect');
      return;
    }

    if (isFullscreen) {
      closeFullscreen();
      return;
    }

    openFullscreen();
  };

  /**
   * 有 currentPlaybackItem 時播放目前歌曲。
   * 沒有 currentPlaybackItem 時播放預設影片。
   */
  const playbackVideoUri = currentPlaybackItem?.localVideoUri ?? resolvedDefaultVideoUri;
  const isDefaultVideo = !currentPlaybackItem;

  const selectedAudioTrack = useMemo<SelectedTrack | undefined>(() => {
    const selectedIndex =
      audioTrackMode === 'vocal' ? vocalAudioTrackIndex : accompanimentAudioTrackIndex;

    if (selectedIndex === null) {
      return undefined;
    }

    return {
      type: SelectedTrackType.INDEX,
      value: selectedIndex,
    };
  }, [accompanimentAudioTrackIndex, audioTrackMode, vocalAudioTrackIndex]);

  /**
   * mini 模式時，播放器顯示在 miniRect。
   * fullscreen 模式時，播放器放大到整個螢幕。
   */
  const animatedStyle = useMemo(() => {
    const fallbackRect = {
      x: SCREEN.width - 378,
      y: 280,
      width: 358,
      height: 200,
    };

    const rect = activeMiniRect ?? fallbackRect;

    return {
      left: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [rect.x, 0],
      }),
      top: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [rect.y, 0],
      }),
      width: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [rect.width, SCREEN.width],
      }),
      height: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [rect.height, SCREEN.height],
      }),
      borderRadius: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 0],
      }),
    };
  }, [activeMiniRect, progress]);

  /**
   * 載入預設影片。
   *
   * 原本這段在 home-side-panel.tsx。
   * 單一播放器架構下，預設影片也應該由 SharedVideoPlayer 管理。
   */
  useEffect(() => {
    let isMounted = true;

    async function resolveDefaultVideoSource() {
      try {
        resetAudioTrackIndexes();

        const asset = Asset.fromModule(DEFAULT_LOCAL_VIDEO_ASSET);
        await asset.downloadAsync();

        const sourceUri = asset.localUri ?? asset.uri;

        if (!sourceUri) {
          throw new Error('Default video sourceUri is empty.');
        }

        const videoCacheDirectory = `${FileSystem.cacheDirectory}video-media/`;
        const targetUri = `${videoCacheDirectory}Test.mkv`;

        const directoryInfo = await FileSystem.getInfoAsync(videoCacheDirectory);

        if (!directoryInfo.exists) {
          await FileSystem.makeDirectoryAsync(videoCacheDirectory, {
            intermediates: true,
          });
        }

        const targetInfo = await FileSystem.getInfoAsync(targetUri);

        if (!targetInfo.exists) {
          if (sourceUri.startsWith('file://')) {
            await FileSystem.copyAsync({
              from: sourceUri,
              to: targetUri,
            });
          } else {
            await FileSystem.downloadAsync(sourceUri, targetUri);
          }
        }

        const copiedFileInfo = await FileSystem.getInfoAsync(targetUri);

        if (!copiedFileInfo.exists) {
          throw new Error('Copied default MKV file does not exist.');
        }

        if (!isMounted) {
          return;
        }

        setResolvedDefaultVideoUri(targetUri);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('[SharedVideoPlayer] resolve default video error:', message);
      }
    }

    resolveDefaultVideoSource();

    return () => {
      isMounted = false;
    };
  }, [resetAudioTrackIndexes]);

  /**
   * mini / fullscreen 動畫。
   *
   * 因為同一顆 Video 沒有 unmount，
   * 所以切換顯示模式不會重頭播放。
   */
  useEffect(() => {
    Animated.timing(progress, {
      toValue: isFullscreen ? 1 : 0,
      duration: isFullscreen ? 320 : 260,
      useNativeDriver: false,
    }).start();
  }, [isFullscreen, progress]);

  /**
   * 換歌或 restartToken 改變時重播。
   *
   * 注意：
   * 這裡只在 source 換掉時自然 remount。
   * mini/fullscreen 切換不會改 key，所以不會重播。
   */
  const restartToken = usePlayerControlStore((state) => state.restartToken);

  useEffect(() => {
    if (!playbackVideoUri) {
      return;
    }

    console.log('[SharedVideoPlayer] restart current video:', {
      restartToken,
      playbackVideoUri,
      queueId: currentPlaybackItem?.queueId,
    });

    videoRef.current?.seek?.(0);
  }, [currentPlaybackItem?.queueId, playbackVideoUri, restartToken]);

  const handleVideoLoad = (payload: any) => {
    console.log('[SharedVideoPlayer] onLoad:', {
      playbackVideoUri,
      currentPlaybackItem,
      isDefaultVideo,
      isPaused,
      audioTracks: payload?.audioTracks,
    });

    const audioTracks = payload?.audioTracks ?? [];

    const vocalTrack = audioTracks[DEFAULT_VOCAL_TRACK_INDEX];
    const accompanimentTrack = audioTracks[DEFAULT_ACCOMPANIMENT_TRACK_INDEX];

    setAudioTrackIndexes({
      vocalAudioTrackIndex: vocalTrack ? DEFAULT_VOCAL_TRACK_INDEX : null,
      accompanimentAudioTrackIndex: accompanimentTrack ? DEFAULT_ACCOMPANIMENT_TRACK_INDEX : null,
    });
  };

  const handleVideoEnd = () => {
    console.log('[SharedVideoPlayer] playback ended:', {
      isDefaultVideo,
      songId: currentPlaybackItem?.songId,
      song: currentPlaybackItem?.song,
    });

    if (isDefaultVideo) {
      videoRef.current?.seek?.(0);
      return;
    }

    if (isFinishingPlaybackRef.current) {
      return;
    }

    isFinishingPlaybackRef.current = true;

    skipCurrent()
      .catch((error) => {
        console.log('[SharedVideoPlayer] sync skipCurrent onEnd failed:', error);
        finishCurrentPlaybackItem();
      })
      .finally(() => {
        isFinishingPlaybackRef.current = false;
      });
  };

  const handleVideoError = (event: unknown) => {
    console.log('[SharedVideoPlayer] error:', event);

    if (isDefaultVideo) {
      return;
    }

    if (isFinishingPlaybackRef.current) {
      return;
    }

    isFinishingPlaybackRef.current = true;

    skipCurrent()
      .catch((error) => {
        console.log('[SharedVideoPlayer] sync skipCurrent onError failed:', error);
        finishCurrentPlaybackItem();
      })
      .finally(() => {
        isFinishingPlaybackRef.current = false;
      });
  };

  const backgroundMode = useMainBackgroundStore((state) => state.mode);
  // const isBlockedByPanel = useFullscreenVideoStore((state) => state.isBlockedByPanel);

  // const shouldHideVideoPlayer = backgroundMode !== 'home' || isBlockedByPanel;
  const shouldHideVideoPlayer = backgroundMode !== 'home' && mode !== 'footerMini';

  //   if (shouldHideVideoPlayer) {
  //     return null;
  //   }

  /**
   * 預設影片還沒準備好時，不渲染 Video。
   */
  if (!playbackVideoUri || !activeMiniRect) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, mode === 'footerMini' && styles.footerMiniLayer]}
    >
      <Animated.View style={[styles.videoFrame, animatedStyle]}>
        <Video
          ref={videoRef}
          key={currentPlaybackItem?.queueId ?? playbackVideoUri}
          source={{ uri: playbackVideoUri }}
          style={styles.video}
          resizeMode="contain"
          controls={false}
          repeat={isDefaultVideo}
          paused={isPaused}
          muted={false}
          selectedAudioTrack={selectedAudioTrack}
          onLoad={handleVideoLoad}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
        />

        <Pressable style={styles.videoPressOverlay} onPress={handleToggleFullscreen} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },

  videoFrame: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },

  touchArea: {
    flex: 1,
  },

  videoPressOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },

  hiddenLayer: {
    opacity: 0,
    pointerEvents: 'none',
  },

  footerMiniLayer: {
    zIndex: 50,
  },
});
