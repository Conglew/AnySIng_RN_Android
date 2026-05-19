import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LanguageValue } from '@/src/shared/i18n/language.store';

type LanguageOption = {
  id: LanguageValue;
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'zh-CN',
    label: '简体中文',
  },
  {
    id: 'zh-TW',
    label: '繁體中文',
  },
  {
    id: 'en',
    label: 'English',
  },
  {
    id: 'ms',
    label: 'Bahasa Melayu',
  },
];

type Props = {
  visible: boolean;
  selectedLanguageId?: LanguageValue;
  onClose: () => void;
  onPressLanguage?: (option: LanguageOption) => void | Promise<void>;
};

export function LanguageSelectModal({
  visible,
  selectedLanguageId = 'zh-TW',
  onClose,
  onPressLanguage,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.languageModalOverlay} onPress={onClose}>
        <BlurView
          intensity={28}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          experimentalBlurMethod="dimezisBlurView"
        />

        <View style={styles.languageModalDarkLayer} />

        <Pressable
          style={styles.languagePopupBox}
          onPress={(event) => {
            event.stopPropagation();
          }}
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const isActive = option.id === selectedLanguageId;

            return (
              <Pressable
                key={option.id}
                style={[styles.languageOptionRow, isActive && styles.languageOptionRowActive]}
                onPress={async () => {
                  await onPressLanguage?.(option);
                }}
              >
                <Text
                  style={[styles.languageOptionText, isActive && styles.languageOptionTextActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  languageModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageModalDarkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  languagePopupBox: {
    width: 485,
    height: 240,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },

  languageOptionRow: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 50,
  },

  languageOptionRowActive: {
    backgroundColor: '#FF7A00',
  },

  languageOptionText: {
    color: '#7C8287',
    fontSize: 16,
    fontWeight: '800',
  },

  languageOptionTextActive: {
    color: '#FFFFFF',
  },
});
