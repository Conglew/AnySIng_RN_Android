import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { NowPlayingMarquee } from '@/src/features/main/components/now-playing-marquee';

import { LanguageSelectModal } from '@/src/features/main/components/language-select-modal';

import { useAppLanguageStore } from '@/src/shared/i18n/language.store';

type Props = {
  showNowPlayingMarquee?: boolean;
};

export function MainHeader({ showNowPlayingMarquee = true }: Props) {
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const language = useAppLanguageStore((state) => state.language);
  const setLanguage = useAppLanguageStore((state) => state.setLanguage);

  return (
    <View style={styles.header}>
      <View pointerEvents="none">
        <Image
          source={require('@/assets/images/payment-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {showNowPlayingMarquee ? <NowPlayingMarquee /> : <View style={styles.marqueePlaceholder} />}

      <Pressable
        style={styles.languageButton}
        onPress={() => {
          setIsLanguageModalVisible(true);
        }}
      >
        <Image
          source={require('@/assets/images/home-language-btn.png')}
          style={styles.languageIcon}
          resizeMode="contain"
        />
      </Pressable>

      <LanguageSelectModal
        visible={isLanguageModalVisible}
        selectedLanguageId={language}
        onClose={() => {
          setIsLanguageModalVisible(false);
        }}
        onPressLanguage={async (option) => {
          await setLanguage(option.id);
          setIsLanguageModalVisible(false);
        }}
      />
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
    // marginLeft: -210,
    marginLeft: -415,
    transform: [{ translateX: 210 }],
    marginTop: 0,
  },

  marqueePlaceholder: {
    flex: 1,
    height: 38,
    marginHorizontal: 20,
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
