import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  videoSource?: ImageSourcePropType | string;
};

export function HomeSidePanel({ videoSource }: Props) {
  const player = useVideoPlayer(
    videoSource ?? require('@/assets/demo/video/Test.mkv'),
    (playerInstance) => {
      playerInstance.loop = true;
      playerInstance.muted = true;
      playerInstance.play();
    },
  );

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
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="cover"
          surfaceType="textureView"
        />
      </View>
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
});
