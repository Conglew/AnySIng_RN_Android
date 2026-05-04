import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VLCPlayer } from 'react-native-vlc-media-player';

const TEST_VIDEO_URL = 'https://your-domain.com/videos/test.mkv';

type VlcProgressEvent = {
  nativeEvent?: {
    currentTime?: number;
    position?: number;
    duration?: number;
  };
  currentTime?: number;
  position?: number;
  duration?: number;
};

export default function HomeScreen() {
  const playerRef = useRef<VLCPlayer>(null);

  const [paused, setPaused] = useState(false);
  const [statusText, setStatusText] = useState('Ready');
  const [currentTime, setCurrentTime] = useState(0);

  const handleTogglePlay = () => {
    setPaused((current) => !current);
  };

  const handleProgress = (event: VlcProgressEvent) => {
    console.log('[VLCPlayer] progress:', event);

    const current = event.nativeEvent?.currentTime ?? event.currentTime;

    if (typeof current === 'number') {
      setCurrentTime(current);
    }
  };

  const handlePlaying = () => {
    console.log('[VLCPlayer] playing');
    setStatusText('Playing');
  };

  const handlePaused = () => {
    console.log('[VLCPlayer] paused');
    setStatusText('Paused');
  };

  const handleBuffering = (event: unknown) => {
    console.log('[VLCPlayer] buffering:', event);
    setStatusText('Buffering');
  };

  const handleStopped = () => {
    console.log('[VLCPlayer] stopped');
    setStatusText('Stopped');
  };

  const handleEnd = () => {
    console.log('[VLCPlayer] ended');
    setStatusText('Ended');
  };

  const handleError = (event: unknown) => {
    console.log('[VLCPlayer] error:', event);
    setStatusText('Error');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VLC MKV Player Test</Text>

      <View style={styles.playerFrame}>
        <VLCPlayer
          ref={playerRef}
          source={{
            uri: TEST_VIDEO_URL,
          }}
          style={styles.player}
          paused={paused}
          autoplay={true}
          resizeMode="contain"
          onPlaying={handlePlaying}
          onPaused={handlePaused}
          onBuffering={handleBuffering}
          onProgress={handleProgress}
          onStopped={handleStopped}
          onEnd={handleEnd}
          onError={handleError}
        />
      </View>

      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>Source: MKV</Text>
        <Text style={styles.infoText}>Status: {statusText}</Text>
        <Text style={styles.infoText}>Current Time: {currentTime.toFixed(2)}</Text>
      </View>

      <Pressable style={styles.controlButton} onPress={handleTogglePlay}>
        <Text style={styles.controlButtonText}>{paused ? 'Play' : 'Pause'}</Text>
      </Pressable>
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
  title: {
    marginBottom: 20,
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
  infoPanel: {
    marginTop: 18,
    alignItems: 'center',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  controlButton: {
    minWidth: 140,
    height: 48,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#FF7A00',
    paddingHorizontal: 28,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
