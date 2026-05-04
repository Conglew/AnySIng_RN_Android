import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LanguageValue = 'zh-CN' | 'zh-TW' | 'en' | 'ms';

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

type LoginLanguageOption = {
  label: string;
  value: LanguageValue;
};

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

const LOGIN_COPY: Record<LanguageValue, LoginCopy> = {
  'zh-CN': {
    register: '前往注册',
    emailLabel: '账号',
    emailPlaceholder: '请输入电子邮件',
    passwordLabel: '密码',
    passwordPlaceholder: '6-12位英数字',
    rememberMe: '记住账号密码',
    loginButton: '登录',
    forgotPassword: '忘记密码',
    welcomeTitle: '欢迎回来',
    welcomeSubtitle: '登录立即开唱',
  },
  'zh-TW': {
    register: '前往註冊',
    emailLabel: '帳號',
    emailPlaceholder: '請輸入電子郵件',
    passwordLabel: '密碼',
    passwordPlaceholder: '6-12位英數字',
    rememberMe: '記住帳號密碼',
    loginButton: '登入',
    forgotPassword: '忘記密碼',
    welcomeTitle: '歡迎回來',
    welcomeSubtitle: '登入立即開唱',
  },
  en: {
    register: 'Register',
    emailLabel: 'Email',
    emailPlaceholder: 'Please enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: '6-12 alphanumeric characters',
    rememberMe: 'Remember me',
    loginButton: 'Login',
    forgotPassword: 'Forgot password',
    welcomeTitle: 'Welcome Back!',
    welcomeSubtitle: 'Log in && Singing.',
  },
  ms: {
    register: 'Daftar',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Sila masukkan e-mel anda',
    passwordLabel: 'Kata laluan',
    passwordPlaceholder: '6-12 aksara alfanumerik',
    rememberMe: 'Ingat saya',
    loginButton: 'Log Masuk',
    forgotPassword: 'Terlupa kata laluan',
    welcomeTitle: 'Selamat kembali!',
    welcomeSubtitle: 'Log Masuk Mula Menyanyi.',
  },
};

function normalizeLanguage(value: unknown): LanguageValue {
  if (value === 'zh-CN' || value === 'zh-TW' || value === 'en' || value === 'ms') {
    return value;
  }

  return 'zh-TW';
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ lang?: string }>();

  const initialLanguage = useMemo(() => {
    return normalizeLanguage(params.lang);
  }, [params.lang]);

  const [language, setLanguage] = useState<LanguageValue>(initialLanguage);
  const [isLanguagePanelVisible, setIsLanguagePanelVisible] = useState(false);

  const copy = LOGIN_COPY[language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = () => {
    console.log('[LoginScreen] login:', {
      language,
      email,
      password,
      rememberMe,
    });

    router.replace('/(tabs)/home');
  };

  const handleRegister = () => {
    console.log('[LoginScreen] register pressed');
  };

  const handleToggleLanguagePanel = () => {
    setIsLanguagePanelVisible((current) => !current);
  };

  const handleSelectLanguage = (nextLanguage: LanguageValue) => {
    setLanguage(nextLanguage);
    setIsLanguagePanelVisible(false);
  };

  const handleForgotPassword = () => {
    console.log('[LoginScreen] forgot password pressed');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/language-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.page}>
            <View style={styles.leftPanel}>
              <Image
                source={require('@/assets/images/login-Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />

              <Text style={styles.welcomeTitle}>{copy.welcomeTitle}</Text>
              <Text style={styles.welcomeSubtitle}>{copy.welcomeSubtitle}</Text>
            </View>

            <View style={styles.rightPanel}>
              {/* <View style={styles.topActionRow}>
                <Pressable onPress={handleRegister}>
                  <Text style={styles.registerText}>{copy.register}</Text>
                </Pressable>

                <Pressable
                  style={styles.languageIconButton}
                  onPress={handleToggleLanguagePanel}
                >
                  <Image
                    source={require('@/assets/images/login-language-btn.png')}
                    style={styles.languageIconImage}
                    resizeMode="contain"
                  />
                </Pressable>
              </View> */}

              {isLanguagePanelVisible ? (
                <View style={styles.languagePanel}>
                  {LOGIN_LANGUAGE_OPTIONS.map((option) => {
                    const isSelected = option.value === language;

                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.languagePanelItem,
                          isSelected && styles.languagePanelItemSelected,
                        ]}
                        onPress={() => handleSelectLanguage(option.value)}
                      >
                        <Text style={styles.languagePanelText}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.form}>
              <View style={styles.inputGroup}>
  <View style={styles.emailHeaderRow}>
    <Text style={styles.label}>{copy.emailLabel}</Text>

    <View style={styles.topActionRow}>
      <Pressable onPress={handleRegister}>
        <Text style={styles.registerText}>{copy.register}</Text>
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
    value={email}
    onChangeText={setEmail}
    placeholder={copy.emailPlaceholder}
    placeholderTextColor="rgba(255, 255, 255, 0.42)"
    keyboardType="email-address"
    autoCapitalize="none"
    style={styles.input}
  />
</View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{copy.passwordLabel}</Text>

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={copy.passwordPlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                    secureTextEntry
                    style={styles.input}
                  />
                </View>

                <Pressable
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((current) => !current)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>

                  <Text style={styles.rememberText}>{copy.rememberMe}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && styles.loginButtonPressed,
                  ]}
                  onPress={handleLogin}
                >
                  <Text style={styles.loginButtonText}>{copy.loginButton}</Text>
                </Pressable>

                <Pressable onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>{copy.forgotPassword}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
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
    paddingTop: 0,
    paddingBottom: 100,
  },
  logoImage: {
    width: 1280,
    height: 480,
    marginBottom: -180,
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
    paddingTop: 46,
    paddingRight: 88,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 20,
    marginBottom: 6,
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
    width: 30,
    height: 30,
  },
  languagePanel: {
    position: 'absolute',
    top: 112,
    right: 88,
    width: 260,
    height: 240,
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: 'transparent',
    zIndex: 20,
    elevation: 20,
  },
  languagePanelItem: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 52,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  languagePanelItemSelected: {
    backgroundColor: '#FF7A00',
  },
  languagePanelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginTop: 20,
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
    marginBottom: 10,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 22,
    fontWeight: '600',
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
});