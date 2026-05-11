import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Video, { SelectedTrackType, type SelectedTrack } from 'react-native-video';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';

import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';

type Props = {
  videoUri?: string;
  videoAsset?: number;
};

/*
 * 依照你的 MKV 音軌順序調整。
 * 注意：這裡是 react-native-video onLoad 回傳的 audioTracks 陣列 index。
 */
const DEFAULT_VOCAL_TRACK_INDEX = 0;
const DEFAULT_ACCOMPANIMENT_TRACK_INDEX = 1;

const DEFAULT_LOCAL_VIDEO_ASSET = require('@/assets/demo/video/Test.mkv');

export function HomeSidePanel({ videoUri, videoAsset }: Props) {
  const videoRef = useRef<any>(null);
  const [resolvedVideoUri, setResolvedVideoUri] = useState<string | null>(null);
  const [videoLoadError, setVideoLoadError] = useState<string>('');

  const currentPlaybackItem = usePlaybackQueueStore((state) => state.currentItem);
  const finishCurrentPlaybackItem = usePlaybackQueueStore((state) => state.finishCurrent);

  const playbackVideoUri = currentPlaybackItem?.localVideoUri ?? resolvedVideoUri;

  const isPaused = usePlayerControlStore((state) => state.isPaused);
  const audioTrackMode = usePlayerControlStore((state) => state.audioTrackMode);

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

      <View style={styles.playerFrame}>
        {playbackVideoUri ? (
          <Video
            ref={videoRef}
            key={currentPlaybackItem?.queueId ?? playbackVideoUri}
            source={{ uri: playbackVideoUri }}
            style={styles.video}
            resizeMode="contain"
            controls={false}
            repeat={false}
            paused={isPaused}
            muted={false}
            selectedAudioTrack={selectedAudioTrack}
            onLoad={(payload: any) => {
              console.log('[ReactNativeVideo] playbackVideoUri:', playbackVideoUri);
              console.log('[ReactNativeVideo] currentPlaybackItem:', currentPlaybackItem);
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
                songId: currentPlaybackItem?.songId,
                song: currentPlaybackItem?.song,
              });

              finishCurrentPlaybackItem();
            }}
            onError={(event) => {
              console.log('[ReactNativeVideo] error:', event);
              setVideoLoadError(JSON.stringify(event));

              finishCurrentPlaybackItem();
            }}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>
              {videoLoadError ? `影片載入失敗：${videoLoadError}` : '影片載入中'}
            </Text>
          </View>
        )}
      </View>

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
});
