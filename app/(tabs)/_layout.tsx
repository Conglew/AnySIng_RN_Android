import { Slot } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainFooter } from '@/src/features/main/components/main-footer';
import { MainHeader } from '@/src/features/main/components/main-header';

export default function TabsLayout() {
  return (
    <ImageBackground
      style={styles.background}
      source={require('@/assets/images/home-background.png')}
      resizeMode="cover"
    >
      <View style={styles.page}>
        <SafeAreaView style={styles.footerSafeArea} edges={['top']}>
          <MainHeader />
        </SafeAreaView>

        <View style={styles.content}>
          <Slot />
        </View>

        <SafeAreaView style={styles.footerSafeArea} edges={['bottom']}>
          <MainFooter />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // backgroundColor: '#000000',
  },

  page: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 32,
  },

  footerSafeArea: {
    backgroundColor: '#000000',
  },
});
