import {
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { HomeSidePanel } from '@/src/features/main/components/home-side-panel';

type HomeCard = {
  title: string;
  image: ImageSourcePropType;
  foregroundImage?: ImageSourcePropType;
  foregroundStyle?: ViewStyle;
};

const HOME_CARDS: HomeCard[] = [
  {
    title: '歌手',
    image: require('@/assets/images/home-singer-bg.png'),
    foregroundImage: require('@/assets/images/payment-singer-front.png'),
    foregroundStyle: {
      left: -120,
      bottom: -5,
      width: 244,
      height: 232,
    },
  },
  {
    title: '分類',
    image: require('@/assets/images/home-categ-bg.png'),
    foregroundImage: require('@/assets/images/home-categories-bg-front.png'),
    foregroundStyle: {
      left: -50,
      bottom: -35,
      width: 212,
      height: 195,
    },
  },
  {
    title: '新歌',
    image: require('@/assets/images/home-new-bg.png'),
    foregroundImage: require('@/assets/images/home-new-bg-front.png'),
    foregroundStyle: {
      left: -29,
      bottom: -15,
      width: 179,
      height: 269,
    },
  },
  {
    title: '排行榜',
    image: require('@/assets/images/home-ranger-bg.png'),
    foregroundImage: require('@/assets/images/home-ranger-bg-front.png'),
    foregroundStyle: {
      left: -40,
      bottom: 0,
      width: 264,
      height: 264,
    },
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.cardSection}>
        {HOME_CARDS.map((item) => (
          <View key={item.title} style={styles.cardWrapper}>
            <Pressable
              style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            >
              <ImageBackground
                source={item.image}
                style={styles.menuCardBackground}
                imageStyle={styles.menuCardBackgroundImage}
                resizeMode="cover"
              >
                <View style={styles.menuCardOverlay}>
                  {/* <Text style={styles.menuCardTitle}>{item.title}</Text> */}
                  <View style={styles.verticalTitleGroup}>
                    {item.title.split('').map((char, index) => (
                      <Text key={`${item.title}-${index}`} style={styles.menuCardTitle}>
                        {char}
                      </Text>
                    ))}
                  </View>
                </View>
              </ImageBackground>
            </Pressable>

            {item.foregroundImage ? (
              <View pointerEvents="none" style={[styles.cardForegroundLayer, item.foregroundStyle]}>
                <Image
                  source={item.foregroundImage}
                  style={styles.cardForegroundImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.sidePanel}>
        <HomeSidePanel videoSource={require('@/assets/demo/video/Test.mkv')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 60,
  },

  cardWrapper: {
    width: 150,
    height: 480,
    position: 'relative',
  },

  menuCard: {
    width: 150,
    height: 480,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  menuCardBackground: {
    width: '100%',
    height: '100%',
  },

  menuCardBackgroundImage: {
    borderRadius: 25,
  },

  menuCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  menuCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 26,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  verticalTitleGroup: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },

  menuCardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },

  cardForegroundLayer: {
    position: 'absolute',
    zIndex: 10,
  },

  cardForegroundImage: {
    width: '100%',
    height: '100%',
  },

  sidePanel: {
    width: 358,
  },
});
