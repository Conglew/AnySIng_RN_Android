import { Slot } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { MainHeader } from '@/src/features/main/components/main-header';
import { MainFooter } from '@/src/features/main/components/main-footer';

export default function TabsLayout() {
  return (
    <ImageBackground style={styles.background} resizeMode="cover">
      <View style={styles.page}>
        <MainHeader />

        <View style={styles.content}>
          <Slot />
        </View>

        <MainFooter />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },

  page: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
});
