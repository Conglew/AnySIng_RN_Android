/**
 * 1. 全 App 唯一 Video
    2. mini / fullscreen 動畫
    3. default video 載入
    4. currentPlaybackItem 播放
    5. 音軌切換
    6. 播完後 skipCurrent
    7. onError 後 fallback finishCurrent
 */

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Video, { SelectedTrackType, type SelectedTrack } from 'react-native-video';

import type { VideoFrameRect } from '@/src/features/main/store/fullscreen-video.store';
import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';
import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';

const SCREEN = Dimensions.get('window');

const FOOTER_MINI_WIDTH = 120;
const FOOTER_MINI_HEIGHT = 68;
const FOOTER_MINI_OFFSET_X = 0;
const FOOTER_MINI_OFFSET_Y = -15;

function getFooterMiniDisplayRect(rect: VideoFrameRect): VideoFrameRect {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return {
    x: centerX - FOOTER_MINI_WIDTH / 2 + FOOTER_MINI_OFFSET_X,
    y: centerY - FOOTER_MINI_HEIGHT / 2 + FOOTER_MINI_OFFSET_Y,
    width: FOOTER_MINI_WIDTH,
    height: FOOTER_MINI_HEIGHT,
  };
}

const DEFAULT_LOCAL_VIDEO_ASSET = require('@/assets/defaut_loop.mp4');

const DEFAULT_VOCAL_TRACK_INDEX = 0;
const DEFAULT_ACCOMPANIMENT_TRACK_INDEX = 1;

const SOURCE_READY_FALLBACK_MS = 1200;

export function SharedVideoPlayer() {
  const videoRef = useRef<any>(null);
  const isHandlingVideoEndRef = useRef(false);
  const lastPlaybackProgressUpdateTimeRef = useRef(0);
  const isFullscreenTransitioningRef = useRef(false);
  const sourceReadyFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isVideoTransitionMaskVisible, setIsVideoTransitionMaskVisible] = useState(false);
  const [isWaitingForFirstFrame, setIsWaitingForFirstFrame] = useState(false);
  const [safePlaybackVideoUri, setSafePlaybackVideoUri] = useState<string | null>(null);
  const [isPreparingSource, setIsPreparingSource] = useState(false);
  const [resolvedDefaultVideoUri, setResolvedDefaultVideoUri] = useState<string | null>(null);

  const mode = useFullscreenVideoStore((state) => state.mode);
  const homeMiniRect = useFullscreenVideoStore((state) => state.homeMiniRect);
  const footerMiniRect = useFullscreenVideoStore((state) => state.footerMiniRect);
  const openFullscreen = useFullscreenVideoStore((state) => state.openFullscreen);
  const closeFullscreen = useFullscreenVideoStore((state) => state.closeFullscreen);

  const isFullscreenChromeVisible = useFullscreenVideoStore(
    (state) => state.isFullscreenChromeVisible,
  );
  const showFullscreenChrome = useFullscreenVideoStore((state) => state.showFullscreenChrome);
  const restartFullscreenChromeAutoHideTimer = useFullscreenVideoStore(
    (state) => state.restartFullscreenChromeAutoHideTimer,
  );
  const setPlaybackProgress = useFullscreenVideoStore((state) => state.setPlaybackProgress);
  const resetPlaybackProgress = useFullscreenVideoStore((state) => state.resetPlaybackProgress);

  const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const finishCurrentPlaybackItem = usePlaybackQueueStore((state) => state.finishCurrent);

  const { skipCurrent, skipCurrentAfterPlaybackError } = usePlaybackQueueActions();

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

  const [stableMiniRect, setStableMiniRect] = useState<VideoFrameRect | null>(null);


  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreenTransitioningRef.current) {
      return;
    }

    if (!activeMiniRect) {
      console.log('[SharedVideoPlayer] toggle ignored: missing activeMiniRect');
      return;
    }

    if (isFullscreen) {
      if (!isFullscreenChromeVisible) {
        showFullscreenChrome();
        return;
      }

      restartFullscreenChromeAutoHideTimer();
      return;
    }

    isFullscreenTransitioningRef.current = true;
    openFullscreen();
  }, [
    activeMiniRect,
    isFullscreen,
    isFullscreenChromeVisible,
    openFullscreen,
    restartFullscreenChromeAutoHideTimer,
    showFullscreenChrome,
  ]);

  const playbackVideoUri = currentPlaybackItem?.localVideoUri ?? resolvedDefaultVideoUri;
  const isDefaultVideo = !currentPlaybackItem;

  const videoSource = useMemo(() => {
    if (!safePlaybackVideoUri) {
      return undefined;
    }
    return {
      uri: safePlaybackVideoUri,
    };
  }, [safePlaybackVideoUri]);

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


  // useEffect(() => {
  //   if (isFullscreen) {
  //     return;
  //   }
  
  //   if (!activeMiniRect) {
  //     return;
  //   }
  
  //   setIsVideoTransitionMaskVisible(true);
  
  //   const timer = setTimeout(() => {
  //     setStableMiniRect(activeMiniRect);
  
  //     setTimeout(() => {
  //       setIsVideoTransitionMaskVisible(false);
  //     }, 300);
  //   }, 120);
  
  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [activeMiniRect, isFullscreen]);

  const miniRectApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const miniRectMaskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFullscreen) {
      return;
    }

    if (!activeMiniRect) {
      return;
    }

    setIsVideoTransitionMaskVisible(true);

    if (miniRectApplyTimerRef.current) {
      clearTimeout(miniRectApplyTimerRef.current);
    }

    if (miniRectMaskTimerRef.current) {
      clearTimeout(miniRectMaskTimerRef.current);
    }

    miniRectApplyTimerRef.current = setTimeout(() => {
      setStableMiniRect(activeMiniRect);

      miniRectMaskTimerRef.current = setTimeout(() => {
        setIsVideoTransitionMaskVisible(false);
        miniRectMaskTimerRef.current = null;
      }, 300);

      miniRectApplyTimerRef.current = null;
    }, 120);

    return () => {
      if (miniRectApplyTimerRef.current) {
        clearTimeout(miniRectApplyTimerRef.current);
        miniRectApplyTimerRef.current = null;
      }

      if (miniRectMaskTimerRef.current) {
        clearTimeout(miniRectMaskTimerRef.current);
        miniRectMaskTimerRef.current = null;
      }
    };
  }, [activeMiniRect, isFullscreen]);

  // const videoFrameStyle = useMemo(() => {
  //   const fallbackRect = {
  //     x: SCREEN.width - 378,
  //     y: 280,
  //     width: 358,
  //     height: 200,
  //   };

  //   const baseRect = activeMiniRect ?? fallbackRect;

  //   const rect =
  //     mode === 'footerMini' && activeMiniRect ? getFooterMiniDisplayRect(activeMiniRect) : baseRect;

  //   if (isFullscreen) {
  //     return {
  //       left: 0,
  //       top: 0,
  //       width: SCREEN.width,
  //       height: SCREEN.height,
  //       borderRadius: 0,
  //     };
  //   }

  //   return {
  //     left: rect.x,
  //     top: rect.y,
  //     width: rect.width,
  //     height: rect.height,
  //     borderRadius: 10,
  //   };
  // }, [activeMiniRect, isFullscreen, mode]);

  const videoFrameStyle = useMemo(() => {
    const fallbackRect = {
      x: SCREEN.width - 378,
      y: 280,
      width: 358,
      height: 200,
    };
  
    const baseRect = stableMiniRect ?? activeMiniRect ?? fallbackRect;
  
    const rect =
      mode === 'footerMini' && baseRect ? getFooterMiniDisplayRect(baseRect) : baseRect;
  
    if (isFullscreen) {
      return {
        left: 0,
        top: 0,
        width: SCREEN.width,
        height: SCREEN.height,
        borderRadius: 0,
      };
    }
  
    return {
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      borderRadius: 10,
    };
  }, [activeMiniRect, isFullscreen, mode, stableMiniRect]);

  // 💡 【優化】動態控制影片組件的透明度，當遮罩顯示時（換歌/未就緒），直接讓 Video 透明，露出下方的純黑底 View，物理隔絕硬體綠屏
  // const videoComponentStyle = useMemo(() => {
  //   return [styles.video, { opacity: isVideoTransitionMaskVisible ? 0 : 1 }];
  // }, [isVideoTransitionMaskVisible]);
  const videoComponentStyle = styles.video;

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
        const targetUri = `${videoCacheDirectory}defaut_loop.mp4`;

        const directoryInfo = await FileSystem.getInfoAsync(videoCacheDirectory);
        if (!directoryInfo.exists) {
          await FileSystem.makeDirectoryAsync(videoCacheDirectory, {
            intermediates: true,
          });
        }

        const targetInfo = await FileSystem.getInfoAsync(targetUri);
        if (!targetInfo.exists) {
          if (sourceUri.startsWith('file://')) {
            await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
          } else {
            await FileSystem.downloadAsync(sourceUri, targetUri);
          }
        }

        if (!isMounted) {
          return;
        }
        setResolvedDefaultVideoUri(targetUri);
      } catch (error) {
        console.log('[SharedVideoPlayer] resolve default video error:', error);
      }
    }

    resolveDefaultVideoSource();
    return () => {
      isMounted = false;
    };
  }, [resetAudioTrackIndexes]);

  // 💡 【修正】監聽整個佈局模式（mode）的切換。當變更佈局尺寸時，Android 重新分配解碼緩衝區需要短暫時間，立刻拉起遮罩防止殘影
  useEffect(() => {
    isFullscreenTransitioningRef.current = true;
    setIsVideoTransitionMaskVisible(true);

    const timer = setTimeout(() => {
      isFullscreenTransitioningRef.current = false;
      setIsVideoTransitionMaskVisible(false);
    }, 500); // 220ms 安全時間，給解碼器平滑緩衝

    return () => {
      clearTimeout(timer);
      isFullscreenTransitioningRef.current = false;
      // setIsVideoTransitionMaskVisible(false);
    };
  }, [mode]);

  const restartToken = usePlayerControlStore((state) => state.restartToken);

  useEffect(() => {
    if (!safePlaybackVideoUri || isPreparingSource) {
      return;
    }
    videoRef.current?.seek?.(0);
  }, [currentPlaybackItem?.queueId, safePlaybackVideoUri, restartToken, isPreparingSource]);

  useEffect(() => {
    let isCancelled = false;

    async function switchSourceSafely() {
      resetPlaybackProgress();

      if (!playbackVideoUri) {
        setSafePlaybackVideoUri(null);
        setIsPreparingSource(false);
        setIsWaitingForFirstFrame(false);
        setIsVideoTransitionMaskVisible(false);
        return;
      }

      setIsPreparingSource(true);
      setIsWaitingForFirstFrame(true);
      setIsVideoTransitionMaskVisible(true);

      if (sourceReadyFallbackTimerRef.current) {
        clearTimeout(sourceReadyFallbackTimerRef.current);
      }

      sourceReadyFallbackTimerRef.current = setTimeout(() => {
        setIsWaitingForFirstFrame(false);
        setIsPreparingSource(false);
        setIsVideoTransitionMaskVisible(false);
        sourceReadyFallbackTimerRef.current = null;
      }, SOURCE_READY_FALLBACK_MS);

      await new Promise((resolve) => setTimeout(resolve, 80));

      if (isCancelled) {
        return;
      }

      setSafePlaybackVideoUri(playbackVideoUri);
    }

    switchSourceSafely();

    return () => {
      isCancelled = true;
    };
  }, [playbackVideoUri, resetPlaybackProgress]);

  const handleVideoReadyForDisplay = useCallback(() => {
    if (!isWaitingForFirstFrame) {
      return;
    }

    if (sourceReadyFallbackTimerRef.current) {
      clearTimeout(sourceReadyFallbackTimerRef.current);
      sourceReadyFallbackTimerRef.current = null;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsWaitingForFirstFrame(false);
        setIsPreparingSource(false);
        setIsVideoTransitionMaskVisible(false);
      });
    });
  }, [isWaitingForFirstFrame]);

  const handleVideoLoad = useCallback(
    (payload: any) => {
      const duration = typeof payload?.duration === 'number' ? payload.duration : 0;
      setPlaybackProgress(0, duration);

      // if (sourceReadyFallbackTimerRef.current) {
      //   clearTimeout(sourceReadyFallbackTimerRef.current);
      //   sourceReadyFallbackTimerRef.current = null;
      // }

      // setIsWaitingForFirstFrame(false);
      // setIsPreparingSource(false);
      // setIsVideoTransitionMaskVisible(false);

      const audioTracks = payload?.audioTracks ?? [];
      const vocalTrack = audioTracks[DEFAULT_VOCAL_TRACK_INDEX];
      const accompanimentTrack = audioTracks[DEFAULT_ACCOMPANIMENT_TRACK_INDEX];

      const nextVocalAudioTrackIndex = vocalTrack ? DEFAULT_VOCAL_TRACK_INDEX : null;
      const nextAccompanimentAudioTrackIndex = accompanimentTrack
        ? DEFAULT_ACCOMPANIMENT_TRACK_INDEX
        : null;

      if (
        vocalAudioTrackIndex === nextVocalAudioTrackIndex &&
        accompanimentAudioTrackIndex === nextAccompanimentAudioTrackIndex
      ) {
        return;
      }

      setAudioTrackIndexes({
        vocalAudioTrackIndex: nextVocalAudioTrackIndex,
        accompanimentAudioTrackIndex: nextAccompanimentAudioTrackIndex,
      });
    },
    [accompanimentAudioTrackIndex, setAudioTrackIndexes, setPlaybackProgress, vocalAudioTrackIndex],
  );

  const handleVideoProgress = useCallback(
    (payload: any) => {
      const currentTime = typeof payload?.currentTime === 'number' ? payload.currentTime : 0;
      const duration =
        typeof payload?.seekableDuration === 'number' && payload.seekableDuration > 0
          ? payload.seekableDuration
          : 0;

      const now = Date.now();
      if (now - lastPlaybackProgressUpdateTimeRef.current < 1000) {
        return;
      }

      lastPlaybackProgressUpdateTimeRef.current = now;
      setPlaybackProgress(currentTime, duration);
    },
    [setPlaybackProgress],
  );

  const handleVideoEnd = useCallback(() => {
    if (isDefaultVideo) {
      videoRef.current?.seek?.(0);
      return;
    }

    if (isHandlingVideoEndRef.current) {
      return;
    }

    isHandlingVideoEndRef.current = true;

    skipCurrent()
      .catch((error) => {
        console.log('[SharedVideoPlayer] sync skipCurrent onEnd failed:', error);
        finishCurrentPlaybackItem();
      })
      .finally(() => {
        isHandlingVideoEndRef.current = false;
      });
  }, [finishCurrentPlaybackItem, isDefaultVideo, skipCurrent]);

  const handlingPlaybackErrorKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    handlingPlaybackErrorKeysRef.current.clear();
  }, [currentPlaybackItem?.queueId, playbackVideoUri]);

  const currentQueueId = currentPlaybackItem?.queueId;
  const currentSongId = currentPlaybackItem?.songId;
  const currentTitle = currentPlaybackItem?.title;
  const currentLocalVideoUri = currentPlaybackItem?.localVideoUri;

  const handleVideoError = useCallback(
    (event: unknown) => {
      setIsPreparingSource(false);
      setIsWaitingForFirstFrame(false);
      setIsVideoTransitionMaskVisible(false);

      const errorKey =
        currentQueueId ?? currentSongId ?? playbackVideoUri ?? 'unknown-playback-error';

      if (isDefaultVideo) {
        console.log('[SharedVideoPlayer] onError ignored: default video error');
        return;
      }

      if (handlingPlaybackErrorKeysRef.current.has(errorKey)) {
        return;
      }

      handlingPlaybackErrorKeysRef.current.add(errorKey);

      skipCurrentAfterPlaybackError({
        reason: 'video-error',
        source: 'SharedVideoPlayer',
        error: event,
      }).catch((error) => {
        console.log('[SharedVideoPlayer] skipCurrentAfterPlaybackError failed:', error);
      });
    },
    [
      currentLocalVideoUri,
      currentQueueId,
      currentSongId,
      currentTitle,
      isDefaultVideo,
      playbackVideoUri,
      skipCurrentAfterPlaybackError,
    ],
  );

  useEffect(() => {
    if (!currentPlaybackItem || currentPlaybackItem.localVideoUri || isDefaultVideo) {
      return;
    }

    const errorKey =
      currentPlaybackItem.queueId ?? currentPlaybackItem.songId ?? 'missing-uri-playback-error';

    if (handlingPlaybackErrorKeysRef.current.has(errorKey)) {
      return;
    }

    handlingPlaybackErrorKeysRef.current.add(errorKey);

    skipCurrentAfterPlaybackError({
      reason: 'missing-uri',
      source: 'SharedVideoPlayer',
      error: {
        message: 'currentPlaybackItem exists but localVideoUri is missing.',
        queueId: currentPlaybackItem.queueId,
        songId: currentPlaybackItem.songId,
        title: currentPlaybackItem.title,
      },
    }).catch((error) => {
      console.log('[SharedVideoPlayer] skip missing-uri item failed:', error);
    });
  }, [currentPlaybackItem, isDefaultVideo, skipCurrentAfterPlaybackError]);

  const backgroundMode = useMainBackgroundStore((state) => state.mode);
  const shouldHideVideoPlayer =
    backgroundMode !== 'home' && mode !== 'footerMini' && mode !== 'fullscreen';

  return (
    <View
      pointerEvents={shouldHideVideoPlayer ? 'none' : 'box-none'}
      style={[styles.layer, mode === 'footerMini' && styles.footerMiniLayer]}
    >
      <View style={[styles.videoFrame, videoFrameStyle]}>
        {/* 💡 【關鍵】這層純黑底色永遠都在 zIndex: 0。當 Video 組件透明時，會完美露出這個乾淨的黑底 */}
        <View style={styles.videoBlackBackground} />

        {videoSource ? (
          <Video
            key="global-shared-video-player" // 💡 【核心修正】固定金鑰！不准 React 重新 Unmount/Remount 組件，從此告別點歌全 App 卡死
            ref={videoRef}
            source={videoSource}
            style={videoComponentStyle} // 💡 【核心修正】套用包含動態透明度的樣式
            resizeMode="contain"
            controls={false}
            repeat={isDefaultVideo}
            paused={isDefaultVideo ? false : isPaused}
            muted={false}
            selectedAudioTrack={selectedAudioTrack}
            onLoad={handleVideoLoad}
            onReadyForDisplay={handleVideoReadyForDisplay}
            onProgress={handleVideoProgress}
            progressUpdateInterval={1000}
            onEnd={handleVideoEnd}
            onError={handleVideoError}
            useTextureView={true}
          />
        ) : null}

        {isVideoTransitionMaskVisible && <View style={styles.videoTransitionMask} />}

        <Pressable style={styles.videoPressOverlay} onPress={handleToggleFullscreen} />
      </View>
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
  videoBlackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  videoPressOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  videoTransitionMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 2,
  },
  footerMiniLayer: {
    zIndex: 50,
  },
});
