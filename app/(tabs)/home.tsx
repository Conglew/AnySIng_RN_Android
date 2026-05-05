import { useEvent } from 'expo';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { VideoView, useVideoPlayer, type AudioTrack } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PLAYER_MODE = 'expo-video';

export default function HomeScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Loading local MKV...');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null);

  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const loadLocalVideo = async () => {
      try {
        // React Native / Expo 載入本地 asset 時需要使用 require。
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const asset = Asset.fromModule(require('../../assets/demo/video/Test.mkv'));

        await asset.downloadAsync();

        const sourceUri = asset.localUri ?? asset.uri;
        const targetUri = `${FileSystem.documentDirectory}Test.mkv`;

        const existingFileInfo = await FileSystem.getInfoAsync(targetUri);

        if (existingFileInfo.exists) {
          await FileSystem.deleteAsync(targetUri);
        }

        await FileSystem.copyAsync({
          from: sourceUri,
          to: targetUri,
        });

        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        console.log('[ExpoVideo] source uri:', sourceUri);
        console.log('[ExpoVideo] target uri:', targetUri);
        console.log('[ExpoVideo] file info:', fileInfo);

        setVideoUri(targetUri);
        setStatusText('Ready');
      } catch (error) {
        console.log('[ExpoVideo] failed to load local mkv:', error);
        setStatusText('Failed to load local MKV');
      }
    };

    loadLocalVideo();
  }, []);

  const player = useVideoPlayer(
    videoUri
      ? {
          uri: videoUri,
        }
      : null,
    (playerInstance) => {
      playerInstance.loop = false;
      playerInstance.muted = muted;
      playerInstance.volume = volume;
      playerInstance.audioMixingMode = 'doNotMix';

      if (videoUri) {
        playerInstance.play();
      }
    },
  );

  const playingState = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const sourceLoadState = useEvent(player, 'sourceLoad', null);

  const audioTracksChangeState = useEvent(player, 'availableAudioTracksChange', null);

  const audioTrackChangeState = useEvent(player, 'audioTrackChange', null);

  useEffect(() => {
    const tracks = sourceLoadState?.availableAudioTracks ?? [];

    console.log('[ExpoVideo] source loaded:', sourceLoadState);
    console.log('[ExpoVideo] source loaded audio tracks:', tracks);

    setAudioTracks(tracks);

    const firstTrack = tracks[0];

    if (firstTrack && !player.audioTrack) {
      player.audioTrack = firstTrack;
      setSelectedAudioTrackId(firstTrack.id ?? null);
    }
  }, [player, sourceLoadState]);

  useEffect(() => {
    const tracks = audioTracksChangeState?.availableAudioTracks ?? [];

    console.log('[ExpoVideo] available audio tracks changed:', tracks);

    setAudioTracks(tracks);
  }, [audioTracksChangeState]);

  useEffect(() => {
    const currentAudioTrack = audioTrackChangeState?.audioTrack ?? null;

    console.log('[ExpoVideo] audio track changed:', currentAudioTrack);

    setSelectedAudioTrackId(currentAudioTrack?.id ?? null);
  }, [audioTrackChangeState]);

  useEffect(() => {
    setStatusText(playingState.isPlaying ? 'Playing' : 'Paused');
  }, [playingState.isPlaying]);

  const handleTogglePlay = () => {
    if (player.playing) {
      player.pause();
      return;
    }

    player.play();
  };

  const handleDecreaseVolume = () => {
    const nextVolume = Math.max(0, Number((volume - 0.1).toFixed(1)));

    player.volume = nextVolume;
    setVolume(nextVolume);

    console.log('[ExpoVideo] volume decreased:', nextVolume);
  };

  const handleIncreaseVolume = () => {
    const nextVolume = Math.min(1, Number((volume + 0.1).toFixed(1)));

    player.volume = nextVolume;
    setVolume(nextVolume);

    if (muted && nextVolume > 0) {
      player.muted = false;
      setMuted(false);
    }

    console.log('[ExpoVideo] volume increased:', nextVolume);
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;

    player.muted = nextMuted;
    setMuted(nextMuted);

    console.log('[ExpoVideo] muted:', nextMuted);
  };

  const handleSelectAudioTrack = (track: AudioTrack) => {
    console.log('[ExpoVideo] select audio track:', track);

    player.audioTrack = track;
    setSelectedAudioTrackId(track.id ?? null);
  };

  const duration = sourceLoadState?.duration ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.modeLabel}>Current Player: {PLAYER_MODE}</Text>
        <Text style={styles.title}>MKV Player Test</Text>
      </View>

      <View style={styles.playerFrame}>
        {videoUri ? (
          <VideoView
            player={player}
            style={styles.player}
            nativeControls={false}
            contentFit="contain"
          />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Loading MKV...</Text>
          </View>
        )}
      </View>

      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>Source: assets/demo/video/Test.mkv</Text>
        <Text style={styles.infoText}>Status: {statusText}</Text>
        <Text style={styles.infoText}>Duration: {duration.toFixed(2)}</Text>
        <Text style={styles.infoText}>Audio Tracks: {audioTracks.length}</Text>
        <Text style={styles.infoText}>Volume: {(volume * 100).toFixed(0)}%</Text>
        <Text style={styles.infoText}>Muted: {muted ? 'true' : 'false'}</Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.controlButton} onPress={handleTogglePlay}>
          <Text style={styles.controlButtonText}>{player.playing ? 'Pause' : 'Play'}</Text>
        </Pressable>

        <Pressable style={styles.controlButton} onPress={handleDecreaseVolume}>
          <Text style={styles.controlButtonText}>Volume -</Text>
        </Pressable>

        <Pressable style={styles.controlButton} onPress={handleIncreaseVolume}>
          <Text style={styles.controlButtonText}>Volume +</Text>
        </Pressable>

        <Pressable style={styles.controlButton} onPress={handleToggleMute}>
          <Text style={styles.controlButtonText}>{muted ? 'Unmute' : 'Mute'}</Text>
        </Pressable>
      </View>

      <View style={styles.audioTrackPanel}>
        {audioTracks.map((track, index) => {
          const isSelected = selectedAudioTrackId !== null && track.id === selectedAudioTrackId;

          return (
            <Pressable
              key={track.id ?? `${track.language}-${index}`}
              style={[styles.audioTrackButton, isSelected && styles.audioTrackButtonSelected]}
              onPress={() => handleSelectAudioTrack(track)}
            >
              <Text style={styles.audioTrackButtonText}>
                Track {index}
                {track.language ? ` / ${track.language}` : ''}
                {track.label ? ` / ${track.label}` : ''}
                {track.id ? ` / ${track.id}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#111111',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modeLabel: {
    marginBottom: 8,
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  playerFrame: {
    width: 720,
    height: 405,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  infoPanel: {
    marginTop: 18,
    alignItems: 'center',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  controlsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    minWidth: 120,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#FF7A00',
    paddingHorizontal: 20,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  audioTrackPanel: {
    width: 720,
    marginTop: 18,
    gap: 8,
  },
  audioTrackButton: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
  },
  audioTrackButtonSelected: {
    backgroundColor: '#FF7A00',
  },
  audioTrackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
