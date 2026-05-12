// import { useEffect, useMemo, useRef } from 'react';
// import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native';
// import Video, { OnLoadData, VideoRef } from 'react-native-video';

// import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
// import { useFullscreenVideoStore } from '@/src/features/main/store/fullscreen-video.store';

// const SCREEN = Dimensions.get('window');

// export function FullscreenVideoBackground() {
//   const progress = useRef(new Animated.Value(0)).current;

//   /**
//    * 全螢幕影片的 Video ref。
//    *
//    * 用途：
//    * 因為這是一個新的 Video instance，
//    * 所以必須在 onLoad 後呼叫 seek(startTime)。
//    */
//   const videoRef = useRef<VideoRef>(null);

//   /**
//    * 防止 onLoad 被重複觸發時重複 seek。
//    */
//   const hasSeekedOnLoadRef = useRef(false);

//   const isVisible = useFullscreenVideoStore((state) => state.isVisible);
//   const videoUri = useFullscreenVideoStore((state) => state.videoUri);
//   const originRect = useFullscreenVideoStore((state) => state.originRect);
//   const hideFullscreenVideo = useFullscreenVideoStore((state) => state.hideFullscreenVideo);
//   const isDefaultVideo = useFullscreenVideoStore((state) => state.isDefaultVideo);
//   const startTime = useFullscreenVideoStore((state) => state.startTime);

//   const isPaused = usePlayerControlStore((state) => state.isPaused);

//   const animatedStyle = useMemo(() => {
//     const startX = originRect?.x ?? 0;
//     const startY = originRect?.y ?? 0;
//     const startWidth = originRect?.width ?? SCREEN.width;
//     const startHeight = originRect?.height ?? SCREEN.height;

//     return {
//       left: progress.interpolate({
//         inputRange: [0, 1],
//         outputRange: [startX, 0],
//       }),
//       top: progress.interpolate({
//         inputRange: [0, 1],
//         outputRange: [startY, 0],
//       }),
//       width: progress.interpolate({
//         inputRange: [0, 1],
//         outputRange: [startWidth, SCREEN.width],
//       }),
//       height: progress.interpolate({
//         inputRange: [0, 1],
//         outputRange: [startHeight, SCREEN.height],
//       }),
//       borderRadius: progress.interpolate({
//         inputRange: [0, 1],
//         outputRange: [12, 0],
//       }),
//       opacity: progress.interpolate({
//         inputRange: [0, 1],
//         outputRange: [0.96, 1],
//       }),
//     };
//   }, [originRect, progress]);

//   useEffect(() => {
//     if (!videoUri || !originRect) {
//       return;
//     }

//     if (isVisible) {
//       hasSeekedOnLoadRef.current = false;
//       progress.setValue(0);

//       Animated.timing(progress, {
//         toValue: 1,
//         duration: 320,
//         useNativeDriver: false,
//       }).start();

//       return;
//     }

//     Animated.timing(progress, {
//       toValue: 0,
//       duration: 260,
//       useNativeDriver: false,
//     }).start();
//   }, [isVisible, originRect, progress, videoUri]);

//   const handleVideoLoad = (payload: OnLoadData) => {
//     console.log('[FullscreenVideoBackground] onLoad:', {
//       duration: payload.duration,
//       startTime,
//     });

//     if (hasSeekedOnLoadRef.current) {
//       return;
//     }

//     hasSeekedOnLoadRef.current = true;

//     /**
//      * startTime 來自小播放器目前播放秒數。
//      *
//      * 注意：
//      * 全螢幕 Video 是新的 instance，
//      * 不會自動沿用小播放器的播放進度。
//      */
//     if (startTime > 0) {
//       requestAnimationFrame(() => {
//         videoRef.current?.seek(startTime);
//       });
//     }
//   };

//   if (!videoUri || !originRect) {
//     return null;
//   }

//   return (
//     <View pointerEvents={isVisible ? 'auto' : 'none'} style={styles.layer}>
//       <Animated.View style={[styles.animatedFrame, animatedStyle]}>
//         <Pressable style={styles.touchArea} onPress={hideFullscreenVideo}>
//           <Video
//             ref={videoRef}
//             source={{ uri: videoUri }}
//             style={styles.video}
//             resizeMode="contain"
//             controls={false}
//             repeat={isDefaultVideo}
//             paused={isPaused}
//             muted={false}
//             onLoad={handleVideoLoad}
//             onError={(error) => {
//               console.log('[FullscreenVideoBackground] error:', error);
//             }}
//           />
//         </Pressable>
//       </Animated.View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   layer: {
//     ...StyleSheet.absoluteFillObject,

//     /**
//      * 這裡建議比主畫面內容高。
//      * 如果你的 _layout.tsx 裡 page zIndex 是 10，
//      * 這裡用 20 才能蓋在上方。
//      */
//     zIndex: 20,
//   },

//   animatedFrame: {
//     position: 'absolute',
//     overflow: 'hidden',
//     backgroundColor: '#000000',
//   },

//   touchArea: {
//     flex: 1,
//   },

//   video: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#000000',
//   },
// });
