import { Slot } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainFooter } from '@/src/features/main/components/main-footer';
import { MainHeader } from '@/src/features/main/components/main-header';
import { useMainBackgroundStore } from '@/src/features/main/store/main-background.store';
import { usePlaybackQueueActions } from '@/src/features/player/hook/use-playback-queue-actions';

import { useSocketConnection } from '@/src/services/socket/use-socket-connection';

// import { FullscreenVideoBackground } from '@/src/features/main/components/fullscreen-video-background';
import { SharedVideoPlayer } from '@/src/features/main/components/shared-video-player';

import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';

import { QueuedSongsPanel } from '@/src/features/main/components/queued-songs-panel';

import { SongRequestQrPanel } from '@/src/features/main/components/song-request-qr-panel';

import { usePlayerSocketControls } from '@/src/features/player/hook/use-player-socket-controls';

const HOME_BACKGROUND = require('@/assets/images/home-background.png');
const RANKING_BACKGROUND = require('@/assets/images/home-panel-background.png');
const NEW_SONGS_BACKGROUND = require('@/assets/images/home-panel-background.png');
const CATEGORY_BACKGROUND = require('@/assets/images/home-panel-background.png');
const SINGER_BACKGROUND = require('@/assets/images/home-panel-background.png');

export default function TabsLayout() {
  const backgroundMode = useMainBackgroundStore((state) => state.mode);

  const videoMode = useFullscreenVideoStore((state) => state.mode);
  const isVideoFullscreen = videoMode === 'fullscreen';

  // const [isFullscreenChromeVisible, setIsFullscreenChromeVisible] = useState(true);
  const isFullscreenChromeVisible = useFullscreenVideoStore(
    (state) => state.isFullscreenChromeVisible,
  );
  const showFullscreenChrome = useFullscreenVideoStore((state) => state.showFullscreenChrome);
  const hideFullscreenChrome = useFullscreenVideoStore((state) => state.hideFullscreenChrome);

  const fullscreenChromeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasClearedPendingPlaylistRef = useRef(false);
  // const [isInitialPlaylistCleared, setIsInitialPlaylistCleared] = useState(false);
  const { isSocketInitialized } = useSocketConnection();

  const { clearPendingPlaylist } = usePlaybackQueueActions();

  /**
   * 監聽 Web 端透過 Socket 發來的播放控制指令。
   * 例如：Web 按「切歌」後，App 收到 nextSong 並執行本機 finishCurrent。
   */
  usePlayerSocketControls(isSocketInitialized);

  const clearFullscreenChromeTimer = useCallback(() => {
    if (fullscreenChromeTimerRef.current) {
      clearTimeout(fullscreenChromeTimerRef.current);
      fullscreenChromeTimerRef.current = null;
    }
  }, []);

  const resetFullscreenChromeTimer = useCallback(() => {
    if (!isVideoFullscreen) {
      return;
    }

    showFullscreenChrome();

    clearFullscreenChromeTimer();

    fullscreenChromeTimerRef.current = setTimeout(() => {
      hideFullscreenChrome();
    }, 5000);
  }, [
    clearFullscreenChromeTimer,
    hideFullscreenChrome,
    isVideoFullscreen,
    showFullscreenChrome,
  ]);

  useEffect(() => {
    if (!isVideoFullscreen) {
      clearFullscreenChromeTimer();
      showFullscreenChrome();
      return;
    }
  
    resetFullscreenChromeTimer();
  
    return () => {
      clearFullscreenChromeTimer();
    };
  }, [
    clearFullscreenChromeTimer,
    isVideoFullscreen,
    resetFullscreenChromeTimer,
    showFullscreenChrome,
  ]);

  useEffect(() => {
    if (hasClearedPendingPlaylistRef.current) {
      return;
    }

    hasClearedPendingPlaylistRef.current = true;

    // clearPendingPlaylist()
    //   .catch((error) => {
    //     console.log('[TabsLayout] clear pending playlist failed:', error);
    //   })
    //   .finally(() => {
    //     setIsInitialPlaylistCleared(true);
    //   });
    clearPendingPlaylist().catch((error) => {
      console.log('[TabsLayout] clear pending playlist failed:', error);
    });
  }, [clearPendingPlaylist]);

  const isHomeBackground = backgroundMode === 'home';
  const isRankingBackground = backgroundMode === 'ranking';
  const isNewSongsBackground = backgroundMode === 'newsongs';
  const isCategoryBackground = backgroundMode === 'category';
  const isSingreBackground = backgroundMode === 'singer';

  const isPanelBackground =
    isRankingBackground || isNewSongsBackground || isCategoryBackground || isSingreBackground;

  const shouldShowChrome = !isVideoFullscreen || isFullscreenChromeVisible;

  return (
    <View
      style={styles.root}
      // onStartShouldSetResponderCapture={() => {
      //   if (!isVideoFullscreen) {
      //     return false;
      //   }
    
      //   if (!isFullscreenChromeVisible) {
      //     return false;
      //   }
    
      //   resetFullscreenChromeTimer();
      //   return false;
      // }}
      onMoveShouldSetResponderCapture={() => {
        resetFullscreenChromeTimer();
        return false;
      }}
    >
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

      {/* <FullscreenVideoBackground /> */}
      {/* <SharedVideoPlayer /> */}

      <View style={styles.page}>
        <SafeAreaView
          style={[
            styles.headerSafeArea,
            isVideoFullscreen && !shouldShowChrome && styles.hiddenChrome,
          ]}
          edges={['top']}
          pointerEvents={shouldShowChrome ? 'auto' : 'none'}
        >
          <MainHeader showNowPlayingMarquee={isSocketInitialized} />
        </SafeAreaView>

        <View style={styles.content}>
          <Slot />
        </View>

        <SafeAreaView
          style={[
            styles.footerSafeArea,
            !isVideoFullscreen && !isPanelBackground && styles.footerSafeAreaDark,
            isVideoFullscreen && styles.footerSafeAreaTransparent,
            isVideoFullscreen && !shouldShowChrome && styles.hiddenChrome,
          ]}
          edges={['bottom']}
          pointerEvents={shouldShowChrome ? 'auto' : 'none'}
        >
          <MainFooter />
        </SafeAreaView>

        <SharedVideoPlayer />

        <QueuedSongsPanel />

        <SongRequestQrPanel />
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
    zIndex: 10,
    position: 'relative',
  },

  headerSafeArea: {
    backgroundColor: 'transparent',
    zIndex: 40,
  },

  content: {
    flex: 1,
    zIndex: 10,
  },

  footerSafeArea: {
    backgroundColor: 'transparent',
    zIndex: 40,
  },

  footerSafeAreaDark: {
    backgroundColor: '#000000',
  },

  hiddenChrome: {
    opacity: 0,
  },

  footerSafeAreaTransparent: {
    backgroundColor: 'transparent',
  },
});
