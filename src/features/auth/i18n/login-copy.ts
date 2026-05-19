import type { LanguageValue } from '@/src/shared/i18n/language.store';

export type LoginCopy = {
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

export const LOGIN_COPY: Record<LanguageValue, LoginCopy> = {
  'zh-CN': {
    register: '前往注册',
    emailLabel: '账号',
    emailPlaceholder: '请输入电子邮件',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
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
    passwordPlaceholder: '請輸入密碼',
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
    passwordPlaceholder: 'Please enter your password',
    rememberMe: 'Remember me',
    loginButton: 'Login',
    forgotPassword: 'Forgot password',
    welcomeTitle: 'Welcome Back!',
    welcomeSubtitle: 'Log in and start singing.',
  },
  ms: {
    register: 'Daftar',
    emailLabel: 'E-mel',
    emailPlaceholder: 'Sila masukkan e-mel anda',
    passwordLabel: 'Kata laluan',
    passwordPlaceholder: 'Sila masukkan kata laluan',
    rememberMe: 'Ingat saya',
    loginButton: 'Log Masuk',
    forgotPassword: 'Terlupa kata laluan',
    welcomeTitle: 'Selamat kembali!',
    welcomeSubtitle: 'Log masuk dan mula menyanyi.',
  },
};
