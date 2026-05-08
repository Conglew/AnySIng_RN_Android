import { Image, Pressable, StyleSheet, View } from 'react-native';

export function MainHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/images/payment-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Pressable style={styles.languageButton}>{/* 之後可換成正式 globe icon */}</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: 86,
    height: 32,
  },

  languageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
