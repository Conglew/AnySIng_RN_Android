import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

type SecondaryCanvasCopy = {
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitButton: string;
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

const REGISTER_COPY: Record<LanguageValue, SecondaryCanvasCopy> = {
  'zh-CN': {
    title: '快速注册账号',
    description: '此电子邮件，将用于未来登录账号使用。',
    emailLabel: '电子邮件',
    emailPlaceholder: 'Example@example.com',
    submitButton: '送出',
  },
  'zh-TW': {
    title: '快速註冊帳號',
    description: '此電子郵件，將用於未來登入帳號使用。',
    emailLabel: '電子郵件',
    emailPlaceholder: 'Example@example.com',
    submitButton: '送出',
  },
  en: {
    title: 'Quick Sign-Up',
    description: 'This email will be used to log in to your account in the future.',
    emailLabel: 'Email',
    emailPlaceholder: 'Example@example.com',
    submitButton: 'Submit',
  },
  ms: {
    title: 'Daftar Pantas',
    description: 'E-mel ini akan digunakan untuk log masuk ke akaun anda pada masa hadapan.',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Example@example.com',
    submitButton: 'Hantar',
  },
};

const FORGOT_PASSWORD_COPY: Record<LanguageValue, SecondaryCanvasCopy> = {
  'zh-CN': {
    title: '放心，我们将帮您找回密码。',
    description:
      '密码至少 8 个字，包含大小写英文和数字。只接受英文字母、数字和常见符号（!@#|>_<）。',
    emailLabel: '电子邮件',
    emailPlaceholder: 'Example@example.com',
    submitButton: '送出',
  },
  'zh-TW': {
    title: '放心，我們將幫您找回密碼。',
    description:
      '密碼至少 8 個字，包含大小寫英文和數字。只接受英文字母、數字和常見符號（!@#|>_<）。',
    emailLabel: '電子郵件',
    emailPlaceholder: 'Example@example.com',
    submitButton: '送出',
  },
  en: {
    title: "Don't worry, we'll help you recover your password.",
    description:
      'Password must be at least 8 characters long,\nmust include A-Z, a-z, 0-9. Only: letters, digits, (!@#|>_<).',
    emailLabel: 'Email',
    emailPlaceholder: 'Example@example.com',
    submitButton: 'Submit',
  },
  ms: {
    title: 'Jangan risau, kami bantu pulihkan kata laluan.',
    description:
      'Kata laluan mesti sekurang-kurangnya 8 aksara\nperlu A-Z, a-z & 0-9. Dibenarkan: huruf, nombor & (!@#|>_<).',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Example@example.com',
    submitButton: 'Hantar',
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
  const [canvasMode, setCanvasMode] = useState<AuthCanvasMode>('login');
  const [isLanguagePanelVisible, setIsLanguagePanelVisible] = useState(false);

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

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const secondaryEmailInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [secondaryEmail, setSecondaryEmail] = useState('');

  const loginCopy = LOGIN_COPY[language];

  const secondaryCopy =
    canvasMode === 'register' ? REGISTER_COPY[language] : FORGOT_PASSWORD_COPY[language];

  const handleLogin = () => {
    console.log('[LoginScreen] login:', {
      language,
      email,
      password,
      rememberMe,
    });

    router.replace('/(tabs)/home');
  };

  const handleOpenRegisterCanvas = () => {
    setCanvasMode('register');
    setSecondaryEmail('');
    setIsLanguagePanelVisible(false);
  };

  const handleOpenForgotPasswordCanvas = () => {
    setCanvasMode('forgotPassword');
    setSecondaryEmail('');
    setIsLanguagePanelVisible(false);
  };

  const handleBackToLoginCanvas = () => {
    setCanvasMode('login');
    setSecondaryEmail('');
    setIsLanguagePanelVisible(false);
  };

  const handleToggleLanguagePanel = () => {
    setIsLanguagePanelVisible((current) => !current);
  };

  const handleSelectLanguage = (nextLanguage: LanguageValue) => {
    setLanguage(nextLanguage);
    setIsLanguagePanelVisible(false);
  };

  const handleSecondarySubmit = () => {
    console.log('[LoginScreen] secondary submit:', {
      canvasMode,
      language,
      email: secondaryEmail,
    });
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
                onChangeText={setEmail}
                onFocus={() => console.log('[LoginScreen] email input focused')}
                onPressIn={() => {
                  emailInputRef.current?.focus();
                }}
                placeholder={loginCopy.emailPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.42)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                focusable={true}
                showSoftInputOnFocus={true}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.passwordLabel}>{loginCopy.passwordLabel}</Text>

              <TextInput
                ref={emailInputRef}
                value={email}
                onChangeText={setEmail}
                onFocus={() => console.log('[LoginScreen] email input focused')}
                onPressIn={() => {
                  emailInputRef.current?.focus();
                }}
                placeholder={loginCopy.emailPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.42)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                focusable={true}
                showSoftInputOnFocus={true}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
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

              <Text style={styles.rememberText}>{loginCopy.rememberMe}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
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
    return (
      <View style={styles.secondaryPage}>
        <Pressable
          style={[styles.backButton, getBackButtonPositionStyle()]}
          onPress={handleBackToLoginCanvas}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.secondaryContent}>
          <Text style={styles.secondaryTitle}>{secondaryCopy.title}</Text>

          <Text style={styles.secondaryDescription}>{secondaryCopy.description}</Text>

          <View style={styles.secondaryInputGroup}>
            <Text style={styles.secondaryLabel}>{secondaryCopy.emailLabel}</Text>

            <TextInput
              ref={secondaryEmailInputRef}
              value={secondaryEmail}
              onChangeText={setSecondaryEmail}
              onFocus={() => console.log('[LoginScreen] secondary email input focused')}
              onPressIn={() => {
                secondaryEmailInputRef.current?.focus();
              }}
              placeholder={secondaryCopy.emailPlaceholder}
              placeholderTextColor="rgba(255, 255, 255, 0.42)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              focusable={true}
              showSoftInputOnFocus={true}
              returnKeyType="done"
              style={styles.secondaryInput}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondarySubmitButton,
              pressed && styles.secondarySubmitButtonPressed,
            ]}
            onPress={handleSecondarySubmit}
          >
            <Text style={styles.secondarySubmitButtonText}>{secondaryCopy.submitButton}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('@/assets/images/language-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {canvasMode === 'login' ? renderLoginCanvas() : renderSecondaryCanvas()}
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
    width: 30,
    height: 30,
  },
  languagePanel: {
    position: 'absolute',
    top: 150,
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
  backButtonChinese: {
    left: 290,
    top: 180,
  },
  // backButtonOtherLanguage: {
  //   left: 280,
  //   top: 164,
  // },
  // backButtonRegisterChinese: {
  //   left: 290,
  //   top: 180,
  // },

  backButtonRegisterOther: {
    left: 350,
    top: 180,
  },
  backButtonRegisterChinese: {
    left: 400,
    top: 175,
  },
  backButtonForgotPasswordChinese: {
    left: 290,
    top: 180,
  },

  backButtonForgotPasswordOther: {
    left: 280,
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
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryDescription: {
    width: 720,
    marginTop: 32,
    marginBottom: 42,
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  secondaryInputGroup: {
    width: 420,
  },
  secondaryLabel: {
    marginBottom: 10,
    color: '#FFFFFF',
    fontSize: 20,
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
});
