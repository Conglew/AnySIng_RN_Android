import { Image, Pressable, StyleSheet, View } from 'react-native';

export function MainHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/images/payment-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

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
    justifyContent: 'space-between',
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
    // 測試用，正式可以拿掉
    // backgroundColor: 'red',
  },

  languageIcon: {
    width: '100%',
    height: '100%',
  },
});
