import { Image, Pressable, StyleSheet, View } from 'react-native';

import { NowPlayingMarquee } from '@/src/features/main/components/now-playing-marquee';

export function MainHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/images/payment-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <NowPlayingMarquee />

      <Pressable style={styles.languageButton}>
        <Image
          source={require('@/assets/images/home-language-btn.png')}
          style={styles.languageIcon}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 30,
    paddingVertical: 21,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  logo: {
    width: 560,
    height: 240,
    marginLeft: -210,
    marginTop: 0,
  },

  languageButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  languageIcon: {
    width: '100%',
    height: '100%',
  },
});
