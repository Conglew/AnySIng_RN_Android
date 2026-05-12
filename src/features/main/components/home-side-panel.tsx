import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';
import Video, { SelectedTrackType, type SelectedTrack } from 'react-native-video';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';

type Props = {
  videoUri?: string;
  videoAsset?: number;

  onOpenMySongsPanel?: () => void;
  onOpenCachedSongsPanel?: () => void;
};

/*
 * 依照你的 MKV 音軌順序調整。
 * 注意：這裡是 react-native-video onLoad 回傳的 audioTracks 陣列 index。
 */
const DEFAULT_VOCAL_TRACK_INDEX = 0;
const DEFAULT_ACCOMPANIMENT_TRACK_INDEX = 1;

const DEFAULT_LOCAL_VIDEO_ASSET = require('@/assets/demo/video/Test.mkv');

export function HomeSidePanel({
  videoUri,
  videoAsset,
  onOpenMySongsPanel,
  onOpenCachedSongsPanel,
}: Props) {
  const videoRef = useRef<any>(null);
  const [resolvedVideoUri, setResolvedVideoUri] = useState<string | null>(null);
  const [videoLoadError, setVideoLoadError] = useState<string>('');

  const playerFrameRef = useRef<View>(null);
  const showFullscreenVideo = useFullscreenVideoStore((state) => state.showFullscreenVideo);

  const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const finishCurrentPlaybackItem = usePlaybackQueueStore((state) => state.finishCurrent);

  // const isPaused = usePlayerControlStore((state) => state.isPaused);
  // const audioTrackMode = usePlayerControlStore((state) => state.audioTrackMode);

  const isPaused = usePlayerControlStore((state) => state.isPaused);
  const setPaused = usePlayerControlStore((state) => state.setPaused);
  const audioTrackMode = usePlayerControlStore((state) => state.audioTrackMode);

  // const setPaused = usePlayerControlStore((state) => state.setPaused);

  const playbackVideoUri = currentPlaybackItem?.localVideoUri ?? resolvedVideoUri;
  const isDefaultVideo = !currentPlaybackItem;
  // const shouldPauseVideo = currentPlaybackItem ? isPaused : false;

  const { skipCurrent } = usePlaybackQueueActions();
  const isFinishingPlaybackRef = useRef(false);

  const restartToken = usePlayerControlStore((state) => state.restartToken);

  const vocalAudioTrackIndex = usePlayerControlStore((state) => state.vocalAudioTrackIndex);
  const accompanimentAudioTrackIndex = usePlayerControlStore(
    (state) => state.accompanimentAudioTrackIndex,
  );
  const setAudioTrackIndexes = usePlayerControlStore((state) => state.setAudioTrackIndexes);
  const resetAudioTrackIndexes = usePlayerControlStore((state) => state.resetAudioTrackIndexes);

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

  const handleOpenFullscreenVideo = () => {
    console.log('[HomeSidePanel] playerFrame pressed:', {
      playbackVideoUri,
    });

    if (!playbackVideoUri) {
      console.log('[HomeSidePanel] fullscreen ignored: missing playbackVideoUri');
      return;
    }

    const nodeHandle = findNodeHandle(playerFrameRef.current);

    if (!nodeHandle) {
      console.log('[HomeSidePanel] fullscreen ignored: missing nodeHandle');
      return;
    }

    UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
      console.log('[HomeSidePanel] fullscreen origin rect:', {
        x,
        y,
        width,
        height,
      });

      showFullscreenVideo({
        videoUri: playbackVideoUri,
        originRect: {
          x,
          y,
          width,
          height,
        },
        isDefaultVideo,
      });
    });
  };

  useEffect(() => {
    if (!playbackVideoUri) {
      return;
    }

    console.log('[HomeSidePanel] restart current video:', {
      restartToken,
      playbackVideoUri,
    });

    videoRef.current?.seek?.(0);
  }, [playbackVideoUri, restartToken]);

  useEffect(() => {
    let isMounted = true;

    async function resolveVideoSource() {
      try {
        setVideoLoadError('');
        setResolvedVideoUri(null);
        resetAudioTrackIndexes();

        if (videoUri) {
          console.log('[HomeSidePanel] using remote videoUri:', videoUri);

          if (!isMounted) {
            return;
          }

          setResolvedVideoUri(videoUri);
          return;
        }

        const asset = Asset.fromModule(videoAsset ?? DEFAULT_LOCAL_VIDEO_ASSET);

        await asset.downloadAsync();

        const sourceUri = asset.localUri ?? asset.uri;

        console.log('[HomeSidePanel] asset.uri:', asset.uri);
        console.log('[HomeSidePanel] asset.localUri:', asset.localUri);
        console.log('[HomeSidePanel] sourceUri before cache copy:', sourceUri);

        if (!sourceUri) {
          throw new Error('Video sourceUri is empty.');
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

        console.log('[HomeSidePanel] video targetUri:', targetUri);
        console.log('[HomeSidePanel] copied file info:', copiedFileInfo);

        if (!copiedFileInfo.exists) {
          throw new Error('Copied MKV file does not exist.');
        }

        if (!isMounted) {
          return;
        }

        setResolvedVideoUri(targetUri);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.log('[HomeSidePanel] resolveVideoSource error:', message);

        if (!isMounted) {
          return;
        }

        setVideoLoadError(message);
      }
    }

    resolveVideoSource();

    return () => {
      isMounted = false;
    };
  }, [resetAudioTrackIndexes, videoAsset, videoUri]);

  useEffect(() => {
    console.log('[HomeSidePanel] audioTrackMode:', audioTrackMode);
    console.log('[HomeSidePanel] selectedAudioTrack:', selectedAudioTrack);
  }, [audioTrackMode, selectedAudioTrack]);

  useEffect(() => {
    setPaused(false);
  }, [setPaused]);

  return (
    <View style={styles.sidePanel}>
      <View style={styles.buttonGroup}>
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
          style={({ pressed }) => [styles.sideButton, pressed && styles.sideButtonPressed]}
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
        onPress={handleOpenFullscreenVideo}
        pointerEvents="none"
      >
        {playbackVideoUri ? (
          <View pointerEvents="none" style={styles.videoTouchBlocker}>
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
              onLoad={(payload: any) => {
                console.log('[ReactNativeVideo] playbackVideoUri:', playbackVideoUri);
                console.log('[ReactNativeVideo] currentPlaybackItem:', currentPlaybackItem);
                console.log('[ReactNativeVideo] isDefaultVideo:', isDefaultVideo);
                console.log('[ReactNativeVideo] isPaused:', isPaused);
                console.log('[ReactNativeVideo] onLoad payload:', payload);
                console.log('[ReactNativeVideo] audioTracks:', payload?.audioTracks);

                const audioTracks = payload?.audioTracks ?? [];

                const vocalTrack = audioTracks[DEFAULT_VOCAL_TRACK_INDEX];
                const accompanimentTrack = audioTracks[DEFAULT_ACCOMPANIMENT_TRACK_INDEX];

                setAudioTrackIndexes({
                  vocalAudioTrackIndex: vocalTrack ? DEFAULT_VOCAL_TRACK_INDEX : null,
                  accompanimentAudioTrackIndex: accompanimentTrack
                    ? DEFAULT_ACCOMPANIMENT_TRACK_INDEX
                    : null,
                });
              }}
              onEnd={() => {
                console.log('[ReactNativeVideo] playback ended:', {
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
                    console.log('[ReactNativeVideo] sync skipCurrent onEnd failed:', error);
                    finishCurrentPlaybackItem();
                  })
                  .finally(() => {
                    isFinishingPlaybackRef.current = false;
                  });
              }}
              onError={(event) => {
                console.log('[ReactNativeVideo] error:', event);
                setVideoLoadError(JSON.stringify(event));

                if (isDefaultVideo) {
                  return;
                }

                if (isFinishingPlaybackRef.current) {
                  return;
                }

                isFinishingPlaybackRef.current = true;

                skipCurrent()
                  .catch((error) => {
                    console.log('[ReactNativeVideo] sync skipCurrent onError failed:', error);
                    finishCurrentPlaybackItem();
                  })
                  .finally(() => {
                    isFinishingPlaybackRef.current = false;
                  });
              }}
            />
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>
              {videoLoadError ? `影片載入失敗：${videoLoadError}` : '影片載入中'}
            </Text>
          </View>
        )}
      </Pressable>

      {/* <Text style={styles.audioModeText}>
        {audioTrackMode === 'vocal' ? '原唱模式' : '伴奏模式'}
      </Text> */}
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

  sideButton: {
    width: 358,
    height: 67,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  video: {
    width: '100%',
    height: '100%',
  },

  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },

  audioModeText: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  playerFramePressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  videoTouchBlocker: {
    width: '100%',
    height: '100%',
  },
});
