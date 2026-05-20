import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '@/src/services/auth/auth-client';
import { saveAuthSession } from '@/src/services/auth/auth-token-store';
import {
  clearRememberedLogin,
  getRememberedLogin,
  saveRememberedLogin,
} from '@/src/services/auth/remembered-login-store';

import { useAppLanguageStore, normalizeLanguage } from '@/src/shared/i18n/language.store';
import { LOGIN_COPY } from '@/src/features/auth/i18n/login-copy';

import { Ionicons } from '@expo/vector-icons';

import { ForgotPasswordCanvas } from '@/src/features/auth/components/forgot-password-canvas';
import { RegisterCanvas } from '@/src/features/auth/components/register-canvas';

import { CustomEmailKeyboard } from '@/src/shared/components/custom-email-keyboard';
// import { CustomNumberKeyboard } from '@/src/shared/components/custom-number-keyboard';

type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

type AuthCanvasMode = 'login' | 'register' | 'forgotPassword';

type LoginCopy = {
  register: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  loginButton: string;
  forgotPassword: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
};

// type SecondaryCanvasCopy = {
//   title: string;
//   descriptionBefore: string;
//   descriptionHighlight: string;
//   descriptionAfter: string;
//   emailLabel: string;
//   emailPlaceholder: string;
//   submitButton: string;
// };

type LoginLanguageOption = {
  label: string;
  value: LanguageValue;
};

type LoginKeyboardTarget = 'email' | 'password' | null;

const LOGIN_LANGUAGE_OPTIONS: LoginLanguageOption[] = [
  {
    label: '簡體中文',
    value: 'zh-CN',
  },
  {
    label: '繁體中文',
    value: 'zh-TW',
  },
  {
    label: 'English',
    value: 'en',
  },
  {
    label: 'Bahasa Melayu',
    value: 'ms',
  },
];

// const LOGIN_COPY: Record<LanguageValue, LoginCopy> = {
//   'zh-CN': {
//     register: '前往注册',
//     emailLabel: '账号',
//     emailPlaceholder: '请输入电子邮件',
//     passwordLabel: '密码',
//     passwordPlaceholder: '请输入密码',
//     rememberMe: '记住账号密码',
//     loginButton: '登录',
//     forgotPassword: '忘记密码',
//     welcomeTitle: '欢迎回来',
//     welcomeSubtitle: '登录立即开唱',
//   },
//   'zh-TW': {
//     register: '前往註冊',
//     emailLabel: '帳號',
//     emailPlaceholder: '請輸入電子郵件',
//     passwordLabel: '密碼',
//     passwordPlaceholder: '請輸入密碼',
//     rememberMe: '記住帳號密碼',
//     loginButton: '登入',
//     forgotPassword: '忘記密碼',
//     welcomeTitle: '歡迎回來',
//     welcomeSubtitle: '登入立即開唱',
//   },
//   en: {
//     register: 'Register',
//     emailLabel: 'Email',
//     emailPlaceholder: 'Please enter your email',
//     passwordLabel: 'Password',
//     passwordPlaceholder: 'Please enter your password',
//     rememberMe: 'Remember me',
//     loginButton: 'Login',
//     forgotPassword: 'Forgot password',
//     welcomeTitle: 'Welcome Back!',
//     welcomeSubtitle: 'Log in && Singing.',
//   },
//   ms: {
//     register: 'Daftar',
//     emailLabel: 'E-mel',
//     emailPlaceholder: 'Sila masukkan e-mel anda',
//     passwordLabel: 'Kata laluan',
//     passwordPlaceholder: 'Sila masukkan kata laluan',
//     rememberMe: 'Ingat saya',
//     loginButton: 'Log Masuk',
//     forgotPassword: 'Terlupa kata laluan',
//     welcomeTitle: 'Selamat kembali!',
//     welcomeSubtitle: 'Log Masuk Mula Menyanyi.',
//   },
// };

// const REGISTER_COPY: Record<LanguageValue, SecondaryCanvasCopy> = {
//   'zh-CN': {
//     title: '快速注册账号',
//     descriptionBefore: '此电子邮件将用于未来登录账号使用。',
//     descriptionHighlight: '',
//     descriptionAfter: '',
//     emailLabel: '电子邮件',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: '送出',
//   },
//   'zh-TW': {
//     title: '快速註冊帳號',
//     descriptionBefore: '此電子郵件將用於未來登入帳號使用。',
//     descriptionHighlight: '',
//     descriptionAfter: '',
//     emailLabel: '電子郵件',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: '送出',
//   },
//   en: {
//     title: 'Quick Sign-Up',
//     descriptionBefore: 'This email will be used to log in to your account in the future.',
//     descriptionHighlight: '',
//     descriptionAfter: '',
//     emailLabel: 'Email',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: 'Submit',
//   },
//   ms: {
//     title: 'Daftar Pantas',
//     descriptionBefore: 'E-mel ini akan digunakan untuk log masuk ke akaun anda pada masa hadapan.',
//     descriptionHighlight: '',
//     descriptionAfter: '',
//     emailLabel: 'E-mel',
//     emailPlaceholder: 'Example@example.com',
//     submitButton: 'Hantar',
//   },
// };

// function normalizeLanguage(value: unknown): LanguageValue {
//   if (value === 'zh-CN' || value === 'zh-TW' || value === 'en' || value === 'ms') {
//     return value;
//   }

//   return 'zh-TW';
// }

export default function LoginScreen() {
  const params = useLocalSearchParams<{ lang?: string }>();

  const initialLanguage = useMemo(() => {
    return normalizeLanguage(params.lang);
  }, [params.lang]);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const secondaryEmailInputRef = useRef<TextInput>(null);

  const [language, setLanguage] = useState<LanguageValue>(initialLanguage);

  useEffect(() => {
    if (!params.lang) {
      return;
    }

    setLanguage(normalizeLanguage(params.lang));
  }, [params.lang, setLanguage]);

  const [canvasMode, setCanvasMode] = useState<AuthCanvasMode>('login');
  const [isLanguagePanelVisible, setIsLanguagePanelVisible] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [activeLoginKeyboardTarget, setActiveLoginKeyboardTarget] =
    useState<LoginKeyboardTarget>(null);

  const [rememberMe, setRememberMe] = useState(true);
  // const [secondaryEmail, setSecondaryEmail] = useState('');

  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const pushDebugLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();

    setDebugLogs((currentLogs) => {
      const nextLogs = [`${time} ${message}`, ...currentLogs];

      return nextLogs.slice(0, 12);
    });

    console.log(message);
  }, []);

  const keyboardVisibleRef = useRef(false);

  useEffect(() => {
    const keyboardWillShowSub = Keyboard.addListener('keyboardWillShow', (event) => {
      keyboardVisibleRef.current = true;
      pushDebugLog(`[Keyboard] keyboardWillShow height=${event.endCoordinates.height}`);
    });

    const keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardVisibleRef.current = false;
      pushDebugLog(`[Keyboard] keyboardDidShow height=${event.endCoordinates.height}`);
    });

    const keyboardWillHideSub = Keyboard.addListener('keyboardWillHide', () => {
      pushDebugLog('[Keyboard] keyboardWillHide');
    });

    const keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', () => {
      pushDebugLog('[Keyboard] keyboardDidHide');
    });

    return () => {
      keyboardWillShowSub.remove();
      keyboardDidShowSub.remove();
      keyboardWillHideSub.remove();
      keyboardDidHideSub.remove();
    };
  }, []);

  useEffect(() => {
    const restoreRememberedLogin = async () => {
      try {
        const rememberedLogin = await getRememberedLogin();

        if (!rememberedLogin) {
          pushDebugLog('[RememberLogin] no remembered login');
          return;
        }

        setEmail(rememberedLogin.email);
        setPassword(rememberedLogin.password);
        setRememberMe(rememberedLogin.rememberMe);

        pushDebugLog('[RememberLogin] restored email and password');
      } catch (error) {
        pushDebugLog(
          `[RememberLogin] restore failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    };

    restoreRememberedLogin();
  }, [pushDebugLog]);

  useEffect(() => {
    pushDebugLog(`[Canvas] mode=${canvasMode}, language=${language}`);
  }, [canvasMode, language, pushDebugLog]);

  const loginCopy = LOGIN_COPY[language];

  // const secondaryCopy = REGISTER_COPY[language];

  const getBackButtonPositionStyle = () => {
    const isChineseLanguage = language === 'zh-CN' || language === 'zh-TW';

    if (canvasMode === 'register') {
      return isChineseLanguage ? styles.backButtonRegisterChinese : styles.backButtonRegisterOther;
    }

    if (canvasMode === 'forgotPassword') {
      return isChineseLanguage
        ? styles.backButtonForgotPasswordChinese
        : styles.backButtonForgotPasswordOther;
    }

    return styles.backButtonRegisterChinese;
  };

  const handleLogin = async () => {
    if (isLoginSubmitting) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      pushDebugLog('[LoginScreen] login failed: email or password is empty');
      return;
    }

    setIsLoginSubmitting(true);
    pushDebugLog('[LoginScreen] login pressed');

    try {
      const session = await authClient.login({
        email: normalizedEmail,
        password,
      });

      await saveAuthSession(session);

      if (rememberMe) {
        await saveRememberedLogin({
          email: normalizedEmail,
          password,
        });

        pushDebugLog('[RememberLogin] saved email and password');
      } else {
        await clearRememberedLogin();

        pushDebugLog('[RememberLogin] cleared remembered login');
      }

      pushDebugLog('[LoginScreen] login success');

      console.log('[LoginScreen] login success');
      console.log('[LoginScreen] login session:', session);

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
      const message = error instanceof Error ? error.message : 'Unknown login error.';

      pushDebugLog(`[LoginScreen] login failed: ${message}`);

      console.log('[LoginScreen] login error:', error);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleOpenRegisterCanvas = () => {
    setActiveLoginKeyboardTarget(null);
    pushDebugLog('[LoginScreen] open register canvas');
    setCanvasMode('register');
    setIsLanguagePanelVisible(false);
  };

  const handleOpenForgotPasswordCanvas = () => {
    setActiveLoginKeyboardTarget(null);
    pushDebugLog('[LoginScreen] open forgot password canvas');
    setCanvasMode('forgotPassword');
    setIsLanguagePanelVisible(false);
  };

  const handleBackToLoginCanvas = () => {
    pushDebugLog('[LoginScreen] back to login canvas');
    setCanvasMode('login');
    setActiveLoginKeyboardTarget(null);
    setIsLanguagePanelVisible(false);
  };

  const handleToggleLanguagePanel = () => {
    pushDebugLog('[LoginScreen] toggle language panel');
    setIsLanguagePanelVisible((current) => !current);
  };

  const handleSelectLanguage = async (nextLanguage: LanguageValue) => {
    pushDebugLog(`[LoginScreen] select language=${nextLanguage}`);
    await setLanguage(nextLanguage);
    setIsLanguagePanelVisible(false);
  };

  // const handleSecondarySubmit = () => {
  //   pushDebugLog(`[LoginScreen] secondary submit mode=${canvasMode}`);

  //   console.log('[LoginScreen] secondary submit:', {
  //     canvasMode,
  //     language,
  //     email: secondaryEmail,
  //   });
  // };

  const renderLoginCustomKeyboard = () => {
    return (
      <>
        <CustomEmailKeyboard
          visible={activeLoginKeyboardTarget === 'email'}
          onInput={(value) => {
            setEmail((current) => current + value);
          }}
          onBackspace={() => {
            setEmail((current) => current.slice(0, -1));
          }}
          onDone={() => {
            setActiveLoginKeyboardTarget(null);
          }}
          offsetY={0}
        />

        <CustomEmailKeyboard
          visible={activeLoginKeyboardTarget === 'password'}
          onInput={(value) => {
            setPassword((current) => current + value);
          }}
          onBackspace={() => {
            setPassword((current) => current.slice(0, -1));
          }}
          onDone={() => {
            setActiveLoginKeyboardTarget(null);
          }}
          offsetY={0}
        />
      </>
    );
  };

  const renderLanguagePanel = () => {
    if (!isLanguagePanelVisible) {
      return null;
    }

    return (
      <View style={styles.languagePanel}>
        {LOGIN_LANGUAGE_OPTIONS.map((option) => {
          const isSelected = option.value === language;

          return (
            <Pressable
              key={option.value}
              style={[styles.languagePanelItem, isSelected && styles.languagePanelItemSelected]}
              onPress={() => handleSelectLanguage(option.value)}
            >
              <Text style={styles.languagePanelText}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderDebugPanel = () => {
    return (
      <View style={styles.debugPanel} pointerEvents="none">
        <Text style={styles.debugTitle}>Debug Log</Text>

        {debugLogs.map((log, index) => (
          <Text key={`${log}-${index}`} style={styles.debugText}>
            {log}
          </Text>
        ))}
      </View>
    );
  };

  const renderFullScreenLoading = () => {
    if (!isLoginSubmitting) {
      return null;
    }

    return (
      <View style={styles.fullScreenLoading} pointerEvents="auto">
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  };

  const renderLoginCanvas = () => {
    return (
      <View style={styles.page}>
        <View style={styles.leftPanel}>
          <Image
            source={require('@/assets/images/login-Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.welcomeTitle}>{loginCopy.welcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{loginCopy.welcomeSubtitle}</Text>
        </View>

        <View style={styles.rightPanel}>
          {renderLanguagePanel()}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.emailHeaderRow}>
                <Text style={styles.label}>{loginCopy.emailLabel}</Text>

                <View style={styles.topActionRow}>
                  <Pressable onPress={handleOpenRegisterCanvas}>
                    <Text style={styles.registerText}>{loginCopy.register}</Text>
                  </Pressable>

                  <Pressable style={styles.languageIconButton} onPress={handleToggleLanguagePanel}>
                    <Image
                      source={require('@/assets/images/login-language-btn.png')}
                      style={styles.languageIconImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
              </View>

              <TextInput
                ref={emailInputRef}
                value={email}
                onChangeText={() => {
                  // 不使用原生鍵盤輸入，所以這裡不用處理
                }}
                onPressIn={() => {
                  pushDebugLog('[EmailInput] custom keyboard open');
                  setActiveLoginKeyboardTarget('email');
                }}
                placeholder={loginCopy.emailPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.42)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                showSoftInputOnFocus={false}
                caretHidden={false}
                selectionColor="#FF7A00"
                cursorColor="#FF7A00"
                returnKeyType="next"
                style={styles.input}
              />
            </View>

            {/* <View style={styles.inputGroup}>
              <Text style={styles.passwordLabel}>{loginCopy.passwordLabel}</Text>

              <TextInput
                ref={passwordInputRef}
                value={password}
                onChangeText={() => {
                  // 不使用原生鍵盤輸入，所以這裡不用處理
                }}
                onPressIn={() => {
                  pushDebugLog('[PasswordInput] custom keyboard open');
                  setActiveLoginKeyboardTarget('password');
                }}
                placeholder={loginCopy.passwordPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.42)"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                showSoftInputOnFocus={false}
                caretHidden={true}
                returnKeyType="done"
                style={styles.input}
              />
            </View> */}

            <View style={styles.inputGroup}>
              <Text style={styles.passwordLabel}>{loginCopy.passwordLabel}</Text>

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={() => {
                    // 不使用原生鍵盤輸入，所以這裡不用處理
                  }}
                  onPressIn={() => {
                    pushDebugLog('[PasswordInput] custom keyboard open');
                    setActiveLoginKeyboardTarget('password');
                  }}
                  placeholder={loginCopy.passwordPlaceholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  showSoftInputOnFocus={false}
                  caretHidden={false}
                  selectionColor="#FF7A00"
                  cursorColor="#FF7A00"
                  returnKeyType="done"
                  style={[styles.input, styles.passwordInput]}
                />

                {password.length > 0 ? (
                  <Pressable
                    style={styles.passwordEyeButton}
                    hitSlop={10}
                    onPress={() => {
                      setIsPasswordVisible((current) => !current);
                    }}
                  >
                    <Ionicons
                      name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={24}
                      color="rgba(255, 255, 255, 0.72)"
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberMe((current) => !current)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>

              <Text style={styles.rememberText}>{loginCopy.rememberMe}</Text>
            </Pressable>

            <Pressable
              disabled={isLoginSubmitting}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
                isLoginSubmitting && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>{loginCopy.loginButton}</Text>
            </Pressable>

            <Pressable onPress={handleOpenForgotPasswordCanvas}>
              <Text style={styles.forgotPasswordText}>{loginCopy.forgotPassword}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderSecondaryCanvas = () => {
    if (canvasMode === 'forgotPassword') {
      return (
        <ForgotPasswordCanvas
          language={language}
          styles={styles}
          backButtonPositionStyle={getBackButtonPositionStyle()}
          onBackToLogin={handleBackToLoginCanvas}
          pushDebugLog={pushDebugLog}
        />
      );
    }

    if (canvasMode === 'register') {
      return (
        <RegisterCanvas
          language={language}
          styles={styles}
          backButtonPositionStyle={getBackButtonPositionStyle()}
          onBackToLogin={handleBackToLoginCanvas}
          pushDebugLog={pushDebugLog}
        />
      );
    }

    return null;
  };

  return (
    <ImageBackground
      source={require('@/assets/images/language-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View
        style={styles.overlay}
        onLayout={(event) => {
          const { width, height, x, y } = event.nativeEvent.layout;

          pushDebugLog(`[Overlay] layout width=${width}, height=${height}, x=${x}, y=${y}`);
        }}
      >
        <SafeAreaView style={styles.safeArea}>
          {canvasMode === 'login' ? renderLoginCanvas() : renderSecondaryCanvas()}
        </SafeAreaView>

        {/* {renderDebugPanel()} */}
        {renderFullScreenLoading()}
        {/* {renderLeaveConfirmModal()} */}
        {canvasMode === 'login' ? renderLoginCustomKeyboard() : null}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  safeArea: {
    flex: 1,
  },
  page: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 88,
    paddingTop: 80,
    paddingBottom: 100,
  },
  logoImage: {
    width: 1280,
    height: 480,
    marginBottom: -170,
    marginLeft: -450,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 42,
  },
  welcomeSubtitle: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 42,
  },
  rightPanel: {
    position: 'relative',
    width: 520,
    paddingTop: 106,
    paddingRight: 88,
  },
  form: {
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 28,
  },
  emailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 22,
    fontWeight: '600',
  },
  passwordLabel: {
    marginBottom: 10,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 22,
    fontWeight: '600',
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  registerText: {
    color: '#FF7A00',
    fontSize: 20,
    fontWeight: '700',
  },
  languageIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageIconImage: {
    width: 34,
    height: 34,
  },
  languagePanel: {
    position: 'absolute',
    top: 150,
    right: 88,
    width: 260,
    height: 240,
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    zIndex: 20,
    elevation: 20,
  },
  languagePanelItem: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  languagePanelItemSelected: {
    backgroundColor: 'rgb(255, 123, 0)',
  },
  languagePanelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 29,
    paddingHorizontal: 26,
    color: '#FFFFFF',
    fontSize: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  rememberRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 42,
    paddingVertical: 6,
  },
  checkbox: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkboxMark: {
    color: '#6F6F6F',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  rememberText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 21,
    fontWeight: '500',
  },
  loginButton: {
    alignSelf: 'center',
    width: 306,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#FF7A00',
  },
  loginButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
  },
  forgotPasswordText: {
    marginTop: 24,
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryPage: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 10,
  },
  backButtonRegisterChinese: {
    left: 400,
    top: 165,
  },
  backButtonRegisterOther: {
    left: 350,
    top: 165,
  },
  backButtonForgotPasswordChinese: {
    left: 260,
    top: 160,
  },
  backButtonForgotPasswordOther: {
    left: 230,
    top: 160,
  },
  backButtonText: {
    marginTop: -3,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 36,
  },
  secondaryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 36,
  },
  secondaryTitle: {
    width: 720,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryDescription: {
    width: 720,
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  secondaryInputGroup: {
    width: 420,
  },
  secondaryLabel: {
    marginBottom: 10,
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '600',
  },
  secondaryInput: {
    height: 54,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 27,
    paddingHorizontal: 24,
    color: '#FFFFFF',
    fontSize: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  secondarySubmitButton: {
    width: 250,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    borderRadius: 27,
    backgroundColor: '#FF7A00',
  },
  secondarySubmitButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  secondarySubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  debugPanel: {
    position: 'absolute',
    left: 48,
    top: 48,
    width: 420,
    maxHeight: 260,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  debugTitle: {
    marginBottom: 6,
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '800',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },

  loginButtonDisabled: {
    opacity: 0.56,
  },
  fullScreenLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    zIndex: 10000,
    elevation: 10000,
  },
  loadingCard: {
    minWidth: 180,
    minHeight: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    // backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryDescriptionHighlight: {
    color: '#FF7A00',
    fontWeight: '700',
  },
  secondarySubmitButtonLoading: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },

  forgotNoticeText: {
    color: '#FF7A00',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },

  forgotEmailCenterBlock: {
    position: 'relative',
    width: 720,
    alignItems: 'center',
  },

  forgotEmailInputGroup: {
    width: 420,
  },
  forgotTitleSlot: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  forgotDescriptionSlot: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resendSlotAbsolute: {
    position: 'absolute',
    left: 590,
    bottom: 20,
    width: 220,
    justifyContent: 'center',
  },

  resendText: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontSize: 14,
    fontWeight: '500',
  },

  verificationArea: {
    width: 420,
  },

  verificationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  verificationLabel: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '600',
  },

  verificationHint: {
    marginLeft: 8,
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 20,
    fontWeight: '500',
  },

  verificationErrorText: {
    marginBottom: 8,
    color: '#FF4D36',
    fontSize: 13,
    fontWeight: '600',
  },

  verificationCodePressArea: {
    position: 'relative',
  },

  hiddenVerificationCodeInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  verificationCodeRow: {
    flexDirection: 'row',
    gap: 20,
  },

  verificationCodeInput: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  verificationCodeDigitText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },

  verificationCodeInputError: {
    borderColor: '#FF4D36',
  },

  resetPasswordArea: {
    width: 950,
    alignItems: 'center',
    paddingBottom: 170,
  },

  resetPasswordTitle: {
    color: '#B2B6BA',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },

  resetPasswordDescription: {
    width: 720,
    marginTop: 22,
    marginBottom: 36,
    color: '#7C8287',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },

  resetPasswordRow: {
    width: 950,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },

  resetPasswordInputGroup: {
    width: 475,
  },

  resetPasswordInput: {
    width: 475,
    height: 68,
  },

  inputError: {
    borderColor: '#FF4D36',
  },

  fieldErrorText: {
    marginTop: 8,
    color: '#FF4D36',
    fontSize: 13,
    fontWeight: '600',
  },

  forgotSuccessContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  forgotSuccessText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  confirmModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },

  confirmModalCard: {
    width: 420,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  confirmModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  confirmModalDescription: {
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 14,
    textAlign: 'center',
  },

  confirmModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 14,
  },

  confirmModalGhostButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  confirmModalGhostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  confirmModalPrimaryButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FF7A00',
  },

  confirmModalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotActionSlot: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },

  hiddenActionButton: {
    opacity: 0,
  },

  disabledPasswordInput: {
    opacity: 0.56,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  passwordInputWrapper: {
    position: 'relative',
  },

  passwordInput: {
    paddingRight: 62,
  },

  passwordEyeButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
