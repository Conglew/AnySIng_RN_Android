import { Slot } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainFooter } from '@/src/features/main/components/main-footer';
import { MainHeader } from '@/src/features/main/components/main-header';
import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';
import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';

const HOME_BACKGROUND = require('@/assets/images/home-background.png');
const RANKING_BACKGROUND = require('@/assets/images/home-panel-background.png');
const NEW_SONGS_BACKGROUND = require('@/assets/images/home-panel-background.png');
const CATEGORY_BACKGROUND = require('@/assets/images/home-panel-background.png');
const SINGER_BACKGROUND = require('@/assets/images/home-panel-background.png');

export default function TabsLayout() {
  const backgroundMode = useMainBackgroundStore((state) => state.mode);

  const hasClearedPendingPlaylistRef = useRef(false);
  const [isInitialPlaylistCleared, setIsInitialPlaylistCleared] = useState(false);

  const { clearPendingPlaylist } = usePlaybackQueueActions();

  useEffect(() => {
    if (hasClearedPendingPlaylistRef.current) {
      return;
    }

    hasClearedPendingPlaylistRef.current = true;

    clearPendingPlaylist()
      .catch((error) => {
        console.log('[TabsLayout] clear pending playlist failed:', error);
      })
      .finally(() => {
        setIsInitialPlaylistCleared(true);
      });
  }, [clearPendingPlaylist]);

  const isHomeBackground = backgroundMode === 'home';
  const isRankingBackground = backgroundMode === 'ranking';
  const isNewSongsBackground = backgroundMode === 'newsongs';
  const isCategoryBackground = backgroundMode === 'category';
  const isSingreBackground = backgroundMode === 'singer';

  const isPanelBackground = isRankingBackground || isNewSongsBackground || isCategoryBackground;

  return (
    <View style={styles.root}>
      <ImageBackground
        style={[styles.backgroundLayer, !isHomeBackground && styles.hiddenBackground]}
        source={HOME_BACKGROUND}
        resizeMode="cover"
        fadeDuration={0}
      />

      <ImageBackground
        style={[styles.backgroundLayer, !isRankingBackground && styles.hiddenBackground]}
        source={RANKING_BACKGROUND}
        resizeMode="cover"
        fadeDuration={0}
      />

      <ImageBackground
        style={[styles.backgroundLayer, !isNewSongsBackground && styles.hiddenBackground]}
        source={NEW_SONGS_BACKGROUND}
        resizeMode="cover"
        fadeDuration={0}
      />

      <ImageBackground
        style={[styles.backgroundLayer, !isCategoryBackground && styles.hiddenBackground]}
        source={CATEGORY_BACKGROUND}
        resizeMode="cover"
        fadeDuration={0}
      />

      <ImageBackground
        style={[styles.backgroundLayer, !isSingreBackground && styles.hiddenBackground]}
        source={SINGER_BACKGROUND}
        resizeMode="cover"
        fadeDuration={0}
      />

      <View style={styles.page}>
        <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
          <MainHeader showNowPlayingMarquee={isInitialPlaylistCleared} />
        </SafeAreaView>

        <View style={styles.content}>
          <Slot />
        </View>

        <SafeAreaView
          style={[styles.footerSafeArea, !isPanelBackground && styles.footerSafeAreaDark]}
          edges={['bottom']}
        >
          <MainFooter />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },

  hiddenBackground: {
    opacity: 0,
  },

  page: {
    flex: 1,
  },

  headerSafeArea: {
    backgroundColor: 'transparent',
  },

  content: {
    flex: 1,
  },

  footerSafeArea: {
    backgroundColor: 'transparent',
  },

  footerSafeAreaDark: {
    backgroundColor: '#000000',
  },
});
