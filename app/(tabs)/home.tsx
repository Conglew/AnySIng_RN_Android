import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const HOME_CARDS = [
  {
    title: '歌手',
    image: require('@/assets/images/payment-singer-front.png'),
  },
  {
    title: '分類',
    image: require('@/assets/images/payment-plan-bg.png'),
  },
  {
    title: '新歌',
    image: require('@/assets/images/payment-plan-bg.png'),
  },
  {
    title: '排行榜',
    image: require('@/assets/images/payment-plan-bg.png'),
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.cardSection}>
        {HOME_CARDS.map((item) => (
          <Pressable key={item.title} style={styles.menuCard}>
            <Image source={item.image} style={styles.menuCardImage} resizeMode="cover" />

            <View style={styles.menuCardOverlay}>
              <Text style={styles.menuCardTitle}>{item.title}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.sidePanel}>
        <Pressable style={styles.sideButton}>
          <Text style={styles.sideButtonText}>設定</Text>
        </Pressable>

        <Pressable style={styles.sideButton}>
          <Text style={styles.sideButtonText}>我的歌單</Text>
        </Pressable>

        <Pressable style={styles.sideButton}>
          <Text style={styles.sideButtonText}>緩存下載</Text>
        </Pressable>
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
    gap: 28,
  },

  menuCard: {
    width: 112,
    height: 310,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  menuCardImage: {
    width: '100%',
    height: '100%',
  },

  menuCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 26,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  menuCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    writingDirection: 'ltr',
  },

  sidePanel: {
    width: 280,
    gap: 18,
  },

  sideButton: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  sideButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
