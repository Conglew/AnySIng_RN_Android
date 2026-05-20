import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { authClient } from '@/src/services/auth/auth-client';
import {
  clearAuthSession,
  getAccessToken,
  saveAuthSession,
} from '@/src/services/auth/auth-token-store';
import { getRememberedLogin } from '@/src/services/auth/remembered-login-store';

import {
  ActivityIndicator,
  ImageBackground,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

type LanguageOption = {
  label: string;
  value: LanguageValue;
  title: string;
  confirmText: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    label: '简体中文',
    value: 'zh-CN',
    title: '欢迎加入，先选择语言，我们马上开始。',
    confirmText: '确认',
  },
  {
    label: '繁體中文',
    value: 'zh-TW',
    title: '歡迎加入，先選擇語言，我們馬上開始。',
    confirmText: '確認',
  },
  {
    label: 'English',
    value: 'en',
    title: 'Welcome! Please select a language to get started.',
    confirmText: 'Confirm',
  },
  {
    label: 'Bahasa\nMelayu',
    value: 'ms',
    title: 'Selamat datang! Sila pilih bahasa untuk mula.',
    confirmText: 'Sahkan',
  },
];

export default function LanguageSelectScreen() {
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);

  const [isAutoLoginChecking, setIsAutoLoginChecking] = useState(true);
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  const autoLoginAttemptedRef = useRef(false);

  const [selectedLanguageValue, setSelectedLanguageValue] = useState<LanguageValue | null>(null);

  const selectedLanguage = useMemo(() => {
    return LANGUAGE_OPTIONS.find((language) => language.value === selectedLanguageValue) ?? null;
  }, [selectedLanguageValue]);

  useEffect(() => {
    if (autoLoginAttemptedRef.current) {
      return;
    }

    autoLoginAttemptedRef.current = true;

    const tryAutoLogin = async () => {
      try {
        setAutoLoginError(null);

        const existingToken = await getAccessToken();

        if (existingToken) {
          try {
            console.log('[LanguageSelectScreen] existing token found, verifying token');

            // await authClient.me(existingToken);

            console.log('[LanguageSelectScreen] token verified, redirect to home');
            const session = await authClient.me(existingToken);

            console.log('[LanguageSelectScreen] login success');
            console.log('[LanguageSelectScreen] login session:', session);

            InteractionManager.runAfterInteractions(() => {
              setTimeout(() => {
                if (session.currentSubscription) {
                  router.replace('/(tabs)/home');
                } else {
                  router.replace('/payment');
                }
              }, 0);
            });

            return;
          } catch (verifyError) {
            console.log('[LanguageSelectScreen] existing token invalid:', verifyError);

            await clearAuthSession();
          }
        }

        const rememberedLogin = await getRememberedLogin();

        const email = rememberedLogin?.email;
        const password = rememberedLogin?.password;

        if (!email || !password) {
          console.log('[LanguageSelectScreen] no remembered login');
          return;
        }

        console.log('[LanguageSelectScreen] remembered login found, start auto login');

        const session = await authClient.login({
          email,
          password,
        });

        await saveAuthSession(session);

        console.log('[LanguageSelectScreen] auto login success');
        console.log('[LanguageSelectScreen] login session:', session);

        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            if (session.currentSubscription) {
              router.replace('/(tabs)/home');
            } else {
              router.replace('/payment');
            }
          }, 0);
        });
      } catch (error) {
        console.log('[LanguageSelectScreen] auto login failed:', error);

        await clearAuthSession();

        /**
         * 自動登入失敗後，恢復語言選擇畫面。
         * 這裡不要 return，也不要再次 router.replace。
         */
        setAutoLoginError('自動登入失敗，請重新選擇語言後登入。');
      } finally {
        setIsAutoLoginChecking(false);
      }
    };

    tryAutoLogin();
  }, []);

  const displayTitle = selectedLanguage?.title ?? '歡迎加入，先選擇語言，我們馬上開始。';

  const handleSelectLanguage = (language: LanguageOption) => {
    setSelectedLanguageValue(language.value);
  };

  const handleConfirm = () => {
    if (!selectedLanguage) {
      return;
    }

    console.log('[LanguageSelectScreen] confirmed language:', selectedLanguage.value);

    router.replace({
      pathname: '/login',
      params: {
        lang: selectedLanguage.value,
      },
    });
  };

  return (
    <ImageBackground
      source={require('@/assets/images/language-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
      onLoadEnd={() => setIsBackgroundLoaded(true)}
    >
      <View style={styles.overlay}>
        {/* {isBackgroundLoaded && !isAutoLoginChecking ? ( */}
        {!isAutoLoginChecking ? (
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              <Text style={styles.title}>{displayTitle}</Text>

              <View style={styles.languageRow}>
                {LANGUAGE_OPTIONS.map((language) => {
                  const isSelected = language.value === selectedLanguageValue;

                  return (
                    <Pressable
                      key={language.value}
                      style={({ pressed }) => [
                        styles.languageButton,
                        pressed && styles.languageButtonPressed,
                      ]}
                      onPress={() => handleSelectLanguage(language)}
                    >
                      {isSelected ? (
                        <ImageBackground
                          source={require('@/assets/images/language-slc-btn-bg.png')}
                          style={styles.languageButtonImage}
                          imageStyle={styles.languageButtonImageStyle}
                          resizeMode="cover"
                        >
                          <Text style={styles.languageText}>{language.label}</Text>
                        </ImageBackground>
                      ) : (
                        <View style={styles.languageButtonInner}>
                          <Text style={styles.languageText}>{language.label}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {selectedLanguage ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.confirmButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>{selectedLanguage.confirmText}</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmButtonPlaceholder} />
              )}
            </View>
          </SafeAreaView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 48,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  languageButton: {
    width: 118,
    height: 118,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 59,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  languageButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonImageStyle: {
    borderRadius: 59,
  },
  languageButtonPressed: {
    transform: [
      {
        scale: 0.96,
      },
    ],
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '500',
    lineHeight: 27,
    textAlign: 'center',
  },
  confirmButton: {
    minWidth: 132,
    height: 48,
    marginTop: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#FF7A00',
    paddingHorizontal: 32,
  },
  confirmButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonPlaceholder: {
    height: 48,
    marginTop: 42,
  },
});
