import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as SecureStore from 'expo-secure-store';
import { getAccessToken, getUserId } from '@/src/services/auth/auth-token-store';

import { useSongRequestQrPanelStore } from '@/src/features/main/store/song-request-qr-panel.store';

// import QRPanelHand from '@/assets/images/footer-qr-panel-hand.png';
const QR_PANEL_HAND_IMAGE = require('@/assets/images/footer-qr-panel-hand.png');
const QR_PANEL_BG_IMAGE = require('@/assets/images/footer-qr-panel-bg.png');

const SONG_REQUEST_WEB_URL = 'https://www.any-sing.com/';

const SCREEN = Dimensions.get('window');

const PANEL_WIDTH = 250;
const PANEL_HEIGHT = 300;

const SNAP_MARGIN_X = 40;
const SNAP_MARGIN_Y = 120;

const INITIAL_PANEL_X = SNAP_MARGIN_X;
const INITIAL_PANEL_Y = Math.max(
  SNAP_MARGIN_Y,
  Math.min((SCREEN.height - PANEL_HEIGHT) / 2, SCREEN.height - PANEL_HEIGHT - SNAP_MARGIN_Y),
);

export function SongRequestQrPanel() {
  const isVisible = useSongRequestQrPanelStore((state) => state.isVisible);
  const closePanel = useSongRequestQrPanelStore((state) => state.closePanel);

  const [qrUrl, setQrUrl] = useState<string>('');

  const panelPosition = useRef(
    new Animated.ValueXY({
      x: INITIAL_PANEL_X,
      y: INITIAL_PANEL_Y,
    }),
  ).current;

  const lastPanelPositionRef = useRef({
    x: INITIAL_PANEL_X,
    y: INITIAL_PANEL_Y,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          panelPosition.stopAnimation((currentPosition) => {
            lastPanelPositionRef.current = {
              x: currentPosition.x,
              y: currentPosition.y,
            };
          });
        },

        onPanResponderMove: (_, gestureState) => {
          const rawX = lastPanelPositionRef.current.x + gestureState.dx;
          const rawY = lastPanelPositionRef.current.y + gestureState.dy;

          const minX = SNAP_MARGIN_X;
          const maxX = SCREEN.width - PANEL_WIDTH - SNAP_MARGIN_X;
          const minY = SNAP_MARGIN_Y;
          const maxY = SCREEN.height - PANEL_HEIGHT - SNAP_MARGIN_Y;

          const nextX = Math.max(minX, Math.min(rawX, maxX));
          const nextY = Math.max(minY, Math.min(rawY, maxY));

          panelPosition.setValue({
            x: nextX,
            y: nextY,
          });
        },

        onPanResponderRelease: (_, gestureState) => {
          const releasedX = lastPanelPositionRef.current.x + gestureState.dx;
          const releasedY = lastPanelPositionRef.current.y + gestureState.dy;

          const minY = SNAP_MARGIN_Y;
          const maxY = SCREEN.height - PANEL_HEIGHT - SNAP_MARGIN_Y;

          const clampedY = Math.max(minY, Math.min(releasedY, maxY));

          const screenCenterX = SCREEN.width / 2;
          const panelCenterX = releasedX + PANEL_WIDTH / 2;

          const snapX =
            panelCenterX < screenCenterX
              ? SNAP_MARGIN_X
              : SCREEN.width - PANEL_WIDTH - SNAP_MARGIN_X;

          lastPanelPositionRef.current = {
            x: snapX,
            y: clampedY,
          };

          Animated.spring(panelPosition, {
            toValue: {
              x: snapX,
              y: clampedY,
            },
            useNativeDriver: false,
            friction: 8,
            tension: 80,
          }).start();
        },
      }),
    [panelPosition],
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const buildQrUrl = async () => {
      try {
        const token = await getAccessToken();
        const userId = await getUserId();

        if (!token || !userId) {
          console.log('[SongRequestQrPanel] missing token or userId', {
            hasToken: Boolean(token),
            hasUserId: Boolean(userId),
          });

          setQrUrl('');
          return;
        }

        const params = new URLSearchParams({
          token,
          userId,
          room: userId,
        });

        setQrUrl(`${SONG_REQUEST_WEB_URL}?${params.toString()}`);
      } catch (error) {
        console.log('[SongRequestQrPanel] build QR url failed:', error);
        setQrUrl('');
      }
    };

    buildQrUrl();
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={closePanel} />

      <Animated.View
        style={[
          styles.panel,
          {
            left: panelPosition.x,
            top: panelPosition.y,
          },
        ]}
      >
        <ImageBackground
          source={QR_PANEL_BG_IMAGE}
          style={styles.panelClip}
          imageStyle={styles.panelClipImage}
          resizeMode="cover"
          blurRadius={8}
          {...panResponder.panHandlers}
        >
          <View pointerEvents="none" style={styles.qrCard}>
            <View style={styles.qrBox}>
              {/* <QRCode
                value={SONG_REQUEST_URL}
                size={200}
                backgroundColor="#FFFFFF"
                color="#111111"
              /> */}
              {qrUrl ? (
                <QRCode value={qrUrl} size={200} backgroundColor="#FFFFFF" color="#111111" />
              ) : (
                <Text style={styles.qrLoadingText}>QR Code 載入中</Text>
              )}
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>掃描點歌</Text>

              <Image source={QR_PANEL_HAND_IMAGE} style={styles.handIcon} resizeMode="contain" />
            </View>
          </View>
        </ImageBackground>

        <View style={styles.handle} {...panResponder.panHandlers} />

        <Pressable style={styles.closeButton} onPress={closePanel}>
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    // alignItems: 'center',
    // justifyContent: 'center',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  panel: {
    position: 'absolute',
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'visible',
  },

  panelClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  panelClipImage: {
    borderRadius: 16,
    opacity: 0.5,
  },

  handle: {
    position: 'absolute',
    top: -24,
    width: 50,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  qrCard: {
    width: 200,
    height: 200,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    // backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  qrBox: {
    width: 200,
    height: 200,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    alignSelf: 'flex-start',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 8,
    alignSelf: 'flex-start',
    marginLeft: 28,
    marginRight: 28,
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 15,
    fontWeight: '600',
  },

  closeButton: {
    position: 'absolute',
    bottom: -65,
    width: 42,
    height: 42,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '300',
    lineHeight: 42,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    transform: [{ translateY: -3 }],
  },

  handIcon: {
    position: 'absolute',
    right: -40,
    bottom: -50,
    width: 131.6,
    height: 118,
  },

  qrLoadingText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
});
